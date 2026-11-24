import { PrismaClient } from '../generated/client/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { appFor,finish,contracts,internal,admin,call,z,id,fail,owner } from '../../../shared/http.mjs';
const db=new PrismaClient(); const app=appFor('clientes',db);
const fields={document:z.string().min(5).max(30),names:z.string().min(2).max(80),surnames:z.string().min(2).max(80),email:z.string().email().max(120).transform(v=>v.toLowerCase()),phone:z.string().min(7).max(25),address:z.string().min(4).max(200)};
const accessView=u=>u?{id:u.id,email:u.email,status:u.status,mustChangePassword:u.mustChangePassword}:null;
const clientView=c=>{const {user,...rest}=c;return {...rest,active:c.status==='ACTIVO',deleted:c.status==='BAJA',access:accessView(user)};};
const userView=u=>({id:u.id,clientId:u.clientId,email:u.email,role:u.role,status:u.status,mustChangePassword:u.mustChangePassword,names:u.client?.names||u.names,surnames:u.client?.surnames||u.surnames,phone:u.client?.phone||'',address:u.client?.address||'',document:u.client?.document||'No aplica',contactEmail:u.client?.email||'',lastAccess:u.lastAccess||null});
async function session(token){
 let payload;try{payload=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256'],issuer:'chuno',audience:'chuno-web'});}catch{fail(401,'Sesión inválida o expirada');}
 const u=await db.user.findUnique({where:{id:payload.sub},include:{client:true}});
 if(!u||u.status!=='ACTIVO'||u.version!==payload.ver||(u.role==='CLIENTE'&&(!u.client||u.client.status!=='ACTIVO')))fail(401,'Sesión revocada, usuario bloqueado o cliente de baja');const access=await db.audit.findFirst({where:{actor:u.id,action:'INICIO_SESION'},orderBy:{createdAt:'desc'}});return userView({...u,lastAccess:access?.createdAt});
}
async function auth(req,res,next){req.user=await session((req.get('Authorization')||'').replace(/^Bearer /,''));if(req.user.mustChangePassword&&!['/auth/password','/auth/logout','/me'].includes(req.path))fail(403,'Debe cambiar su contraseña temporal antes de operar');next();}
async function audit(tx,user,action,resource){await tx.audit.create({data:{actor:user.id,action,resource}});}
app.post('/internal/session',internal,async(req,res)=>res.json(await session(z.string().parse(req.body.token))));
app.get('/internal/clients/:id',internal,async(req,res)=>{const c=await db.client.findUnique({where:{id:id.parse(req.params.id)}});if(!c||c.status!=='ACTIVO')fail(404,'Cliente inexistente o de baja');res.json(clientView(c));});
app.post('/auth/login',rateLimit({windowMs:60000,limit:20,standardHeaders:'draft-8',legacyHeaders:false}),async(req,res)=>{
 const b=z.object({email:z.string().email(),password:z.string().max(128)}).strict().parse(req.body);const u=await db.user.findUnique({where:{email:b.email.toLowerCase()},include:{client:true}});
 if(!u||!await bcrypt.compare(b.password,u.password)||u.status!=='ACTIVO'||(u.role==='CLIENTE'&&u.client?.status!=='ACTIVO'))fail(401,'Credenciales inválidas o acceso no activo');
 const access=await db.audit.create({data:{actor:u.id,action:'INICIO_SESION',resource:u.id}});u.lastAccess=access.createdAt;
 const token=jwt.sign({ver:u.version},process.env.JWT_SECRET,{algorithm:'HS256',subject:u.id,expiresIn:'30m',issuer:'chuno',audience:'chuno-web'});res.json({token,user:userView(u)});
});
app.post('/auth/logout',auth,async(req,res)=>{await db.user.update({where:{id:req.user.id},data:{version:{increment:1}}});res.json({message:'Sesión cerrada'});});
app.post('/auth/password',auth,async(req,res)=>{
 const b=z.object({current:z.string(),password:z.string().min(10).max(128)}).strict().parse(req.body);const u=await db.user.findUnique({where:{id:req.user.id}});
 if(!await bcrypt.compare(b.current,u.password))fail(403,'Contraseña actual incorrecta');if(await bcrypt.compare(b.password,u.password))fail(422,'La nueva contraseña debe ser diferente');
 await db.$transaction(async tx=>{await tx.user.update({where:{id:u.id},data:{password:await bcrypt.hash(b.password,12),mustChangePassword:false,version:{increment:1}}});await audit(tx,req.user,'CAMBIO_CONTRASEÑA',u.id);});res.json({message:'Contraseña actualizada. Inicie sesión nuevamente.'});
});
app.get('/me',auth,(req,res)=>res.json(req.user));
app.patch('/me',auth,async(req,res)=>{
 const b=z.object({phone:fields.phone,address:fields.address,email:fields.email}).partial().strict().parse(req.body);if(!req.user.clientId)fail(422,'El administrador no tiene ficha de cliente');
 const c=await db.$transaction(async tx=>{const c=await tx.client.update({where:{id:req.user.clientId},data:b});await audit(tx,req.user,'CONTACTO',c.id);return c;});res.json({...req.user,phone:c.phone,address:c.address,contactEmail:c.email});
});
app.get('/clients',auth,admin,async(req,res)=>{const q=String(req.query.q||'').slice(0,100);res.json((await db.client.findMany({where:{OR:['names','surnames','email','document'].map(k=>({[k]:{contains:q,mode:'insensitive'}}))},include:{user:true},orderBy:{createdAt:'desc'},take:200})).map(clientView));});
app.post('/clients',auth,admin,async(req,res)=>{
 const b=z.object(fields).strict().parse(req.body);const c=await db.$transaction(async tx=>{const c=await tx.client.create({data:b});await audit(tx,req.user,'ALTA_CLIENTE',c.id);return c;});res.status(201).json(clientView(c));
});
app.get('/clients/:id',auth,async(req,res)=>{owner(req.user,req.params.id);const c=await db.client.findUnique({where:{id:id.parse(req.params.id)},include:{user:true}});if(!c)fail(404,'Cliente no encontrado');res.json(clientView(c));});
app.patch('/clients/:id',auth,async(req,res)=>{
 const clientId=id.parse(req.params.id);owner(req.user,clientId);const b=z.object(req.user.role==='ADMIN'?fields:{phone:fields.phone,address:fields.address,email:fields.email}).partial().strict().parse(req.body);
 const c=await db.client.findUnique({where:{id:clientId}});if(!c||c.status==='BAJA')fail(409,'Cliente de baja');
 res.json(clientView(await db.$transaction(async tx=>{const c=await tx.client.update({where:{id:clientId},data:b,include:{user:true}});await audit(tx,req.user,'MODIFICACION_CLIENTE',clientId);return c;})));
});
app.post('/clients/:id/access',auth,admin,async(req,res)=>{
 const clientId=id.parse(req.params.id);const b=z.object({password:z.string().min(10).max(128),email:fields.email.optional()}).strict().parse(req.body);
 const c=await db.client.findUnique({where:{id:clientId}});if(!c||c.status!=='ACTIVO')fail(409,'Cliente no activo');
 const u=await db.$transaction(async tx=>{const u=await tx.user.create({data:{clientId,email:b.email||c.email,names:c.names,surnames:c.surnames,password:await bcrypt.hash(b.password,12),role:'CLIENTE'}});await audit(tx,req.user,'HABILITAR_ACCESO',clientId);return u;});res.status(201).json(accessView(u));
});
app.patch('/clients/:id/access',auth,admin,async(req,res)=>{
 const clientId=id.parse(req.params.id);const b=z.object({status:z.enum(['ACTIVO','BLOQUEADO','INACTIVO']).optional(),password:z.string().min(10).max(128).optional()}).strict().refine(v=>v.status||v.password,'Indique estado o contraseña temporal').parse(req.body);
 const c=await db.client.findUnique({where:{id:clientId}});if(!c||c.status!=='ACTIVO')fail(409,'Cliente no activo');
 const u=await db.$transaction(async tx=>{const u=await tx.user.update({where:{clientId},data:{...(b.status?{status:b.status}:{}),...(b.password?{password:await bcrypt.hash(b.password,12),mustChangePassword:true}:{}),version:{increment:1}}});await audit(tx,req.user,b.password?'RESTABLECER_ACCESO':'ESTADO_ACCESO',clientId);return u;});res.json(accessView(u));
});
app.delete('/clients/:id',auth,admin,async(req,res)=>{
 const clientId=id.parse(req.params.id);const accounts=await call('cuentas',`/internal/obligations/${clientId}`),loans=await call('prestamos',`/internal/obligations/${clientId}`),payments=await call('pagos',`/internal/pending/${clientId}`),transfers=await call('transferencias',`/internal/pending/${clientId}`);
 if(accounts.pending||loans.pending||payments.pending||transfers.pending)fail(409,'Baja impedida: cierre cuentas y resuelva obligaciones y operaciones pendientes');
 const c=await db.$transaction(async tx=>{const c=await tx.client.update({where:{id:clientId},data:{status:'BAJA'}});await tx.user.updateMany({where:{clientId},data:{status:'INACTIVO',version:{increment:1}}});await audit(tx,req.user,'BAJA_CLIENTE',clientId);return c;});res.json(clientView(c));
});
finish(app,'clientes',contracts([['post','/auth/login','Inicio de sesión'],['post','/auth/logout','Revocar sesión'],['post','/auth/password','Cambiar contraseña temporal o vigente'],['get','/me','Identidad de acceso'],['patch','/me','Actualizar contacto'],['get','/clients','Buscar clientes'],['post','/clients','Alta sin cuenta ni usuario'],['get','/clients/{id}','Detalle'],['patch','/clients/{id}','Modificar datos permitidos'],['delete','/clients/{id}','Baja lógica'],['post','/clients/{id}/access','Habilitar usuario digital'],['patch','/clients/{id}/access','Bloquear, desactivar o restablecer contraseña']]));
