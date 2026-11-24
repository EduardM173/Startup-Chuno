import {PrismaClient} from '../services/clientes/generated/client/index.js';
import bcrypt from 'bcryptjs';
const db=new PrismaClient();
await db.user.upsert({where:{email:'admin@chuno.demo'},update:{},create:{email:'admin@chuno.demo',names:'Administración',surnames:'CHUNO',password:await bcrypt.hash('AdminChuno2026!',12),role:'ADMIN',status:'ACTIVO',mustChangePassword:false}});
console.log('Administrador académico inicializado sin ficha de cliente.');await db.$disconnect();
