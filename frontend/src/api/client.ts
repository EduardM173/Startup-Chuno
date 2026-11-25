const sessionKey='chuno.session';
let token='';
try{token=sessionStorage.getItem(sessionKey)||''}catch{}
export function getToken(){return token}
export class ApiError extends Error {constructor(message:string,public status:number){super(message)}}
export function setToken(value:string){token=value;try{if(value)sessionStorage.setItem(sessionKey,value);else sessionStorage.removeItem(sessionKey)}catch{}}
export async function api(service:string,path:string,method='GET',body?:unknown){
 const r=await fetch(`/api/${service}${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json().catch(()=>({error:'Servicio temporalmente no disponible'}));
 if(r.status===401&&token){setToken('');window.dispatchEvent(new Event('chuno:session-expired'))}
 if(!r.ok)throw new ApiError(data.error||'No se pudo completar la operación',r.status);return data;
}
export const bs=(value:string|number)=>new Intl.NumberFormat('es-BO',{style:'currency',currency:'BOB'}).format(Number(value));
export const date=(value:string)=>new Date(value).toLocaleString('es-BO');
export type Row=Record<string,any>;
