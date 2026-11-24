import {PrismaClient} from '../infrastructure/sandbox/generated/client/index.js';
const db=new PrismaClient();
for(const provider of ['luz','agua','telefono','gas','internet'])for(const [reference,amount] of [['DEMO-001','120.50'],['DEMO-002','85.00'],['REJECT','45.00'],['TIMEOUT','60.00']])await db.obligation.upsert({where:{id:`${provider}-${reference}`},update:{},create:{id:`${provider}-${reference}`,provider,reference,customer:'Consumidor Académico',amount}});
if(process.argv[2])for(const [prefix,amount] of [['QA','85.00'],['REJECT','45.00'],['TIMEOUT','60.00'],['UI','120.50']])for(const provider of ['luz','agua','gas']){
 const reference=`${prefix}-${process.argv[2]}`;
 await db.obligation.upsert({where:{id:`${provider}-${reference}`},update:{},create:{id:`${provider}-${reference}`,provider,reference,customer:'Consumidor de validación',amount}});
}
console.log('Obligaciones sandbox inicializadas.');await db.$disconnect();
