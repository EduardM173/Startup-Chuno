import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const commands=[['Contenedores',['compose','ps']],['Bases y propietarios',['compose','exec','-T','postgres','psql','-U','postgres','-d','postgres','-c',"SELECT datname, pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname LIKE '%_db' ORDER BY datname;"]]];
let output='';for(const [title,args] of commands)output+=`${title}\n${execFileSync('docker',args,{encoding:'utf8'})}\n`;
writeFileSync('docs/evidencias/infraestructura.txt',output);console.log(output);
