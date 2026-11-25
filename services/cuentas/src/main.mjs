import { PrismaClient } from '../generated/client/index.js';

import { randomUUID,randomInt } from 'node:crypto';

import { appFor,finish,contracts,auth,admin,internal,owner,call,z,id,money,Decimal,fail,fingerprint } from '../../../shared/http.mjs';

const db=new PrismaClient();const app=appFor('cuentas',db);

const get=async(tx,accountId)=>{const a=await tx.account.findUnique({where:{id:accountId}});if(!a)fail(404,'Cuenta no encontrada');return a;};

async function lock(tx,ids){for(const value of [...new Set(ids)].sort()) await tx.$queryRaw`SELECT id FROM "Account" WHERE id=${value} FOR UPDATE`;}

function usable(a){if(a.status!=='ACTIVA')fail(409,'Cuenta cerrada');}

function funds(a,amount){if(new Decimal(a.balance).minus(a.reserved).lt(amount))fail(409,'Saldo disponible insuficiente');}

async function movement(tx,a,op,kind,amount,description,actorId){await tx.movement.create({data:{accountId:a.id,operationId:op,kind,amount:amount.toString(),balanceAfter:a.balance,description,actorId}});}

async function financial(b){

 return db.$transaction(async tx=>{

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${b.operationId},0))`;

  const hash=fingerprint(b);const prior=await tx.operation.findUnique({where:{id:b.operationId}});

  if(prior){if(prior.fingerprint!==hash)fail(409,'Identificador reutilizado con otros datos');return prior;}

  await lock(tx,[b.accountId,...(b.destinationId?[b.destinationId]:[])]);

  let a=await get(tx,b.accountId);usable(a);if(a.clientId!==b.clientId)fail(403,'La cuenta origen no pertenece al cliente');

  await call('clientes',`/internal/clients/${a.clientId}`);

  const amount=new Decimal(b.amount);let status='CONFIRMADO';

  if(b.kind==='TRANSFERENCIA'){

   if(b.accountId===b.destinationId)fail(422,'No puede transferir a la misma cuenta');

   const dest=await get(tx,b.destinationId);usable(dest);await call('clientes',`/internal/clients/${dest.clientId}`);funds(a,amount);

   a=await tx.account.update({where:{id:a.id},data:{balance:{decrement:b.amount}}});

   const d=await tx.account.update({where:{id:dest.id},data:{balance:{increment:b.amount}}});

   const desc=b.description||'Transferencia interna';
   await movement(tx,a,b.operationId,'DEBITO',amount.negated(),desc,b.actorId);await movement(tx,d,b.operationId,'CREDITO',amount,desc,b.actorId);

  }else if(b.kind==='RESERVA'){

   funds(a,amount);await tx.account.update({where:{id:a.id},data:{reserved:{increment:b.amount}}});status='PENDIENTE';

  }else{

   if(b.kind==='RETIRO')funds(a,amount);

   const delta=b.kind==='RETIRO'?amount.negated():amount;

   a=await tx.account.update({where:{id:a.id},data:{balance:{increment:delta.toString()}}});await movement(tx,a,b.operationId,b.kind,delta,b.description||'Operación de caja autorizada',b.actorId);

  }

  return tx.operation.create({data:{id:b.operationId,actorId:b.actorId,fingerprint:hash,clientId:b.clientId,accountId:b.accountId,destinationId:b.destinationId,amount:b.amount,kind:b.kind,status}});

 },{timeout:15000,maxWait:10000});

}

const operation=z.object({operationId:id,actorId:id,accountId:id,clientId:id,amount:money,kind:z.enum(['TRANSFERENCIA','RESERVA']),destinationId:id.optional(),description:z.string().max(150).optional()}).strict().superRefine((b,c)=>{if(b.kind==='TRANSFERENCIA'&&!b.destinationId)c.addIssue({code:'custom',message:'Cuenta destino requerida'});});

app.post('/internal/operations',internal,async(req,res)=>res.json(await financial(operation.parse(req.body))));

app.get('/internal/operations/:id',internal,async(req,res)=>{const op=await db.operation.findUnique({where:{id:id.parse(req.params.id)}});if(!op)fail(404,'Operación no encontrada');res.json(op);});

app.post('/internal/operations/:id/settle',internal,async(req,res)=>{

 const operationId=id.parse(req.params.id);const {confirm}=z.object({confirm:z.boolean()}).strict().parse(req.body);

 res.json(await db.$transaction(async tx=>{

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${operationId},0))`;

  const op=await tx.operation.findUnique({where:{id:operationId}});if(!op)fail(404,'Reserva no encontrada');

  if(op.kind!=='RESERVA')fail(409,'No es una reserva');

  if(op.status!=='PENDIENTE'){if(op.status!==(confirm?'CONFIRMADO':'REVERTIDO'))fail(409,'Resultado de reserva incompatible');return op;}

  await lock(tx,[op.accountId]);

  const a=await tx.account.update({where:{id:op.accountId},data:{reserved:{decrement:op.amount},...(confirm?{balance:{decrement:op.amount}}:{})}});

  if(confirm)await movement(tx,a,op.id,'DEBITO',new Decimal(op.amount).negated(),'Operación externa SANDBOX',op.actorId);

  return tx.operation.update({where:{id:op.id},data:{status:confirm?'CONFIRMADO':'REVERTIDO'}});

 }));

});

