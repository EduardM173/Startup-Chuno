import {Supervision} from './components/Supervision';
import {AdminDashboard} from './components/AdminDashboard';
import {ClientHome} from './modules/clientes/ClientHome';
import {MyAccounts} from './modules/cuentas/MyAccounts';
import {CashDesk} from './modules/cuentas/CashDesk';
import {Profile} from './components/Profile';
import {Login} from './components/Login';
import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {type LucideIcon,Landmark,LayoutDashboard,Users,WalletCards,ReceiptText,ArrowLeftRight,HandCoins,LogOut,ShieldCheck,Menu,UserRound,KeyRound,ChevronRight} from 'lucide-react';
import {api,setToken,bs,type Row} from './api/client';
import {Form,Modal,Table} from './components/UI';
import {Clientes} from './modules/clientes/Clientes';
import {Movimientos} from './modules/cuentas/Movimientos';
import {Cuentas} from './modules/cuentas/Cuentas';
import {Pagos} from './modules/pagos/Pagos';
import {Transferencias} from './modules/transferencias/Transferencias';
import {Prestamos} from './modules/prestamos/Prestamos';
import './style.css';
import './components/admin.css';
import './components/shell-theme.css';
function App(){

 const [loanRequest,setLoanRequest]=useState(false);
 const [operationSource,setOperationSource]=useState('');
 const [user,setUser]=useState<Row|null>(null),[page,setPage]=useState('inicio'),[data,setData]=useState<Row>({clients:[],accounts:[],payments:[],transfers:[],loans:[]}),[message,setMessage]=useState(''),[loading,setLoading]=useState(false),[menu,setMenu]=useState(false);
 const admin=user?.role==='ADMIN';const notify=(m:string)=>setMessage(m);
 async function refresh(){setLoading(true);try{const [accounts,payments,transfers,loans,clients]=await Promise.all([api('cuentas','/accounts'),api('pagos','/transactions'),api('transferencias','/transactions'),api('prestamos','/loans'),admin?api('clientes','/clients'):Promise.resolve([])]);setData({accounts,payments,transfers,loans,clients})}catch(e){notify((e as Error).message)}finally{setLoading(false)}}
 useEffect(()=>{if(user&&!user.mustChangePassword)void refresh()},[user?.id]);
 async function logout(){setLoanRequest(false);setOperationSource('');try{await api('clientes','/auth/logout','POST')}catch(e){notify((e as Error).message)}setToken('');setUser(null);setData({clients:[],accounts:[],payments:[],transfers:[],loans:[]});setPage('inicio');}
 if(!user)return <Login onLogin={async b=>{const r=await api('clientes','/auth/login','POST',b);setToken(r.token);setLoading(true);setUser(r.user);setMessage('')}}/>;
 if(user.mustChangePassword)return <div className="login-form temporary-access" style={{minHeight:'100vh'}}><div className="login-box"><h2>Protege tu acceso digital</h2><p>Antes de operar, reemplaza la contraseña temporal entregada por el administrador.</p><Form fields={[{name:'current',label:'Contraseña temporal',type:'password'},{name:'password',label:'Nueva contraseña (mínimo 10 caracteres)',type:'password'}]} submit="Cambiar contraseña y volver a ingresar" onSubmit={async b=>{await api('clientes','/auth/password','POST',b);setToken('');setUser(null);setPage('inicio')}}/><button className="link" onClick={logout}>Cerrar sesión</button></div></div>;
 const nav:[string,string,LucideIcon][]=[['inicio','Inicio',LayoutDashboard],...(admin?[['clientes','Clientes',Users]]:[]),['cuentas',admin?'Cuentas bancarias':'Mis cuentas',WalletCards],...(admin?[['caja','Depósitos y retiros',Landmark],['operaciones','Operaciones',ReceiptText]]:[['movimientos','Movimientos',ReceiptText],['transferencias','Transferencias',ArrowLeftRight],['pagos','Pago de servicios',ReceiptText]]),['prestamos',admin?'Préstamos':'Mis préstamos',HandCoins],['perfil','Mi perfil',UserRound]] as [string,string,LucideIcon][];
 const total=data.accounts.reduce((s:number,a:Row)=>s+Number(a.balance)-Number(a.reserved),0);
 const common={refresh,notify};
 const pageLabel=nav.find(n=>n[0]===page)?.[1];
 return <div className={admin?'app admin-ui profile-view':'app profile-view'}><aside className={menu?'sidebar open':'sidebar'}><div className="brand"><Landmark size={27}/><span>CHUNO<span className="brand-dot">.</span></span></div><span className="nav-caption">BANCA POR INTERNET</span><nav>{nav.map(([key,label,Icon])=><button key={key} className={page===key?'active':''} onClick={()=>{setLoanRequest(false);setOperationSource('');setPage(key);setMenu(false);setMessage('')}}><Icon size={20}/>{label}</button>)}</nav><div className="sidebar-bottom"><div className="sandbox-pill"><ShieldCheck size={17}/> Entorno académico</div><small>Construido para aprender.<br/>Operaciones externas de prueba.</small><button onClick={logout}><LogOut size={18}/>Cerrar sesión</button></div></aside><div className="main-shell"><header className="topbar"><button className="icon mobile-menu" aria-label="Abrir menú" onClick={()=>setMenu(!menu)}><Menu/></button>{admin?<div className="adm-title"><h1>{page==='inicio'?'Panel administrativo':pageLabel}</h1><p>{page==='inicio'?'Resumen de la actividad bancaria.':'Gestión de la banca por internet.'}</p></div>:<div className="breadcrumb">Mi banca <ChevronRight size={14}/><strong>{pageLabel}</strong></div>}<button className={admin?'user-chip adm-user':'user-chip'} onClick={()=>setPage('perfil')}><span className="avatar">{user.names[0]}{user.surnames[0]}</span><span>{user.names} {user.surnames}<small>{admin?'Administrador':'Cliente CHUNO'}</small></span></button></header><main className="content">{message&&<div role="status" className="notice"><span>{message}</span><button className="link" onClick={()=>setMessage('')}>Cerrar</button></div>}{loading&&<p role="status" className="loading">Actualizando información…</p>}{page==='perfil'&&<Profile user={user} onUpdate={setUser} onPasswordChanged={()=>{setToken('');setUser(null);setPage('inicio')}}/>}{page==='inicio'&&!admin&&<ClientHome accounts={data.accounts} loans={data.loans} loading={loading} onNavigate={(target,request=false)=>{setOperationSource(['pagos','transferencias'].includes(target)?data.accounts.find((a:Row)=>a.status==='ACTIVA')?.id||'':'');setLoanRequest(request);setMessage('');setPage(target)}}/>}{page==='inicio'&&admin&&<AdminDashboard data={data} go={target=>{setLoanRequest(false);setOperationSource('');setPage(target);setMessage('')}}/>}{page==='clientes'&&admin&&<Clientes rows={data.clients} {...common}/>} {page==='cuentas'&&(admin?<Cuentas rows={data.accounts} clients={data.clients} admin={admin} {...common}/>:<MyAccounts rows={data.accounts} {...common} onNavigate={(target,accountId)=>{setOperationSource(accountId);setMessage('');setPage(target)}}/>)} {page==='caja'&&admin&&<CashDesk accounts={data.accounts} clients={data.clients} {...common}/>} {page==='movimientos'&&<Movimientos accounts={data.accounts} notify={notify}/>} {page==='pagos'&&<Pagos initialAccountId={operationSource} rows={data.payments} accounts={data.accounts} admin={admin} {...common}/>} {page==='transferencias'&&<Transferencias initialAccountId={operationSource} rows={data.transfers} accounts={data.accounts} admin={admin} {...common}/>} {page==='operaciones'&&admin&&<Supervision accounts={data.accounts} clients={data.clients} payments={data.payments} transfers={data.transfers} refresh={refresh}/>} {page==='prestamos'&&<Prestamos initialCreate={loanRequest} rows={data.loans} clients={data.clients} admin={admin} {...common}/>}<footer className="page-footer"><span>CHUNO · Banca por internet</span><span>SANDBOX · Demostración académica</span></footer></main></div></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
