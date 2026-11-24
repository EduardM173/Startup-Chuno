import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base='http://localhost:8080';
for(const service of ['clientes','cuentas','pagos','transferencias','prestamos']){
 const r=await fetch(`${base}/api/${service}/health`);assert.equal(r.status,200);console.log(`${service}: saludable`);
}
const login=await fetch(`${base}/api/clientes/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@chuno.demo',password:'AdminChuno2026!'})});assert.equal(login.status,200);const {token,user}=await login.json();assert.equal(user.clientId,null);
async function snapshot(){const result={};for(const [service,path] of [['clientes','/clients'],['cuentas','/accounts'],['prestamos','/loans']]){const r=await fetch(`${base}/api/${service}${path}`,{headers:{Authorization:`Bearer ${token}`}});assert.equal(r.status,200);result[service]=await r.json();}return result;}
const before=await snapshot();execFileSync('docker',['compose','exec','-T','-e','BASE_URL=http://web','clientes','node','scripts/seed.mjs','--api-only'],{stdio:'pipe'});const after=await snapshot();assert.deepEqual(after,before);console.log('Seed final idempotente: mismos clientes, cuentas, saldos y préstamos.');
console.log(`Estado persistente: ${after.clientes.length} clientes, ${after.cuentas.length} cuentas y ${after.prestamos.length} préstamos (incluye registros de pruebas).`);
