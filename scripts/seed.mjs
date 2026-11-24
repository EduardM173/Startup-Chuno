import {execFileSync} from 'node:child_process';

const base=process.env.BASE_URL||'http://localhost:8080';

async function request(service,path,method='GET',body,token){const r=await fetch(`${base}/api/${service}${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});const b=await r.json();if(!r.ok)throw new Error(b.error);return b;}

// Bootstrap only the identity administrator and external fixtures, each inside its own service.

if(!process.argv.includes('--api-only'))for(const name of ['clientes','sandbox'])execFileSync('docker',['compose','exec','-T',name,'node',`scripts/bootstrap-${name}.mjs`],{stdio:'inherit'});

const {token}=await request('clientes','/auth/login','POST',{email:'admin@chuno.demo',password:'AdminChuno2026!'});

let clients=await request('clientes','/clients','GET',undefined,token);

for(const [index,names,surnames] of [[1,'Valeria','Mamani Flores'],[2,'Diego','Quispe Rojas'],[3,'Camila','Vargas López']]){

 const email=`${['','valeria','diego','camila'][index]}@chuno.demo`;

 let c=clients.find(c=>c.email===email);

 if(!c)c=await request('clientes','/clients','POST',{document:`DEMO-100${index}`,names,surnames,email,phone:`7000000${index}`,address:'Calle de prueba 123, La Paz'},token);

 c=await request('clientes',`/clients/${c.id}`,'GET',undefined,token);

 if(!c.access)await request('clientes',`/clients/${c.id}/access`,'POST',{password:'Temporal2026!'},token);

 const accounts=await request('cuentas','/accounts','GET',undefined,token);

 for(let n=1;n<=(index===1?2:1);n++){

  const alias=n===1?'Ahorro principal':'Mis metas';let a=accounts.filter(a=>a.clientId===c.id)[n-1];

  if(!a){a=await request('cuentas','/accounts','POST',{clientId:c.id,alias},token);}

  const moves=await request('cuentas',`/accounts/${a.id}/movements`,'GET',undefined,token);if(!moves.some(m=>m.description==='APERTURA DEMO · depósito académico'))await request('cuentas',`/accounts/${a.id}/cash`,'POST',{operationId:crypto.randomUUID(),kind:'DEPOSITO',amount:n===1?'5000.00':'1500.00',description:'APERTURA DEMO · depósito académico'},token);

 }

 const loans=await request('prestamos','/loans','GET',undefined,token);

 if(!loans.some(l=>l.clientId===c.id)){

  let l=await request('prestamos','/loans','POST',{clientId:c.id,amount:'10000.00',rate:'12',months:12,notes:'Préstamo de demostración'},token);

  if(index>1)l=await request('prestamos',`/loans/${l.id}`,'PATCH',{status:'EN_REVISION'},token);

  if(index===3)await request('prestamos',`/loans/${l.id}`,'PATCH',{status:'APROBADO'},token);

 }

}

console.log('Datos inicializados sin duplicados. Usuarios clientes: contraseña temporal Temporal2026!; cambio obligatorio.');
