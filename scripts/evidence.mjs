import {chromium} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/audit-snapshot.mjs'],{stdio:'pipe'});
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1600,height:1000}});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const [input,output,title] of [['infraestructura.txt','18-contenedores-bases.png','Inspección real de Docker Compose y PostgreSQL'],['pruebas-api.txt','19-pruebas-api.png','Salida real de verificaciones bancarias'],['pruebas-navegador.txt','20-pruebas-navegador.png','Salida real de pruebas Chrome'],['aislamiento-bases.txt','21-aislamiento-bases.png','Conexiones propias y rechazo de accesos cruzados']]){
 const content=readFileSync(`docs/evidencias/${input}`,'utf8');await page.setContent(`<html lang="es"><meta charset="utf-8"><style>body{font:18px 'Segoe UI',sans-serif;color:#20372b;padding:35px;background:#fafcfb}h1{font-size:28px}small{color:#627366}pre{background:white;border:1px solid #d7e0da;padding:24px;font:15px Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}</style><h1>${title}</h1><small>CHUNO · Datos obtenidos de comandos ejecutados, sin resultados simulados · ${new Date().toISOString()}</small><pre>${escape(content)}</pre></html>`);await page.screenshot({path:`docs/evidencias/${output}`,fullPage:true});
}
await browser.close();
