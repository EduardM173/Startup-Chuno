import { spawnSync } from 'node:child_process';
for(const name of ['clientes','cuentas','pagos','transferencias','prestamos','sandbox']){
 const base=name==='sandbox'?'infrastructure/sandbox':`services/${name}`;
 const result=spawnSync(process.execPath,['node_modules/prisma/build/index.js',...process.argv.slice(2),'--schema',`${base}/prisma/schema.prisma`],{stdio:'inherit',env:{...process.env,DATABASE_URL:process.env.DATABASE_URL||'postgresql://unused:unused@localhost:5432/unused'}});
 if(result.status!==0)process.exit(result.status||1);
}
