import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {hashPassword} from '../lib/password.mjs';
const state=globalThis.adminAccountTest={sessions:new Map(),attempts:new Map(),token:'',origin:true};
globalThis.adminAccountDatabase=()=>({prepare(sql){return {bind(...args){return {
 async run(){
  if(sql.startsWith('INSERT INTO login_attempts')){assert.ok(args[0].length<=64);state.attempts.set(args[0],(state.attempts.get(args[0])||0)+1)}
  if(sql.startsWith('DELETE FROM login_attempts'))state.attempts.delete(args[0]);
  if(sql.startsWith('INSERT INTO admin_sessions'))state.sessions.set(args[0],{email:args[1],credential_version:args[2]});
  return {meta:{changes:1}};
 },
 async first(){return sql.includes('FROM login_attempts')?{attempts:state.attempts.get(args[0])}:state.sessions.get(args[0])||null}
 }}}}});
registerHooks({resolve(specifier,context,next){
 if(['next/headers','next/navigation','next/server'].includes(specifier))return {url:'mock:'+specifier,shortCircuit:true};
 try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}
},load(url,context,next){
 const source=url==='mock:next/headers'?`export async function cookies(){return {get:()=>({value:globalThis.adminAccountTest.token})}}`:
 url==='mock:next/navigation'?`export function redirect(){throw Error('redirect')}`:
 url==='mock:next/server'?`export const NextResponse={redirect(url,status){const res=new Response(null,{status,headers:{location:String(url)}});res.cookies={set(name,value){res.headers.set('set-cookie',name+'='+value)}};return res}}`:
 url.endsWith('/db/mysql.ts')?`export const database=globalThis.adminAccountDatabase;`:
 url.endsWith('/app/storage.ts')?`export const database=globalThis.adminAccountDatabase;export const sameOrigin=()=>globalThis.adminAccountTest.origin;`:null;
 return source?{format:'module',shortCircuit:true,source}:next(url,context);
}});
const primaryPassword='Original password for test';
const extraPassword='Additional password for test';
process.env.APP_URL='https://club.example';
process.env.ADMIN_EMAIL='Original@club.example';
process.env.ADMIN_PASSWORD_HASH=await hashPassword(primaryPassword);
const additional={email:'shakes@eyesontheball.co.bw',passwordHash:await hashPassword(extraPassword)};
process.env.ADMIN_ADDITIONAL_ACCOUNTS=JSON.stringify([additional]);
const {adminAccounts}=await import('../app/admin-accounts.ts');
const {POST}=await import('../app/api/auth/login/route.ts');
const {getAdminUser,tokenHash}=await import('../app/auth.ts');
const login=(email,password)=>POST(new Request('https://club.example/api/auth/login',{method:'POST',body:new URLSearchParams({email,password})}));
const token=res=>res.headers.get('set-cookie')?.split('=')[1];
const primary=await login(' ORIGINAL@club.example ',primaryPassword);
assert.equal(primary.headers.get('location'),'https://club.example/admin');
const originalToken=token(primary);
const extra=await login(additional.email,extraPassword);
assert.equal(extra.headers.get('location'),'https://club.example/admin');
const extraToken=token(extra);
state.token=originalToken;assert.equal((await getAdminUser()).email,'original@club.example');
state.token=extraToken;assert.equal((await getAdminUser()).email,additional.email);
assert.match((await login(additional.email,primaryPassword)).headers.get('location'),/error=invalid/);
assert.match((await login('unknown@club.example',primaryPassword)).headers.get('location'),/error=invalid/);
for(let i=0;i<10;i++)await login(additional.email,'wrong');
assert.match((await login(additional.email,extraPassword)).headers.get('location'),/error=limit/);
assert.equal((await login('original@club.example',primaryPassword)).headers.get('location'),'https://club.example/admin');
assert.ok(state.attempts.has(tokenHash(additional.email)));
process.env.ADMIN_ADDITIONAL_ACCOUNTS=JSON.stringify([{...additional,passwordHash:await hashPassword('Rotated additional test password')}]);
assert.equal(await getAdminUser(),null,'Rotating an additional password revokes its sessions');
state.token=originalToken;assert.ok(await getAdminUser(),'Primary sessions remain valid');
process.env.ADMIN_ADDITIONAL_ACCOUNTS='[]';state.token=extraToken;assert.equal(await getAdminUser(),null);
process.env.ADMIN_ADDITIONAL_ACCOUNTS=JSON.stringify([{email:process.env.ADMIN_EMAIL,passwordHash:additional.passwordHash},additional,additional,{email:'bad',passwordHash:'bad'}]);
assert.equal(adminAccounts().length,2);
assert.equal(adminAccounts()[0].passwordHash,process.env.ADMIN_PASSWORD_HASH,'Extra entries cannot override the primary');
process.env.ADMIN_ADDITIONAL_ACCOUNTS='invalid json';assert.equal(adminAccounts().length,1);
state.token=originalToken;assert.ok(await getAdminUser(),'Malformed additional configuration preserves primary access');
state.origin=false;assert.equal((await login(additional.email,extraPassword)).status,403);
console.log('PASS: independent admin login, passwords, sessions, removal, rotation, throttling, primary preservation and origin protection.');
