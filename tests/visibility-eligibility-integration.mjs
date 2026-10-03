import assert from 'node:assert/strict';
import {connect} from '../scripts/mysql-connection.mjs';
import {clubToday} from '../app/player-eligibility.ts';
const base=process.env.APP_URL||'http://localhost:5173';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname)||!process.env.DB_NAME?.startsWith('club_hostinger_test_'))throw new Error('Requires isolated test database.');
const initial=await fetch(base+'/api/content').then(r=>r.json());assert.ok(initial.content);
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:process.env.ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD}),redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert.ok(cookie);
const headers={cookie,origin:base,'content-type':'application/json'};
let version=initial.version;
const save=content=>fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({content,version})});
const id=crypto.randomUUID(),today=clubToday(),year=Number(today.slice(0,4));
const player={name:'Eligibility QA',ageGroup:'Under 13',dateOfBirth:`${year-11}${today.slice(4)}`,position:'Forward',foot:'Right',number:9,bio:'Temporary test',photo:'',status:'published',consent:true,videos:[],matches:[]};
const put=p=>fetch(base+'/api/players/'+id,{method:'PUT',headers,body:JSON.stringify({player:p,version:0})});
try {
 const ids=['hero','values','about','mantra','programmes','gallery','news','fixtures','squad','staff','standings','honours','join'];
 const hidden={...initial.content,sections:Object.fromEntries(ids.map(id=>[id,false]))};
 assert.equal((await save({...hidden,sections:{staff:'false'}})).status,400);
 let res=await save(hidden);assert.equal(res.status,200);version=(await res.json()).version;
 const stored=await fetch(base+'/api/content').then(r=>r.json());assert.deepEqual(stored.content.sections,hidden.sections);assert.deepEqual(stored.content.programmes,initial.content.programmes);
 let page=await fetch(base).then(r=>r.text());for(const id of ids){assert.ok(!page.includes(`id="${id}"`),id);assert.ok(!page.includes(`href="#${id}"`),id+' link');}
 const legacy={...initial.content};delete legacy.sections;
 res=await save(legacy);assert.equal(res.status,200);version=(await res.json()).version;
 page=await fetch(base).then(r=>r.text());assert.ok(page.includes('id="staff"'));assert.ok(page.includes('id="programmes"'));
 for(const patch of [{dateOfBirth:''},{dateOfBirth:`${year-12}${today.slice(4)}`},{dateOfBirth:`${year+1}-01-01`},{dateOfBirth:'2014-02-30'}])assert.equal((await put({...player,...patch})).status,400);
 res=await put(player);assert.equal(res.status,200,await res.clone().text());
 const publicData=(await fetch(base+'/api/players/'+id).then(r=>r.json())).player;assert.equal(publicData.name,player.name);assert.ok(!('dateOfBirth' in publicData));
 const directory=await fetch(base+'/api/players').then(r=>r.json());assert.ok(!JSON.stringify(directory).includes('dateOfBirth'));
 const profile=await fetch(base+'/players/'+id).then(r=>r.text());assert.ok(!profile.includes(player.dateOfBirth));
 const admin=await fetch(base+'/api/admin/players',{headers:{cookie}}).then(r=>r.json());assert.equal(admin.players.find(p=>p.id===id).dateOfBirth,player.dateOfBirth);
 // Simulate a legacy record or a birthday since its last save; public reads must re-check it.
 const db=await connect();try{await db.execute('UPDATE players SET body = ? WHERE id = ?',[JSON.stringify({...player,dateOfBirth:`${year-12}${today.slice(4)}`}),id]);}finally{await db.end();}
 assert.equal((await fetch(base+'/api/players/'+id)).status,404);assert.equal((await fetch(base+'/players/'+id)).status,404);
 assert.ok(!(await fetch(base+'/api/players').then(r=>r.json())).players.some(p=>p.id===id));
 console.log('PASS: visibility persists, content retained, sections and links hidden, legacy defaults, age enforcement, private birth dates, aged-out profiles excluded.');
} finally {
 assert.equal((await save(initial.content)).status,200);
 const db=await connect();try{await db.execute('DELETE FROM players WHERE id = ?',[id]);}finally{await db.end();}
}
