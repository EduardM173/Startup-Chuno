import {execFileSync} from 'node:child_process';
const names=['clientes','cuentas','pagos','transferencias','prestamos','sandbox'];
for(const name of names){
 const base=name==='sandbox'?'infrastructure/sandbox':`services/${name}`;
 const code=`import {PrismaClient} from './${base}/generated/client/index.js';
 const names=${JSON.stringify(names)};let passed=0;
 for(const other of names){const url=new URL(process.env.DATABASE_URL);url.pathname='/'+other+'_db';const db=new PrismaClient({datasources:{db:{url:url.toString()}}});try{await db.$queryRaw\`SELECT current_database()\`;if(other!==${JSON.stringify(name)})throw new Error('ACCESO CRUZADO PERMITIDO');console.log('${name}: acceso propio OK');}catch(e){if(other===${JSON.stringify(name)}||e.message==='ACCESO CRUZADO PERMITIDO')throw e;passed++;}finally{await db.$disconnect();}}console.log('${name}: '+passed+' accesos cruzados rechazados');`;
 process.stdout.write(execFileSync('docker',['compose','exec','-T',name,'node','--input-type=module'],{input:code,encoding:'utf8'}));
}
console.log('6 bases accesibles por su propietario y 30 accesos cruzados rechazados.');
