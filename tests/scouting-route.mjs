import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
globalThis.scoutingTest={rows:[],pending:[]};
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}},load(url,context,next){
 if(url.endsWith('/app/storage.ts'))return {format:'module',shortCircuit:true,source:`
  export const canEdit=async()=>true;export const sameOrigin=()=>true;export const readContent=async()=>({content:{fixtures:[]}});
  export const database=()=>({prepare:()=>({bind:(id,status)=>({first:async()=>globalThis.scoutingTest.rows.find(r=>r.id===id&&r.status===status)})})});
 `};
 if(url.endsWith('/db/mysql.ts'))return {format:'module',shortCircuit:true,source:`
  export const getPool=()=>({getConnection:async()=>({
   beginTransaction:async()=>{const s=globalThis.scoutingTest;s.pending=structuredClone(s.rows)},
   execute:async(sql,args=[])=>{const s=globalThis.scoutingTest;
    if(sql.startsWith('SELECT id,body'))return [structuredClone(s.pending)];
    if(sql.startsWith('INSERT INTO players')){const [id,body,status,updated_at]=args;s.pending.push({id,body,status,updated_at,version:1});return [{affectedRows:1}]}
    if(sql.startsWith('UPDATE players')){const [body,status,updated_at,id]=args;const row=s.pending.find(r=>r.id===id);Object.assign(row,{body,status,updated_at,version:row.version+1});return [{affectedRows:1}]}
    throw Error('Unexpected query: '+sql);
   },
   commit:async()=>{const s=globalThis.scoutingTest;s.rows=structuredClone(s.pending)},rollback:async()=>{},release:()=>{}
  })});
 `};
 return next(url,context);
}});
const {PUT,GET}=await import('../app/api/players/[id]/route.ts');
const {newPlayer}=await import('../app/player-model.ts');
const player={...newPlayer(),name:'Scouting QA',team:'Senior A',ageGroup:'Senior',heightCm:180,nationality:'Botswana',position:'Striker',secondaryPosition:'Left winger',experienceLevel:'Semi-professional',experienceDetails:'Regional league',strengths:'Finishing',achievements:'Golden boot',recruitmentStatus:'Open to enquiries',clubHistory:[{id:crypto.randomUUID(),club:'Previous Club',team:'Senior',startYear:2020,endYear:2024,notes:'Forward'}],dateOfBirth:'2000-01-01'};
const params={params:Promise.resolve({id:player.id})};
const save=(data,version)=>PUT(new Request('https://example.com/api/players/'+player.id,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({player:data,version})}),params);
const get=()=>GET(new Request('https://example.com/api/players/'+player.id),params);
let response=await save(player,0);assert.equal(response.status,200);assert.equal((await get()).status,404,'Draft scouting information is private');
response=await save({...player,status:'published',consent:true},1);assert.equal(response.status,200);
const publicData=(await (await get()).json()).player;
for(const field of ['team','heightCm','nationality','position','secondaryPosition','experienceLevel','experienceDetails','strengths','achievements','recruitmentStatus','clubHistory'])assert.deepEqual(publicData[field],player[field],field+' survives save and public read-back');
assert.equal('dateOfBirth' in publicData,false);assert.equal('consent' in publicData,false);
assert.equal((await save({...player,heightCm:400},2)).status,400);
assert.equal(JSON.parse(globalThis.scoutingTest.rows[0].body).heightCm,180,'Invalid edits do not overwrite saved details');
assert.equal((await save({...player,team:'Senior B',heightCm:'',clubHistory:[]},1)).status,409);
assert.equal((await save({...player,team:'Senior B',heightCm:'',clubHistory:[]},2)).status,200);
const saved=JSON.parse(globalThis.scoutingTest.rows[0].body);assert.equal(saved.team,'Senior B');assert.equal(saved.heightCm,'');assert.deepEqual(saved.clubHistory,[]);
assert.equal((await get()).status,404,'Unpublishing removes all scouting information');
console.log('PASS: scouting profile create, publish, public read-back, validation, stale writes, team reassignment, optional-field clearing and draft privacy.');
