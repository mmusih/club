import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const files=[];
function add(name) {
  const stat=fs.lstatSync(name);
  if(stat.isSymbolicLink()) throw new Error('Refusing to package symbolic link: '+name);
  if(stat.isDirectory()) for(const child of fs.readdirSync(name)) add(path.join(name,child));
  else files.push(name.replaceAll('\\','/'));
}
for(const name of ['app','components','db','drizzle/mysql','hooks','lib','public','tests',
  'package.json','package-lock.json','next.config.ts','next-env.d.ts','tsconfig.json',
  'postcss.config.mjs','eslint.config.mjs','drizzle.config.ts','.env.example','.npmrc','README.md','HOSTINGER.md','ACADEMY-PHOTO-SOURCES.md',
  'scripts/mysql-connection.mjs','scripts/migrate-mysql.mjs','scripts/admin-password.mjs','scripts/import-content.mjs','scripts/package-hostinger.mjs']) add(name);
if(files.some(f=>/(^|\/)\.env(?!\.example$)/.test(f))) throw new Error('Secret environment file found in package.');
fs.mkdirSync('outputs',{recursive:true});
const output='outputs/hostinger-upload.zip';
const result=process.platform==='win32'
  ? spawnSync('tar.exe',['-a','-c','-f',output,...files],{stdio:'inherit',windowsHide:true})
  : spawnSync('zip',['-q',output,...files],{stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)throw new Error('Packaging failed.');
console.log('Created '+output+' ('+files.length+' source files). No credentials, local databases, or test configuration included.');
