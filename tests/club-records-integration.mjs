import assert from 'node:assert/strict';
import {connect} from '../scripts/mysql-connection.mjs';
const base=process.env.APP_URL||'http://localhost:5173';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname)||!process.env.DB_NAME?.startsWith('club_hostinger_test_'))throw new Error('Requires an isolated local test database.');
const initial=await fetch(base+'/api/content').then(r=>r.json());
assert.ok(initial.content);
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:process.env.ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD}),redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert.ok(cookie);
const headers={cookie,origin:base,'content-type':'application/json'};
let version=initial.version;
const id=crypto.randomUUID();
const season='2026/27';
const content={...initial.content,fixtures:[{id:'qa-fixture',date:'2026-10-10',season,time:'15:30',team:'Under 17',opponent:'QA United',competition:'Test League',venue:'Academy ground',homeAway:'home',status:'scheduled',goalsFor:null,goalsAgainst:null}],staff:[{id:'qa-staff',name:'QA Coach',role:'Head coach',team:'Under 17',bio:'Test staff biography.',photo:''}],standings:[{id:'qa-table',season,competition:'Test League',group:'Under 17',position:1,club:initial.content.name,played:2,won:1,drawn:1,lost:0,goalsFor:3,goalsAgainst:1,points:4}],honours:[{id:'qa-honour',season:'2025/26',title:'Test Cup',team:'Under 17',achievement:'Winners',photo:''}]};
const save=value=>fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({content:value,version})});
const contribution={id:crypto.randomUUID(),kind:'goal',minute:24,partner:'QA Teammate'};
const match={id:crypto.randomUUID(),date:'2026-09-19',season:'2026',opponent:'QA Opposition',minutes:90,goals:1,assists:1,saves:0,contributions:[contribution,{id:crypto.randomUUID(),kind:'assist',minute:61,partner:'QA Scorer'}]};
const player={name:'QA Player',dateOfBirth:`${new Date().getUTCFullYear()-10}-01-01`,ageGroup:'Under 17',position:'Forward',foot:'Right',number:9,bio:'Temporary test player',photo:'',status:'published',consent:true,videos:[],matches:[match]};
const savePlayer=value=>fetch(base+'/api/players/'+id,{method:'PUT',headers,body:JSON.stringify({player:value,version:0})});
try {
 for(const patch of [{season:'2026/29'},{played:5},{won:-1}])assert.equal((await save({...content,standings:[{...content.standings[0],...patch}]})).status,400);
 let res=await save(content);assert.equal(res.status,200,await res.clone().text());version=(await res.json()).version;
 const readback=await fetch(base+'/api/content').then(r=>r.json());
 for(const key of ['staff','standings','honours'])assert.deepEqual(readback.content[key],content[key]);
 const page=await fetch(base).then(r=>r.text());for(const text of ['QA Coach','Test League','Test Cup','2026/27','2025/26','2024/25','2023/24'])assert.ok(page.includes(text),text);
 for(const patch of [{season:'2026/28'},{goals:0},{assists:0},{contributions:[{...contribution,kind:'assist',partner:''}]}])assert.equal((await savePlayer({...player,matches:[{...match,...patch}]})).status,400);
 res=await savePlayer(player);assert.equal(res.status,200,await res.clone().text());
 const visible=(await fetch(base+'/api/players/'+id).then(r=>r.json())).player;
 assert.equal(visible.matches[0].season,season);assert.deepEqual(visible.matches[0].contributions,match.contributions);
 const profile=await fetch(base+'/players/'+id).then(r=>r.text());assert.ok(profile.includes('Assisted by QA Teammate'));assert.ok(profile.includes('Goal scored by QA Scorer'));
 if(process.argv.includes('--review')){console.log('Preview test records at '+base+' and '+base+'/players/'+id+'. Press Enter to restore.');await new Promise(resolve=>process.stdin.once('data',resolve));process.stdin.pause();}
 const legacy={...initial.content};for(const key of ['staff','standings','honours'])delete legacy[key];
 res=await save(legacy);assert.equal(res.status,200);version=(await res.json()).version;
 const old=await fetch(base+'/api/content').then(r=>r.json());for(const key of ['staff','standings','honours'])assert.deepEqual(old.content[key],[]);
 console.log('PASS: club records persist and render; legacy content defaults; consecutive seasons; standings arithmetic; named assists and goals; contribution totals; legacy player season normalization.');
} finally {
 const restored=await save(initial.content);assert.equal(restored.status,200,'Restore test content');
 const db=await connect();try{await db.execute('DELETE FROM players WHERE id = ?',[id]);}finally{await db.end();}
}
