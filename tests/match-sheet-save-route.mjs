import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
globalThis.sheetSave={players:[],content:null,version:0};
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}},load(url,context,next){
 if(url.endsWith('/app/storage.ts'))return {format:'module',shortCircuit:true,source:`
 export const canEdit=async()=>true;export const sameOrigin=()=>true;
 export const readContent=async()=>({content:structuredClone(globalThis.sheetSave.content),version:globalThis.sheetSave.version});
 export const database=()=>({prepare:(sql)=>{
  const statement=(args=[])=>({bind:(...values)=>statement(values),all:async()=>({results:globalThis.sheetSave.players.map(p=>({id:p.id,body:JSON.stringify(p)}))}),run:async()=>{
   const s=globalThis.sheetSave;if(sql.startsWith('INSERT')&&s.version!==0||sql.startsWith('UPDATE')&&s.version!==args[2])return {meta:{changes:0}};
   s.content=JSON.parse(args[0]);s.version++;return {meta:{changes:1}};
  }});return statement();
 }});
 `};return next(url,context);
}});
const {seed}=await import('../app/content.ts');
const {newPlayer}=await import('../app/player-model.ts');
const {PUT}=await import('../app/api/content/route.ts');
const state=globalThis.sheetSave;state.content=seed;
state.players=Array.from({length:7},(_,i)=>({...newPlayer(),name:'Save Test '+i,number:i+1,ageGroup:'Senior',maId:'00MA'+i}));
const f={id:'saved-sheet',date:'2026-10-29',time:'15:00',team:'Senior',opponent:'Rovers',competition:'Friendly',venue:'Home',homeAway:'home',status:'scheduled',goalsFor:null,goalsAgainst:null,lineup:{formation:'2-2',starters:state.players.slice(0,5).map(p=>p.name),substitutes:[]},match:{phase:'pre',minute:0,duration:90,slots:state.players.slice(0,5).map(p=>p.id),bench:[],events:[]},sheet:{captainId:state.players[0].id,remarks:'Saved remarks',halfTimeFor:0}};
const save=(content,version=state.version)=>PUT(new Request('https://example.com/api/content',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({content,version})}));
let r=await save({...seed,fixtures:[f]});assert.equal(r.status,200,await r.clone().text());
let saved=state.content.fixtures[0];assert.deepEqual(saved.match.bench,state.players.slice(5).map(p=>p.id));assert.equal(saved.lineup.substitutes.length,2);assert.equal(saved.sheet.halfTimeFor,0);
assert.equal(saved.match.roster[state.players[0].id].maId,'00MA0');
r=await save({...state.content,fixtures:[{...saved,status:'played',goalsFor:0,goalsAgainst:0,match:{...saved.match,phase:'finished',period:'second',minute:90}}]});assert.equal(r.status,200);
state.players[0].name='Changed Name';state.players[0].maId='CHANGED';
r=await save(state.content);assert.equal(r.status,200);saved=state.content.fixtures[0];assert.equal(saved.match.roster[state.players[0].id].name,'Save Test 0');assert.equal(saved.match.roster[state.players[0].id].maId,'00MA0');
const before=JSON.stringify(state.content);assert.equal((await save({...state.content,fixtures:[{...saved,report:'Stale edit'}]},1)).status,409);assert.equal(JSON.stringify(state.content),before);
assert.equal((await save({...state.content,fixtures:[{...saved,sheet:{...saved.sheet,halfTimeFor:-1}}]})).status,400);
assert.equal((await save({...state.content,fixtures:[{...saved,match:{...saved.match,bench:['missing']}}]})).status,400);
console.log('PASS: content API insert/update persistence, server-side automatic substitutes, MA ID snapshots, match metadata, stale-write protection and validation.');
