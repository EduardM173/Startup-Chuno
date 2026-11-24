import {useEffect,useState} from 'react';
import {api,type Row} from '../../api/client';
import {Table} from '../../components/UI';
export function Movimientos({accounts,notify}:{accounts:Row[],notify:(m:string)=>void}){
 const [rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{Promise.all(accounts.map(async a=>(await api('cuentas',`/accounts/${a.id}/movements`)).map((m:Row)=>({...m,number:a.number})))).then(groups=>setRows(groups.flat().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))).catch(e=>notify(e.message)).finally(()=>setLoading(false))},[accounts]);
 return <><div className="section-heading"><div><h2>Mis movimientos</h2><p>Historial de tus cuentas de ahorro, ordenado del más reciente al más antiguo.</p></div></div>{loading?<p>Consultando movimientos…</p>:<Table rows={rows} columns={[["createdAt","Fecha"],["number","Cuenta"],["kind","Operación"],["description","Concepto"],["amount","Importe"],["balanceAfter","Saldo"]]}/>}</>;
}
