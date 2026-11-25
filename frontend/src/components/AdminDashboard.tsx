import {useEffect,useMemo,useState} from 'react';
import {AlertCircle,ArrowLeftRight,ArrowRight,Check,ChevronRight,ClipboardList,Clock,Coins,CreditCard,HandCoins,List,UserPlus,Users,X,Zap} from 'lucide-react';
import {api,type Row} from '../api/client';

/* Panel administrativo (solo visual): reutiliza los datos que ya carga App en main.tsx.
   Las operaciones de caja (depósitos y retiros) se leen con el endpoint existente
   GET /accounts/:id/movements; si falla, el panel sigue mostrando pagos y transferencias. */

const money=(v:string|number)=>`Bs. ${Number(v).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const short=(names='',surnames='')=>`${names.split(' ')[0]} ${surnames.split(' ')[0]}`.trim();
const transferLabel:Record<string,string>={PROPIA:'Transferencia propia',TERCERO:'Transferencia interna',INTERBANCARIA:'Transferencia interbancaria'};
const opLabel=(r:Row)=>r.source==='caja'?(r.kind==='DEPOSITO'?'Depósito':'Retiro'):r.source==='pago'?'Pago de servicio':transferLabel[r.kind]||'Transferencia';
const tone=(s:string)=>['CONFIRMADO','ACEPTADO','COMPLETADO','APROBADO'].includes(s)?'ok':['RECHAZADO','REVERTIDO','CANCELADO','FALLIDO'].includes(s)?'bad':'wait';
const statusText=(s:string,t:string)=>t==='ok'?'Confirmado':t==='wait'?'Pendiente':s.charAt(0)+s.slice(1).toLowerCase().replaceAll('_',' ');

function Status({value}:{value:string}){const t=tone(value);return <span className={`adm-status ${t}`}>{t==='ok'?<Check size={18}/>:t==='wait'?<Clock size={18}/>:<X size={18}/>}{statusText(value,t)}</span>}

export function AdminDashboard({data,go}:{data:Row,go:(page:string,action?:string)=>void}){
 const [cash,setCash]=useState<Row[]>([]);
 useEffect(()=>{
  let alive=true;
  Promise.allSettled((data.accounts as Row[]).map((a:Row)=>api('cuentas',`/accounts/${a.id}/movements`))).then(res=>{
   if(!alive)return;
   setCash(res.flatMap((r):Row[]=>r.status==='fulfilled'?(r.value as Row[]).filter((m:Row)=>['DEPOSITO','RETIRO'].includes(m.kind)).map((m:Row):Row=>({...m,source:'caja',status:'CONFIRMADO',amount:Math.abs(Number(m.amount))})):[]));
  });
  return()=>{alive=false};
 },[data.accounts]);

 const operations=useMemo<Row[]>(()=>{
  const owner:Record<string,string>={};(data.accounts as Row[]).forEach((a:Row)=>{owner[a.id]=a.clientId});
  const name:Record<string,string>={};(data.clients as Row[]).forEach((c:Row)=>{name[c.id]=short(c.names,c.surnames)});
  const all:Row[]=[...(data.payments as Row[]).map((r:Row):Row=>({...r,source:'pago'})),...(data.transfers as Row[]).map((r:Row):Row=>({...r,source:'transferencia'})),...cash];
  return all
   .map((r:Row):Row=>({...r,clientName:name[r.clientId||owner[r.accountId]]||'—'}))
   .sort((a:Row,b:Row)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 },[data,cash]);

 const today=new Date().toDateString();
 const loansPending=(data.loans as Row[]).filter((l:Row)=>['SOLICITADO','EN_REVISION'].includes(l.status)).length;
 const transfersPending=(data.transfers as Row[]).filter((t:Row)=>['PENDIENTE','PROCESANDO'].includes(t.status)).length;
 const kpis:[string,number,typeof Users][]=[
  ['Clientes activos',(data.clients as Row[]).filter((c:Row)=>c.active&&!c.deleted).length,Users],
  ['Cuentas activas',(data.accounts as Row[]).filter((a:Row)=>a.status==='ACTIVA').length,CreditCard],
  ['Operaciones de hoy',operations.filter((o:Row)=>new Date(o.createdAt).toDateString()===today).length,ArrowLeftRight],
  ['Préstamos pendientes',loansPending,HandCoins]
 ];
 const quick:[string,string,typeof Users][]=[['clientes','Registrar cliente',UserPlus],['cuentas','Abrir cuenta',CreditCard],['caja','Registrar depósito o retiro',Coins],['prestamos','Gestionar préstamos',HandCoins]];

 return <div className="adm-dash">
  <div className="adm-main">
   <section className="adm-kpis" aria-label="Indicadores">{kpis.map(([label,value,Icon])=><article className="adm-kpi" key={label}><span className="adm-tile"><Icon size={30} strokeWidth={1.7}/></span><div><span>{label}</span><strong>{value}</strong></div></article>)}</section>
   <section className="adm-card adm-ops" aria-labelledby="adm-ops-title">
    <h2 id="adm-ops-title"><span className="adm-tile small"><List size={24}/></span>Últimas operaciones</h2>
    {operations.length?<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Referencia</th><th>Cliente</th><th>Operación</th><th className="num">Importe</th><th>Estado</th></tr></thead><tbody>{operations.slice(0,5).map((o:Row)=><tr key={`${o.source}-${o.id}-${o.kind}`}><td>OP-{String(o.operationId||o.id).replaceAll('-','').slice(0,6).toUpperCase()}</td><td>{o.clientName}</td><td>{opLabel(o)}</td><td className="num">{money(o.amount)}</td><td><Status value={o.status}/></td></tr>)}</tbody></table></div>:<p className="adm-empty">Aún no hay operaciones registradas.</p>}
    <div className="adm-ops-foot"><button className="adm-link" onClick={()=>go('operaciones')}>Ver operaciones <ArrowRight size={20}/></button></div>
   </section>
  </div>
  <aside className="adm-side">
   <section className="adm-card"><h2 className="adm-side-title"><Zap size={30} strokeWidth={1.5}/>Accesos rápidos</h2><div className="adm-card-body">{quick.map(([key,label,Icon])=><button key={key} className="adm-quick" onClick={()=>go(key,key==='clientes'||key==='cuentas'?'create':key==='caja'?'cash':'pending')}><Icon size={24} strokeWidth={1.7}/>{label}</button>)}</div></section>
   <section className="adm-card"><h2 className="adm-side-title"><AlertCircle size={30} strokeWidth={1.5}/>Atención pendiente</h2><div className="adm-card-body">
    <button className="adm-attn" onClick={()=>go('prestamos','pending')}><ClipboardList size={24} strokeWidth={1.6}/><span>{loansPending?`${loansPending} solicitud${loansPending===1?'':'es'} de préstamo`:'Sin solicitudes de préstamo'}</span><ChevronRight size={20}/></button>
    <button className="adm-attn" onClick={()=>go('operaciones','pending-transfers')}><ArrowLeftRight size={24} strokeWidth={1.6}/><span>{transfersPending?`${transfersPending} transferencia${transfersPending===1?'':'s'} pendiente${transfersPending===1?'':'s'}`:'Sin transferencias pendientes'}</span><ChevronRight size={20}/></button>
    <div className="adm-attn-links"><button className="adm-link small" onClick={()=>go('prestamos','pending')}>Revisar préstamos <ArrowRight size={16}/></button><button className="adm-link small" onClick={()=>go('operaciones')}>Ver operaciones <ArrowRight size={16}/></button></div>
   </div></section>
  </aside>
 </div>;
}
