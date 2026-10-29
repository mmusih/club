import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
globalThis.connectionTest={rows:[],pending:[],authorised:true,origin:true,failId:'',commits:0,rollbacks:0};
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}},load(url,context,next){
 if(url.endsWith('/app/storage.ts'))return {format:'module',shortCircuit:true,source:'export const canEdit=async()=>globalThis.connectionTest.authorised;export const sameOrigin=()=>globalThis.connectionTest.origin;export const readContent=async()=>({content:{fixtures:[]}});export const database=()=>({prepare:()=>({bind:(id,status)=>({first:async()=>globalThis.connectionTest.rows.find(r=>r.id===id&&r.status===status)})})});'};

 if(url.endsWith('/db/mysql.ts'))return {format:'module',shortCircuit:true,source:`
 export const getPool=()=>({getConnection:async()=>({
  beginTransaction:async()=>{const s=globalThis.connectionTest;s.pending=structuredClone(s.rows)},
  execute:async(sql,args=[])=>{const s=globalThis.connectionTest;
   if(sql.startsWith('SELECT id,body'))return [structuredClone(s.pending)];
   if(sql.startsWith('UPDATE players')){const [body,status,updated_at,id]=args;if(id===s.failId)throw Error('Simulated write failure');const row=s.pending.find(r=>r.id===id);Object.assign(row,{body,status,updated_at,version:row.version+1});return [{affectedRows:1}]}
   throw Error('Unexpected query: '+sql);
  },
  commit:async()=>{const s=globalThis.connectionTest;s.rows=structuredClone(s.pending);s.commits++},
  rollback:async()=>{globalThis.connectionTest.rollbacks++},release:()=>{}
 })});`};
 return next(url,context);
}});
const {PUT,GET}=await import('../app/api/players/[id]/route.ts');
const {newPlayer}=await import('../app/player-model.ts');
const a={...newPlayer(),name:'Scorer',ageGroup:'Senior'},b={...newPlayer(),name:'Assister',ageGroup:'Senior'};
const s=globalThis.connectionTest;
s.rows=[a,b].map(p=>({id:p.id,body:JSON.stringify(p),version:1,updated_at:'2026-10-13'}));
const input={...a,matches:[{id:crypto.randomUUID(),date:'2026-10-13',season:'2026/27',opponent:'United',minutes:90,goals:1,assists:0,saves:0,contributions:[{id:crypto.randomUUID(),minute:20,kind:'goal',partner:b.name,partnerId:b.id}]}]};
const save=(id,player,version)=>PUT(new Request('https://example.com/api/players/'+id,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({player,version})}),{params:Promise.resolve({id})});
const snapshot=JSON.stringify(s.rows),originalError=console.error;console.error=()=>{};
try{
 s.failId=b.id;const failed=await save(a.id,input,1);assert.equal(failed.status,503);assert.equal(JSON.stringify(s.rows),snapshot,'A second-profile write failure rolls back the first-profile write');assert.equal(s.commits,0);
 s.failId='';const response=await save(a.id,input,1);assert.equal(response.status,200);const data=await response.json();assert.equal(data.updatedPlayers.length,2);assert.equal(data.linkedProfilesUpdated,1);assert.equal(data.updatedPlayers.find(p=>p.id===b.id).matches[0].assists,1);
 const committed=JSON.stringify(s.rows);assert.equal((await save(b.id,b,1)).status,409,'An editor holding the old partner version cannot overwrite the linked update');assert.equal(JSON.stringify(s.rows),committed);
 s.authorised=false;assert.equal((await save(a.id,input,2)).status,401);s.authorised=true;s.origin=false;assert.equal((await save(a.id,input,2)).status,403);

 s.origin=true;
 const published={...data.player,status:'published',consent:true,photo:'/media/'+crypto.randomUUID()+'.webp'};
 const photoSave=await save(a.id,published,2);assert.equal(photoSave.status,200);
 const saved=(await photoSave.json()).player;
 assert.equal(saved.status,'published');assert.equal(saved.photo,published.photo);
 assert.equal(s.rows.find(p=>p.id===a.id).status,'published');
 const replacement={...saved,photo:'/media/'+crypto.randomUUID()+'.webp'};
 assert.equal((await save(a.id,replacement,3)).status,200);
 assert.equal(JSON.parse(s.rows.find(p=>p.id===a.id).body).photo,replacement.photo);
 assert.equal((await save(a.id,published,3)).status,409);
 const publicResponse=await GET(new Request('https://example.com/api/players/'+a.id),{params:Promise.resolve({id:a.id})});
 assert.equal(publicResponse.status,200);assert.equal(publicResponse.headers.get('Cache-Control'),'no-store');
 assert.equal((await publicResponse.json()).player.photo,replacement.photo,'Public reads return the newly saved image');
 console.log('PASS: published photo edits and replacements persist without unpublishing; stale saves are rejected.');
}finally{console.error=originalError}
console.log('PASS: atomic multi-profile save, rollback on partner failure, stale-editor conflict and authorisation.');
