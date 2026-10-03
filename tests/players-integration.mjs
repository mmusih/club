import {connect} from '../scripts/mysql-connection.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const base=process.env.APP_URL||'http://localhost:5173';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname)||!process.env.DB_NAME?.startsWith('club_hostinger_test_'))throw new Error('Integration tests require the isolated local test database.');
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:process.env.ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD}),redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert.ok(cookie);
const headers={cookie,origin:base,'content-type':'application/json'};const id=crypto.randomUUID();
const data={name:'Example Player — QA only',dateOfBirth:`${new Date().getUTCFullYear()-10}-01-01`,ageGroup:'Under 13',position:'Midfielder',foot:'Right',number:8,bio:'Temporary test profile to verify player pages. This is not a real academy player.',photo:'',status:'draft',consent:false,matches:[{id:crypto.randomUUID(),date:'2026-08-15',season:'2026',opponent:'Example opposition',minutes:60,goals:2,assists:1,saves:0},{id:crypto.randomUUID(),date:'2025-08-15',season:'2025',opponent:'Previous season example',minutes:40,goals:1,assists:0,saves:0}],videos:[{id:crypto.randomUUID(),title:'Video link format example',url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}]};
const put=(player,version,h=headers)=>fetch(base+'/api/players/'+id,{method:'PUT',headers:h,body:JSON.stringify({player,version})});
assert.equal((await fetch(base+'/api/admin/players')).status,403);
assert.equal((await put(data,0,{origin:base,'content-type':'application/json'})).status,403);
assert.equal((await put(data,0,{...headers,origin:'https://other.example'})).status,403);
assert.equal((await put({...data,status:'published'},0)).status,400);
let res=await put(data,0);assert.equal(res.status,200,await res.clone().text());let saved=(await res.json()).player;assert.equal(saved.version,1);
assert.equal((await fetch(base+'/api/players/'+id)).status,404);
assert.ok(!(await fetch(base+'/api/players').then(r=>r.json())).players.some(p=>p.id===id));
assert.ok((await fetch(base+'/api/admin/players',{headers:{cookie}}).then(r=>r.json())).players.some(p=>p.id===id));
assert.equal((await put({...data,matches:[{...data.matches[0],date:'2026-02-31'}]},1)).status,400);
assert.equal((await put({...data,matches:[{...data.matches[0],goals:-1}]},1)).status,400);
assert.equal((await put({...data,videos:[{...data.videos[0],url:'javascript:alert(1)'}]},1)).status,400);
assert.equal((await put({...data,videos:[{...data.videos[0],url:'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ'}]},1)).status,400);
assert.equal((await put({...data,matches:[data.matches[0],data.matches[0]]},1)).status,400);
res=await put({...data,consent:true,status:'published'},1);assert.equal(res.status,200);saved=(await res.json()).player;
const publicData=(await fetch(base+'/api/players/'+id).then(r=>r.json())).player;assert.equal(publicData.matches.length,2);assert.equal(publicData.videos.length,1);assert.ok(!('consent' in publicData));assert.ok(!('version' in publicData));assert.equal(publicData.name,data.name);
const page=await fetch(base+'/players/'+id);assert.equal(page.status,200);assert.ok((await page.text()).includes('Example Player'));
assert.equal((await put(data,1)).status,409);
res=await put({...data,consent:false,status:'draft'},saved.version);assert.equal(res.status,200);saved=(await res.json()).player;
assert.equal((await fetch(base+'/api/players/'+id)).status,404);assert.ok(!(await fetch(base+'/api/players').then(r=>r.json())).players.some(p=>p.id===id));
if(process.argv.includes('--keep')){res=await put({...data,consent:true,status:'published',videos:[]},saved.version);assert.equal(res.status,200);saved=(await res.json()).player;writeFileSync('.sites-runtime/qa-player.json',JSON.stringify({id,version:saved.version}));}
console.log(JSON.stringify({result:'PASS',id,checks:'Draft isolation, editor authorisation, origin checks, guardian permission gate, date/number/video validation, duplicate record rejection, create/update, public read-back, profile route, version conflict, unpublish removes public access.'}));

if(!process.argv.includes('--keep')){const db=await connect();try{await db.execute('DELETE FROM players WHERE id = ?',[id]);}finally{await db.end();}console.log('Temporary player removed from isolated test database.');}
