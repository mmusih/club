import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
globalThis.sheetRoute={admin:false,fixtures:[],queries:0};
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}},load(url,context,next){
 if(url.endsWith('/app/storage.ts'))return {format:'module',shortCircuit:true,source:`
 export const canEdit=async()=>globalThis.sheetRoute.admin;
 export const readContent=async()=>({content:{name:'Test Club',fixtures:globalThis.sheetRoute.fixtures}});
 export const database=()=>({prepare:()=>({all:async()=>{globalThis.sheetRoute.queries++;return {results:[]}}})});
 `};return next(url,context);
}});
const {GET}=await import('../app/api/admin/fixtures/[id]/match-sheet/route.ts');
const get=()=>GET(new Request('https://example.com/api/admin/fixtures/test/match-sheet'),{params:Promise.resolve({id:'test'})});
assert.equal((await get()).status,401);assert.equal(globalThis.sheetRoute.queries,0);
globalThis.sheetRoute.admin=true;assert.equal((await get()).status,404);
const f={id:'test',date:'2026-10-29',time:'15:00',team:'Senior',opponent:'Rovers',competition:'League',venue:'Home',status:'scheduled',goalsFor:null,goalsAgainst:null};
globalThis.sheetRoute.fixtures=[f];
for(const status of ['scheduled','live','cancelled','postponed']){f.status=status;assert.equal((await get()).status,409)}
Object.assign(f,{status:'played',goalsFor:1,goalsAgainst:0});
const response=await get();assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'application/pdf');assert.match(response.headers.get('Cache-Control'),/no-store/);assert.match(response.headers.get('Content-Disposition'),/attachment/);
assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
console.log('PASS: match sheet authentication, not-found, completion gate, legacy fixtures and PDF attachment response.');