app.get('/internal/obligations/:id',internal,async(req,res)=>res.json({pending:await db.account.count({where:{clientId:id.parse(req.params.id),OR:[{status:'ACTIVA'},{balance:{not:0}},{reserved:{not:0}}]}})>0}));

app.get('/internal/accounts/:id',internal,async(req,res)=>res.json(await get(db,id.parse(req.params.id))));

app.get('/accounts',auth,async(req,res)=>res.json(await db.account.findMany({where:req.user.role==='ADMIN'?{}:{clientId:req.user.clientId},orderBy:{createdAt:'asc'}})));

app.post('/accounts',auth,admin,async(req,res)=>{

 const b=z.object({clientId:id,alias:z.string().min(2).max(60)}).strict().parse(req.body);await call('clientes',`/internal/clients/${b.clientId}`);

 res.status(201).json(await db.$transaction(async tx=>{const a=await tx.account.create({data:{...b,number:'100'+randomInt(100000000,999999999)}});await tx.audit.create({data:{actor:req.user.id,action:'APERTURA',resource:a.id}});return a;}));

});

app.get('/beneficiary/:number',auth,async(req,res)=>{const a=await db.account.findUnique({where:{number:req.params.number}});if(!a||a.status!=='ACTIVA')fail(404,'Cuenta destino no disponible');const c=await call('clientes',`/internal/clients/${a.clientId}`);res.json({id:a.id,number:a.number,beneficiary:`${c.names.split(' ')[0]} ${c.surnames[0]}.`,own:a.clientId===req.user.clientId});});

app.get('/accounts/:id',auth,async(req,res)=>{const a=await get(db,id.parse(req.params.id));owner(req.user,a.clientId);res.json(a);});

app.patch('/accounts/:id',auth,async(req,res)=>{
 const b=z.object(req.user.role==='ADMIN'?{alias:z.string().min(2).max(60).optional(),status:z.enum(['ACTIVA','BLOQUEADA']).optional()}:{alias:z.string().min(2).max(60)}).strict().parse(req.body);
 const accountId=id.parse(req.params.id);res.json(await db.$transaction(async tx=>{await lock(tx,[accountId]);const a=await get(tx,accountId);owner(req.user,a.clientId);if(a.status==='CERRADA')fail(409,'Cuenta cerrada');const result=await tx.account.update({where:{id:a.id},data:b});await tx.audit.create({data:{actor:req.user.id,action:'MODIFICACION_CUENTA',resource:a.id}});return result;}));
});
app.delete('/accounts/:id',auth,admin,async(req,res)=>{
 const accountId=id.parse(req.params.id);
 for(const service of ['pagos','transferencias'])if((await call(service,`/internal/account-pending/${accountId}`)).pending)fail(409,'Existen operaciones pendientes de reconciliación');
 res.json(await db.$transaction(async tx=>{await lock(tx,[accountId]);const a=await get(tx,accountId);if(!new Decimal(a.balance).isZero()||!new Decimal(a.reserved).isZero())fail(409,'No puede cerrar una cuenta con saldo o reservas');await tx.audit.create({data:{actor:req.user.id,action:'CIERRE',resource:a.id}});return tx.account.update({where:{id:a.id},data:{status:'CERRADA'}});}));
});
app.get('/accounts/:id/movements',auth,async(req,res)=>{const a=await get(db,id.parse(req.params.id));owner(req.user,a.clientId);res.json(await db.movement.findMany({where:{accountId:a.id},orderBy:{createdAt:'desc'},take:200}));});

app.post('/accounts/:id/cash',auth,admin,async(req,res)=>{

 const b=z.object({amount:money,kind:z.enum(['DEPOSITO','RETIRO']),description:z.string().min(3).max(150),operationId:id}).strict().parse(req.body);const a=await get(db,id.parse(req.params.id));

 res.json(await financial({...b,actorId:req.user.id,accountId:a.id,clientId:a.clientId}));

});

finish(app,'cuentas',contracts([['get','/accounts','Listado y saldos'],['post','/accounts','Abrir cuenta'],['get','/accounts/{id}','Detalle'],['patch','/accounts/{id}','Cambiar alias'],['delete','/accounts/{id}','Cerrar cuenta sin saldo'],['get','/accounts/{id}/movements','Historial'],['post','/accounts/{id}/cash','Depósito o retiro ADMIN'],['get','/beneficiary/{number}','Validar beneficiario limitado']]));
