import {useEffect,useRef,useState} from 'react';
import {ShieldAlert} from 'lucide-react';
import {Modal} from './UI';
import './confirmation.css';
type Request={message:string,resolve:(answer:boolean)=>void};
let receiver:((request:Request)=>void)|null=null;
export function confirmAction(message:string):Promise<boolean>{return new Promise(resolve=>{if(receiver)receiver({message,resolve});else resolve(false)})}
export function ConfirmationHost(){
 const [request,setRequest]=useState<Request|null>(null);const pending=useRef<Request|null>(null),box=useRef<HTMLDivElement>(null);
 useEffect(()=>{receiver=r=>{if(pending.current){r.resolve(false);return}pending.current=r;setRequest(r)};return()=>{receiver=null;pending.current?.resolve(false);pending.current=null}},[]);
 function finish(answer:boolean){const current=pending.current;pending.current=null;setRequest(null);current?.resolve(answer)}
 useEffect(()=>{if(!request)return;const previous=document.activeElement as HTMLElement|null;box.current?.querySelector<HTMLButtonElement>('button')?.focus();const keyboard=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();finish(false)}if(e.key==='Tab'){const buttons=box.current?.querySelectorAll<HTMLButtonElement>('button');if(!buttons?.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener('keydown',keyboard);return()=>{document.removeEventListener('keydown',keyboard);previous?.focus()}},[request]);
 return request?<div className="chuno-confirm"><Modal title="Confirmar acción" onClose={()=>finish(false)}><div ref={box}><ShieldAlert size={36}/><p>{request.message}</p><div className="confirm-actions"><button className="secondary" onClick={()=>finish(false)}>Cancelar</button><button className="primary" onClick={()=>finish(true)}>Confirmar</button></div></div></Modal></div>:null;
}
