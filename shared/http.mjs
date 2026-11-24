import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { timingSafeEqual, createHash } from 'node:crypto';
import { z } from 'zod';
import Decimal from 'decimal.js';
import swaggerUi from 'swagger-ui-express';

export { z, Decimal };
export const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };
export const money = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, 'Importe decimal con hasta dos decimales').refine(v => new Decimal(v).gt(0), 'El importe debe ser mayor que cero');
export const id = z.string().uuid();
export const fingerprint = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
export function internal(req,res,next) {
 const a=Buffer.from(req.get('X-Service-Key')||''); const b=Buffer.from(process.env.SERVICE_KEY||'');
 if (!b.length || a.length!==b.length || !timingSafeEqual(a,b)) return res.status(403).json({error:'Acceso interno denegado'});
 next();
}
export async function call(service,path,{method='GET',body,token,timeout=4000}={}) {
 const url=process.env[service.toUpperCase()+'_URL'] || `http://${service}:3000`;
 let r;
 try {r=await fetch(url+path,{method,headers:{'Content-Type':'application/json','X-Service-Key':process.env.SERVICE_KEY,...(token?{Authorization:token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(timeout)});}
 catch {fail(503,`No se pudo contactar ${service}; consulte o reconcilie el estado antes de repetir`);}
 const result=await r.json().catch(()=>({error:'Respuesta de integración no válida'}));
 if(!r.ok) fail(r.status,result.error||'Integración rechazada');
 return result;
}
export async function auth(req,res,next) {
 const token=req.get('Authorization')||'';
 try {
  jwt.verify(token.replace(/^Bearer /,''),process.env.JWT_SECRET,{algorithms:['HS256'],issuer:'chuno',audience:'chuno-web'});
  req.user=await call('clientes','/internal/session',{method:'POST',body:{token:token.replace(/^Bearer /,'')}});
  if(req.user.mustChangePassword)fail(403,'Debe cambiar su contraseña temporal antes de operar'); req.token=token; next();
 }catch(e){next(e.status?e:Object.assign(new Error('Sesión inválida o expirada'),{status:401}));}
}
export function admin(req,res,next) {if(req.user.role!=='ADMIN') return res.status(403).json({error:'Requiere rol administrador'}); next();}
export function owner(user,clientId) {if(user.role!=='ADMIN' && user.clientId!==clientId) fail(403,'No tiene acceso a este recurso');}
export function appFor(name,db) {
 const app=express(); app.disable('x-powered-by'); app.use(helmet({contentSecurityPolicy:false})); app.use(express.json({limit:'32kb'}));
 app.get('/health',async(req,res)=>{await db.$queryRaw`SELECT 1`; res.json({service:name,status:'ok'});});
 return app;
}
export function finish(app,name,paths) {
 const string={type:'string'},amount={type:'string',pattern:'^\\d+(\\.\\d{1,2})?$',example:'100.00'},uuid={type:'string',format:'uuid'};
 const bodies={
  '/auth/login':{email:{...string,example:'admin@chuno.demo'},password:{...string,format:'password'}},
  '/auth/password':{current:{...string,format:'password'},password:{...string,minLength:10,format:'password'}},
  '/me':{phone:string,address:string},
  '/clients':{document:string,names:string,surnames:string,email:{...string,format:'email'},phone:string,address:string},
  '/clients/{id}':{document:string,names:string,surnames:string,email:string,phone:string,address:string},
  '/clients/{id}/access':{password:{...string,minLength:10,format:'password'},email:string,status:{type:'string',enum:['ACTIVO','BLOQUEADO','INACTIVO']}},
  '/accounts':{clientId:uuid,alias:string},
  '/accounts/{id}':{alias:string,status:{type:'string',enum:['ACTIVA','BLOQUEADA']}},
  '/accounts/{id}/cash':{operationId:uuid,kind:{type:'string',enum:['DEPOSITO','RETIRO']},amount,description:string},
  '/transactions':{key:uuid,accountId:uuid,amount,kind:{type:'string',enum:name==='pagos'?['PAGO']:['PROPIA','TERCERO','INTERBANCARIA']},destination:string,provider:string,reference:string,beneficiary:string},
  '/loans':{clientId:uuid,amount,rate:{...string,example:'12'},months:{type:'integer',minimum:1,maximum:360},notes:string},
  '/loans/{id}':{amount,rate:string,months:{type:'integer'},notes:string,status:{type:'string',enum:['EN_REVISION','APROBADO','RECHAZADO']}}
 };
 for(const [path,methods] of Object.entries(paths))for(const [method,operation] of Object.entries(methods)){
  const params=[...path.matchAll(/\{(\w+)\}/g)].map(m=>({name:m[1],in:'path',required:true,schema:m[1]==='id'?uuid:string}));
  if(path==='/obligation')params.push(...['provider','reference'].map(n=>({name:n,in:'query',required:true,schema:string})));
  if(path==='/beneficiary')params.push(...['bank','account'].map(n=>({name:n,in:'query',required:true,schema:string})));
  if(params.length)operation.parameters=params;
  if(['post','patch'].includes(method)&&bodies[path])operation.requestBody={required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,properties:bodies[path]}}}};
  if(path==='/auth/login')operation.security=[];
 }
 const spec={openapi:'3.0.3',info:{title:`CHUNO · ${name}`,version:'1.0.0',description:'Demostración académica. Ver contratos en docs/contratos.md.'},servers:[{url:`/api/${name}`}],components:{securitySchemes:{bearer:{type:'http',scheme:'bearer',bearerFormat:'JWT'}}},security:[{bearer:[]}],paths};
 app.get('/openapi.json',(req,res)=>res.json(spec)); app.use('/docs',swaggerUi.serve,swaggerUi.setup(spec));
 app.use((req,res)=>res.status(404).json({error:'Recurso no encontrado'}));
 app.use((e,req,res,next)=>{
  if(e instanceof z.ZodError) return res.status(422).json({error:e.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')});
  if(e.code==='P2002') return res.status(409).json({error:'Registro duplicado o clave ya utilizada'});
  if(e.code==='P2025') return res.status(404).json({error:'Registro no encontrado'});
  console.error(JSON.stringify({service:name,path:req.path,status:e.status||500,error:e.message}));
  res.status(e.status||500).json({error:e.status?e.message:'Error interno. Consulte el estado de la operación.'});
 });
 app.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log(`${name} listo`));
}
export function contracts(entries) {
 const paths={}; for(const [method,path,summary] of entries){ paths[path]??={}; paths[path][method]={summary,responses:{200:{description:'Resultado de la operación'},401:{description:'No autenticado'},403:{description:'No autorizado'},409:{description:'Conflicto'},422:{description:'Entrada inválida'},503:{description:'Servicio no disponible'}}}; }return paths;
}
