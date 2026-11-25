import {ClientDetail} from './ClientDetail';
import {useState} from 'react';
import {api,type Row} from '../../api/client';
import {Table,Form,Modal,type Field} from '../../components/UI';
export const clientFields:Field[]=[{name:'document',label:'Documento de identidad'},{name:'names',label:'Nombres'},{name:'surnames',label:'Apellidos'},{name:'email',label:'Correo electrónico',type:'email'},{name:'phone',label:'Teléfono'},{name:'address',label:'Dirección'}];
export function Clientes({initialCreate=false,rows,refresh,notify,onDetailChange}:{initialCreate?:boolean,rows:Row[],refresh:()=>Promise<void>,notify:(m:string)=>void,onDetailChange?:(open:boolean)=>void}){
 const [selected,setSelected]=useState<string|null>(null),[create,setCreate]=useState(initialCreate),[q,setQ]=useState('');
 if(selected)return <ClientDetail clientId={selected} fields={clientFields} refresh={refresh} onBack={()=>{setSelected(null);onDetailChange?.(false)}}/>;
 return <><div className="section-heading"><div><h2>Clientes</h2><p>Administra la información y el acceso de tus clientes.</p></div><button className="primary" onClick={()=>setCreate(true)}>Nuevo cliente</button></div><input className="search" placeholder="Buscar por nombre, documento o correo" aria-label="Buscar clientes" value={q} onChange={e=>setQ(e.target.value)}/><Table rows={rows.filter(r=>[r.names,r.surnames,r.document,r.email].join(' ').toLowerCase().includes(q.toLowerCase()))} columns={[["document","Documento"],["names","Nombres"],["surnames","Apellidos"],["email","Correo"],["active","Estado"]]} onSelect={c=>{setSelected(c.id);notify('');onDetailChange?.(true)}}/>{create&&<Modal title="Nuevo cliente" onClose={()=>setCreate(false)}><Form fields={clientFields} submit="Crear cliente" onSubmit={async b=>{await api('clientes','/clients','POST',b);setCreate(false);await refresh();notify('Cliente creado correctamente')}}/></Modal>}</>;
}
