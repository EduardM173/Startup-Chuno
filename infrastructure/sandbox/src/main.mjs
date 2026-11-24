import { PrismaClient } from '../generated/client/index.js';
import { appFor,finish,contracts,internal,z,id,money,fail,fingerprint } from '../../../shared/http.mjs';
const db=new PrismaClient();const app=appFor('sandbox',db);
const providers=[{id:'luz',name:'Electricidad Demo',category:'Electricidad'},{id:'agua',name:'Agua Demo',category:'Agua'},{id:'telefono',name:'Telefonía Demo',category:'Telefonía'},{id:'gas',name:'Gas Demo',category:'Gas'},{id:'internet',name:'Internet Demo',category:'Internet'}];
const banks=[{id:'BANCO-DEMO',name:'Banco del Valle · SANDBOX'}];
app.use(internal);
app.get('/providers',(req,res)=>res.json(providers));app.get('/banks',(req,res)=>res.json(banks));
app.get('/beneficiary',async(req,res)=>{if(req.query.bank!=='BANCO-DEMO'||!['900000001','900000002','900000003'].includes(req.query.account))fail(404,'Beneficiario de prueba no encontrado');res.json({name:'Beneficiario Académico',bank:'BANCO-DEMO',account:req.query.account,environment:'SANDBOX'});});
app.get('/obligations',async(req,res)=>{
 const b=z.object({provider:z.enum(['luz','agua','telefono','gas','internet']),reference:z.string().min(1).max(50)}).parse(req.query);
 if(b.reference==='UNAVAILABLE')fail(503,'Indisponibilidad controlada del proveedor');
 const o=await db.obligation.findUnique({where:{provider_reference:b}});if(!o)fail(404,'Obligación de prueba no encontrada');res.json({...o,environment:'SANDBOX'});
});
app.get('/operations/:id',async(req,res)=>{const op=await db.externalOperation.findUnique({where:{id:id.parse(req.params.id)}});if(!op)fail(404,'Operación no registrada');res.json({...op,environment:'SANDBOX'});});
app.post('/operations',async(req,res)=>{
 const b=z.object({id:id,kind:z.enum(['PAGO','INTERBANCARIA']),amount:money,reference:z.string().min(1).max(80),provider:z.string().max(30).default(''),beneficiary:z.string().max(120).default('')}).strict().parse(req.body);
 const result=await db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${b.id},0))`;
  const hash=fingerprint(b),prior=await tx.externalOperation.findUnique({where:{id:b.id}});if(prior){if(prior.fingerprint!==hash)fail(409,'Operación externa incompatible');return prior;}
  let status='CONFIRMADO';
  if(b.kind==='PAGO'){
   const obligations=await tx.$queryRaw`SELECT * FROM "Obligation" WHERE provider=${b.provider} AND reference=${b.reference} FOR UPDATE`;const o=obligations[0];
   if(!o||o.paid||o.amount.toString()!==b.amount.replace(/\.00$/,'')){
    if(!o||o.paid||!o.amount.equals(b.amount))status='RECHAZADO';
   }
   if(b.reference.startsWith('REJECT'))status='RECHAZADO';
   if(status==='CONFIRMADO')await tx.obligation.update({where:{id:o.id},data:{paid:true}});
  }else if(b.provider!=='BANCO-DEMO'||!['900000001','900000002','900000003'].includes(b.reference)||b.reference==='900000002')status='RECHAZADO';
  if(b.reference==='UNAVAILABLE')fail(503,'Indisponibilidad controlada');
  return tx.externalOperation.create({data:{id:b.id,fingerprint:hash,kind:b.kind,status,amount:b.amount,reference:b.reference}});
 });
 // Persist before delaying: deliberately lose the HTTP response, not the financial result.
 if(b.reference.startsWith('TIMEOUT')||b.reference==='900000003') await new Promise(r=>setTimeout(r,6500));
 res.json({...result,environment:'SANDBOX'});
});
finish(app,'sandbox',contracts([['get','/providers','Proveedores de prueba'],['get','/banks','Bancos de prueba'],['get','/obligations','Consultar deuda'],['post','/operations','Ejecutar pago o transferencia'],['get','/operations/{id}','Consultar resultado persistido']]));
