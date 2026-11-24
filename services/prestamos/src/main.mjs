import { PrismaClient } from '../generated/client/index.js';
import { appFor,finish,contracts,auth,admin,internal,owner,call,z,id,money,Decimal,fail } from '../../../shared/http.mjs';
const db=new PrismaClient();const app=appFor('prestamos',db);
export function installment(amount,rate,months){const p=new Decimal(amount),r=new Decimal(rate).div(1200);return (r.isZero()?p.div(months):p.mul(r).div(new Decimal(1).minus(new Decimal(1).plus(r).pow(-months)))).toDecimalPlaces(2,Decimal.ROUND_HALF_UP).toFixed(2);}
const terms=z.object({amount:money,rate:z.string().regex(/^\d{1,2}(\.\d{1,4})?$/).refine(v=>new Decimal(v).lte(60),'Tasa anual máxima 60%'),months:z.number().int().min(1).max(360),notes:z.string().max(300).default('')}).strict();
const get=async tx=>{const l=await tx.loan.findUnique({where:{id:tx.loanId}});return l;};
app.get('/internal/obligations/:id',internal,async(req,res)=>res.json({pending:await db.loan.count({where:{clientId:id.parse(req.params.id),status:{in:['SOLICITADO','EN_REVISION','APROBADO','DESEMBOLSADO']}}})>0}));
app.get('/loans',auth,async(req,res)=>res.json(await db.loan.findMany({where:req.user.role==='ADMIN'?{}:{clientId:req.user.clientId},orderBy:{createdAt:'desc'}})));
app.post('/loans',auth,async(req,res)=>{
 const b=terms.extend({clientId:id.optional()}).parse(req.body);const clientId=req.user.role==='ADMIN'?b.clientId||req.user.clientId:req.user.clientId;
 if(req.user.role==='ADMIN'&&!b.clientId)fail(422,'Seleccione un cliente');if(req.user.role!=='ADMIN'&&b.clientId&&b.clientId!==req.user.clientId)fail(403,'No puede solicitar para otro cliente');await call('clientes',`/internal/clients/${clientId}`);
 const {clientId:unused,...data}=b;res.status(201).json(await db.$transaction(async tx=>{const l=await tx.loan.create({data:{...data,clientId,installment:installment(b.amount,b.rate,b.months)}});await tx.audit.create({data:{actor:req.user.id,action:'SOLICITUD',resource:l.id}});return l;}));
});
app.get('/loans/:id',auth,async(req,res)=>{const l=await db.loan.findUnique({where:{id:id.parse(req.params.id)}});if(!l)fail(404,'Préstamo no encontrado');owner(req.user,l.clientId);res.json(l);});
async function change(req,cancel){return db.$transaction(async tx=>{
 const loanId=id.parse(req.params.id);await tx.$queryRaw`SELECT id FROM "Loan" WHERE id=${loanId} FOR UPDATE`;
 const l=await tx.loan.findUnique({where:{id:loanId}});if(!l)fail(404,'Préstamo no encontrado');owner(req.user,l.clientId);
 let data;
 if(cancel){if(!['SOLICITADO','EN_REVISION'].includes(l.status))fail(409,'Este estado no admite cancelación');data={status:'CANCELADO'};}
 else{
  if(req.user.role!=='ADMIN'&&l.status!=='SOLICITADO')fail(403,'Solo puede editar su solicitud inicial');
  const b=terms.partial().extend({status:z.enum(['EN_REVISION','APROBADO','RECHAZADO']).optional()}).strict().parse(req.body);
  if(['APROBADO','RECHAZADO','CANCELADO'].includes(l.status))fail(409,'Préstamo finalizado, no admite cambios');
  if(b.status){if(req.user.role!=='ADMIN')fail(403,'Solo un administrador cambia el estado');const allowed={SOLICITADO:['EN_REVISION','RECHAZADO'],EN_REVISION:['APROBADO','RECHAZADO']};if(!allowed[l.status]?.includes(b.status))fail(409,'Transición de estado no permitida');}
  data={...b,installment:installment(b.amount||l.amount,b.rate??l.rate,b.months||l.months)};
 }
 const updated=await tx.loan.update({where:{id:loanId},data});await tx.audit.create({data:{actor:req.user.id,action:cancel?'CANCELACION':'MODIFICACION',resource:loanId}});return updated;
});}
app.patch('/loans/:id',auth,async(req,res)=>res.json(await change(req,false)));
app.delete('/loans/:id',auth,async(req,res)=>res.json(await change(req,true)));
finish(app,'prestamos',contracts([['get','/loans','Listar préstamos'],['post','/loans','Solicitar préstamo'],['get','/loans/{id}','Detalle'],['patch','/loans/{id}','Editar, revisar, aprobar o rechazar'],['delete','/loans/{id}','Cancelar solicitud válida']]));
