import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}}});
const {newPlayer}=await import('../app/player-model.ts');
const base=process.env.APP_URL;
assert.ok(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname)&&process.env.DB_NAME?.startsWith('club_hostinger_test_'),'Only use an isolated local test database');
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:process.env.ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD}),redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert.ok(cookie,'Test administrator can sign in');
const headers={cookie,origin:base,'content-type':'application/json'},read=()=>fetch(base+'/api/content',{headers}).then(r=>r.json());
const initial=await read();let version=initial.version;
const players=[];
async function save(content){const r=await fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({content,version})});assert.equal(r.status,200,await r.clone().text());version=(await r.json()).version;return (await read()).content}
async function savePlayer(player,v){const r=await fetch(base+'/api/players/'+player.id,{method:'PUT',headers,body:JSON.stringify({player,version:v})});assert.equal(r.status,200,await r.clone().text());return r.json()}
try{
 const team='Sheet QA '+crypto.randomUUID().slice(0,8);
 for(let i=0;i<7;i++){
  const p={...newPlayer(),name:'Sheet QA Player '+(i+1),team,ageGroup:'Senior',number:i+1,maId:'00QA'+i,dateOfBirth:'2000-01-01',status:i===0?'published':'draft',consent:i===0};
  await savePlayer(p,0);players.push(p);
 }
 const f={id:crypto.randomUUID(),date:'2026-10-29',time:'15:00',team,opponent:'Sheet QA United',competition:'QA friendly',venue:'Test ground',homeAway:'away',status:'scheduled',goalsFor:null,goalsAgainst:null,lineup:{formation:'2-2',starters:players.slice(0,5).map(p=>p.name),substitutes:[]},match:{phase:'pre',minute:0,duration:90,slots:players.slice(0,5).map(p=>p.id),bench:[],events:[]},sheet:{teamColors:'Navy',halfTimeFor:0,halfTimeAgainst:0,captainId:players[0].id,remarks:'Saved QA remarks'}};
 let content=await save({...initial.content,fixtures:[...initial.content.fixtures,f]});
 let saved=content.fixtures.find(row=>row.id===f.id);
 assert.deepEqual(new Set(saved.match.bench),new Set(players.slice(5).map(p=>p.id)),'Publish automatically fills substitutes');
 assert.equal(saved.sheet.remarks,'Saved QA remarks');assert.equal(saved.match.roster[players[0].id].maId,'00QA0');
 const endpoint=base+'/api/admin/fixtures/'+f.id+'/match-sheet';
 assert.equal((await fetch(endpoint)).status,401);assert.equal((await fetch(endpoint,{headers})).status,409);
 saved={...saved,status:'played',goalsFor:1,goalsAgainst:0,match:{...saved.match,phase:'finished',minute:90,period:'second',events:[{id:crypto.randomUUID(),kind:'goal',minute:20,period:'first',playerId:players[0].id},{id:crypto.randomUUID(),kind:'substitution',minute:60,period:'second',playerId:players[1].id,replacementId:players[5].id}]}};
 content=await save({...content,fixtures:content.fixtures.map(row=>row.id===f.id?saved:row)});
 await savePlayer({...players[0],name:'Edited profile name',maId:'CHANGED'},1);
 content=await save(content);
 saved=content.fixtures.find(row=>row.id===f.id);
 assert.equal(saved.match.roster[players[0].id].name,'Sheet QA Player 1');assert.equal(saved.match.roster[players[0].id].maId,'00QA0');
 const response=await fetch(endpoint,{headers});assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'application/pdf');
 const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');const task=getDocument({data:new Uint8Array(await response.arrayBuffer()),useSystemFonts:true});const pdf=await task.promise;
 const text=(await (await pdf.getPage(1)).getTextContent()).items.filter(i=>'str' in i).map(i=>i.str).join(' ');assert.ok(text.includes('00QA0'));assert.ok(text.includes('Saved QA remarks'));assert.ok(text.includes("60'"));await task.destroy();
 const publicPlayer=(await (await fetch(base+'/api/players/'+players[0].id)).json()).player;
 assert.equal(typeof publicPlayer.age,'number');assert.equal(publicPlayer.maId,undefined);assert.equal(publicPlayer.dateOfBirth,undefined);
 const publicContent=await (await fetch(base+'/api/content')).json();const publicFixture=publicContent.content.fixtures.find(row=>row.id===f.id);assert.equal(publicFixture.sheet,undefined);assert.equal(publicFixture.match,undefined);
 console.log('PASS: authenticated database round trip, automatic substitutes on publish, MA ID/metadata persistence, historical identity after profile edits, public age/privacy and completed-game PDF download.');
}finally{
 version=(await read()).version;await save(initial.content);
 for(const p of players){const current=(await (await fetch(base+'/api/admin/players',{headers})).json()).players.find(row=>row.id===p.id);if(!current)continue;const r=await fetch(base+'/api/players/'+p.id,{method:'DELETE',headers:{...headers,'If-Match':String(current.version)}});assert.equal(r.status,200,await r.clone().text())}
}
