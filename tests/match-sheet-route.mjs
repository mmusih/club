import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
globalThis.sheetRoute={admin:false,fixtures:[],queries:0,players:[],content:{}};
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}},load(url,context,next){
 if(url.endsWith('/app/storage.ts'))return {format:'module',shortCircuit:true,source:`
 export const canEdit=async()=>globalThis.sheetRoute.admin;
 export const sameOrigin=request=>request.headers.get('origin')==='https://example.com';
 export const readContent=async()=>({content:{...globalThis.sheetRoute.content,fixtures:globalThis.sheetRoute.fixtures}});
 export const database=()=>({prepare:()=>({all:async()=>{globalThis.sheetRoute.queries++;return {results:globalThis.sheetRoute.players.map(p=>({id:p.id,body:JSON.stringify(p)}))}}})});
 `};return next(url,context);
}});
const {GET,POST}=await import('../app/api/admin/fixtures/[id]/match-sheet/route.ts');
const {seed}=await import('../app/content.ts');
const {newPlayer}=await import('../app/player-model.ts');
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
globalThis.sheetRoute.content=seed;
const get=()=>GET(new Request('https://example.com/api/admin/fixtures/test/match-sheet'),{params:Promise.resolve({id:'test'})});
const post=(fixture,headers={})=>POST(new Request('https://example.com/api/admin/fixtures/test/match-sheet',{method:'POST',headers:{origin:'https://example.com','content-type':'application/json',...headers},body:typeof fixture==='string'?fixture:JSON.stringify(fixture)}),{params:Promise.resolve({id:'test'})});
assert.equal((await get()).status,401);assert.equal(globalThis.sheetRoute.queries,0);
assert.equal((await post({})).status,401);assert.equal(globalThis.sheetRoute.queries,0);
globalThis.sheetRoute.admin=true;assert.equal((await get()).status,404);
const f={id:'test',date:'2026-10-29',time:'15:00',team:'Senior',opponent:'Rovers',competition:'League',venue:'Home',homeAway:'home',status:'scheduled',goalsFor:null,goalsAgainst:null};
globalThis.sheetRoute.fixtures=[f];
for(const status of ['scheduled','live','cancelled','postponed']){f.status=status;assert.equal((await get()).status,200)}
Object.assign(f,{status:'played',goalsFor:1,goalsAgainst:0});
const response=await get();assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'application/pdf');assert.match(response.headers.get('Cache-Control'),/no-store/);assert.match(response.headers.get('Content-Disposition'),/attachment/);
assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
const before=JSON.stringify(globalThis.sheetRoute.fixtures);
const draft={...f,status:'scheduled',goalsFor:null,goalsAgainst:null,venue:'UNSAVED PREVIEW GROUND',sheet:{remarks:'Preview without publishing'}};
assert.equal((await post(draft,{origin:'https://other.example'})).status,403);
assert.equal((await post('{')).status,400);
assert.equal((await post({...draft,id:'different'})).status,400);
assert.equal((await post({...draft,date:'not-a-date'})).status,400);
assert.equal((await post(draft,{'content-length':'500001'})).status,413);
assert.equal((await post(' '.repeat(500001))).status,413);
assert.equal((await post({...draft,date:'',opponent:'',team:'',venue:'',time:''})).status,200,'Incomplete sheets can be downloaded without publish validation');
// A newly added fixture can be inspected before it has ever been published.
globalThis.sheetRoute.fixtures=[];
const preview=await post(draft);assert.equal(preview.status,200,await preview.clone().text());
assert.match(preview.headers.get('Cache-Control'),/private, no-store/);
async function pdfText(response){const task=getDocument({data:new Uint8Array(await response.arrayBuffer()),useSystemFonts:true});try{const pdf=await task.promise;let text='';for(let i=1;i<=pdf.numPages;i++)text+=(await (await pdf.getPage(i)).getTextContent()).items.filter(i=>'str' in i).map(i=>i.str).join(' ');return text}finally{await task.destroy()}}
const previewText=await pdfText(preview);
for(const value of ['UNSAVED PREVIEW GROUND','EDITOR COPY','Preview without publishing'])assert.ok(previewText.includes(value),value);
assert.deepEqual(globalThis.sheetRoute.fixtures,[],'Preview does not insert or publish the fixture');
globalThis.sheetRoute.fixtures=JSON.parse(before);
const players=Array.from({length:6},(_,i)=>({...newPlayer(),name:'Preview Player '+i,ageGroup:'Senior',number:i+1,maId:'00PRE'+i}));
globalThis.sheetRoute.players=players;
const linked={...draft,lineup:{formation:'2-2',starters:players.slice(0,5).map(p=>p.name),substitutes:[]},match:{phase:'pre',minute:0,duration:90,slots:players.slice(0,5).map(p=>p.id),bench:[],events:[],roster:{[players[0].id]:{name:'Forged snapshot',number:99,maId:'FAKE'}}}};
const linkedResponse=await post(linked);assert.equal(linkedResponse.status,200);
const linkedText=await pdfText(linkedResponse);assert.ok(linkedText.includes('00PRE0'));assert.ok(!linkedText.includes('Preview Player 5'),'Unselected players are excluded');assert.ok((await pdfText(await post({...linked,match:{...linked.match,bench:[players[5].id]}}))).includes('Preview Player 5'),'Explicit substitutes appear in preview');assert.ok(!linkedText.includes('Forged snapshot'));
assert.equal((await post({...linked,match:{...linked.match,bench:['missing']}})).status,200,'Unavailable profiles do not block a sheet with the remaining information');
assert.equal(JSON.stringify(globalThis.sheetRoute.fixtures),before,'Preview does not change saved match data');
console.log('PASS: administrator-only downloads in every match status; unsaved/new fixture previews; current MA IDs and selected substitutes; no writes; origin, size and data validation.');
