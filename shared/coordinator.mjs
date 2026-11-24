import { appFor,finish,contracts,auth,internal,owner,call,z,id,money,fail,fingerprint } from './http.mjs';

// Each service owns its Transaction table. No direct account or provider database access.

export function coordinator(name,db){

 const app=appFor(name,db),payment=name==='pagos';

 app.get('/catalog',auth,async(req,res)=>res.json(await call('sandbox',payment?'/providers':'/banks')));

 if(payment)app.get('/obligation',auth,async(req,res)=>{const q=z.object({provider:z.string().min(1).max(30),reference:z.string().min(1).max(50)}).parse(req.query);res.json(await call('sandbox',`/obligations?${new URLSearchParams(q)}`));});

 else app.get('/beneficiary',auth,async(req,res)=>{const q=z.object({bank:z.string().min(1).max(30),account:z.string().min(5).max(40)}).parse(req.query);res.json(await call('sandbox',`/beneficiary?${new URLSearchParams(q)}`));});

 const schema=z.object({key:id,accountId:id,amount:money,kind:payment?z.literal('PAGO'):z.enum(['PROPIA','TERCERO','INTERBANCARIA']),destination:z.string().min(1).max(80),provider:z.string().max(30).default(''),reference:z.string().max(80).default(''),beneficiary:z.string().max(120).default('')}).strict();

 const external=o=>payment||o.kind==='INTERBANCARIA';

 async function run(operationId){

  // Transaction advisory lock excludes duplicate HTTP workers,

  // and is automatically released on connection loss or service restart.

  return db.$transaction(async tx=>{

   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${operationId},0))`;

   let o=await tx.transaction.findUnique({where:{id:operationId}});

   if(!['PENDIENTE','PROCESANDO'].includes(o.status))return o;

   try{

    const prior=await call('cuentas',`/internal/operations/${o.id}`).catch(e=>{if(e.status===404)return null;throw e;});

    if(!external(o)){

     const dest=await call('cuentas',`/internal/accounts/${o.destination}`);

     if(o.kind==='PROPIA'&&dest.clientId!==o.clientId)fail(422,'La cuenta destino debe ser propia');

     if(o.kind==='TERCERO'&&dest.clientId===o.clientId)fail(422,'Seleccione transferencia entre cuentas propias');

     const accountResult=prior||await call('cuentas','/internal/operations',{method:'POST',body:{operationId:o.id,accountId:o.accountId,clientId:o.clientId,amount:o.amount.toFixed(2),actorId:o.actorId,kind:'TRANSFERENCIA',destinationId:o.destination}});

     return await tx.transaction.update({where:{id:o.id},data:{status:accountResult.status,phase:'FINALIZADA'}});

    }

    if(!prior)await call('cuentas','/internal/operations',{method:'POST',body:{operationId:o.id,accountId:o.accountId,clientId:o.clientId,amount:o.amount.toFixed(2),actorId:o.actorId,kind:'RESERVA'}});

    let result=await call('sandbox',`/operations/${o.id}`).catch(e=>{if(e.status===404)return null;throw e;});

    // Reusing the same operation id is safe even after a crash; the external contract is idempotent.

    if(!result)result=await call('sandbox','/operations',{method:'POST',body:{id:o.id,kind:payment?'PAGO':'INTERBANCARIA',amount:o.amount.toFixed(2),reference:payment?o.reference:o.destination,provider:o.provider,beneficiary:o.beneficiary}});

    if(!['CONFIRMADO','RECHAZADO'].includes(result.status))return tx.transaction.update({where:{id:o.id},data:{status:'PENDIENTE',phase:'RESULTADO_INCIERTO'}});

    await call('cuentas',`/internal/operations/${o.id}/settle`,{method:'POST',body:{confirm:result.status==='CONFIRMADO'}});

    return await tx.transaction.update({where:{id:o.id},data:{status:result.status==='CONFIRMADO'?'CONFIRMADO':'REVERTIDO',phase:'FINALIZADA',externalId:result.externalId,reason:result.status==='RECHAZADO'?'Rechazo definitivo del sandbox; reserva liberada':''}});

   }catch(e){

    // Definitive local validation can reject only when no account operation exists.

    const acc=await call('cuentas',`/internal/operations/${o.id}`).catch(()=>null);

    const definitive=e.status<500 && !acc;

    return await tx.transaction.update({where:{id:o.id},data:{status:definitive?'RECHAZADO':'PENDIENTE',phase:definitive?'FINALIZADA':'RECONCILIAR',reason:e.message.slice(0,250)}});

   }

  },{timeout:25000,maxWait:25000});

 }

 app.get('/transactions',auth,async(req,res)=>res.json(await db.transaction.findMany({where:req.user.role==='ADMIN'?{}:{clientId:req.user.clientId},orderBy:{createdAt:'desc'},take:200})));

 app.get('/transactions/:id',auth,async(req,res)=>{const o=await db.transaction.findUnique({where:{id:id.parse(req.params.id)}});if(!o)fail(404,'Operación no encontrada');owner(req.user,o.clientId);res.json({...o,environment:'SANDBOX'});});

 app.post('/transactions',auth,async(req,res)=>{

  if(req.user.role!=='CLIENTE')fail(403,'Solo clientes pueden ordenar pagos o transferencias'); const b=schema.parse(req.body);const hash=fingerprint(b);const where={clientId_key:{clientId:req.user.clientId,key:b.key}};

  let o=await db.transaction.findUnique({where});

  if(o){if(o.fingerprint!==hash)fail(409,'Clave de idempotencia reutilizada con otros datos');return res.json(await run(o.id));}

  const a=await call('cuentas',`/internal/accounts/${b.accountId}`);if(a.clientId!==req.user.clientId)fail(403,'Cuenta origen ajena');

  if(payment){const debt=await call('sandbox',`/obligations?${new URLSearchParams({provider:b.provider,reference:b.reference})}`);if(debt.paid)fail(409,'Obligación ya pagada');if(!new (await import('decimal.js')).default(b.amount).eq(debt.amount))fail(422,'El importe no coincide con la deuda');}

  if(b.kind==='INTERBANCARIA'){

   const beneficiary=await call('sandbox',`/beneficiary?${new URLSearchParams({bank:b.provider,account:b.destination})}`);if(b.beneficiary!==beneficiary.name)fail(422,'Beneficiario no coincide con la validación');

  }

  try{o=await db.transaction.create({data:{...b,actorId:req.user.id,clientId:req.user.clientId,fingerprint:hash}});}catch(e){if(e.code!=='P2002')throw e;o=await db.transaction.findUnique({where});if(o.fingerprint!==hash)fail(409,'Clave incompatible');}

  res.status(201).json(await run(o.id));

 });

 app.post('/transactions/:id/reconcile',auth,async(req,res)=>{const o=await db.transaction.findUnique({where:{id:id.parse(req.params.id)}});if(!o)fail(404,'Operación no encontrada');owner(req.user,o.clientId);res.json(await run(o.id));});

 app.get('/internal/account-pending/:id',internal,async(req,res)=>res.json({pending:await db.transaction.count({where:{accountId:id.parse(req.params.id),status:{in:['PENDIENTE','PROCESANDO']}}})>0}));
 app.get('/internal/pending/:id',internal,async(req,res)=>res.json({pending:await db.transaction.count({where:{clientId:id.parse(req.params.id),status:{in:['PENDIENTE','PROCESANDO']}}})>0}));

 finish(app,name,contracts([['get','/catalog','Catálogo sandbox'],...(payment?[['get','/obligation','Consultar obligación']]:[['get','/beneficiary','Validar beneficiario interbancario']]),['post','/transactions','Confirmar operación idempotente'],['get','/transactions','Historial'],['get','/transactions/{id}','Comprobante verificable'],['post','/transactions/{id}/reconcile','Recuperar resultado incierto']]));

}
