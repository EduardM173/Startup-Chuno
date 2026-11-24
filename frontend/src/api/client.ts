let token='';
export function setToken(value:string){token=value;}
export async function api(service:string,path:string,method='GET',body?:unknown){
 const r=await fetch(`/api/${service}${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json().catch(()=>({error:'Servicio temporalmente no disponible'}));
 if(!r.ok)throw new Error(data.error||'No se pudo completar la operación');return data;
}
export const bs=(value:string|number)=>new Intl.NumberFormat('es-BO',{style:'currency',currency:'BOB'}).format(Number(value));
export const date=(value:string)=>new Date(value).toLocaleString('es-BO');
export type Row=Record<string,any>;
