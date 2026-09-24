import assert from 'node:assert/strict';
const base=process.env.APP_URL||'http://localhost:5173';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname)||!process.env.DB_NAME?.startsWith('club_hostinger_test_'))throw new Error('Requires an isolated local test database.');
const initial=await fetch(base+'/api/content').then(r=>r.json());
assert.ok(initial.content);
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:process.env.ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD}),redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
assert.ok(cookie);
const headers={cookie,origin:base,'content-type':'application/json'};
let version=initial.version;
const fixture={id:'fixture-integration',date:'2026-10-03',time:'15:30',team:'Under 17',opponent:'Test opposition',competition:'Friendly',venue:'Test ground',homeAway:'home',status:'scheduled',goalsFor:null,goalsAgainst:null};
const story={id:'news-integration',title:'Match-day preview',date:'2026-09-24',body:'A test story for the news wall.',image:initial.content.hero,category:'Match days'};
const content={...initial.content,fixtures:[fixture],news:[story]};
async function save(value){return fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({version,content:value})})}
try {
 for(const patch of [{date:'2026-02-30'},{time:'25:00'},{status:'played'},{status:'played',goalsFor:-1,goalsAgainst:0},{opponent:''}])assert.equal((await save({...content,fixtures:[{...fixture,...patch}]})).status,400);
 const saved=await save(content);assert.equal(saved.status,200);version=(await saved.json()).version;
 const readback=await fetch(base+'/api/content').then(r=>r.json());assert.deepEqual(readback.content.fixtures,[fixture]);assert.deepEqual(readback.content.news,[story]);
 const page=await fetch(base).then(r=>r.text());assert.ok(page.includes('Test opposition'));assert.ok(page.includes('Match-day preview'));
 const played={...content,fixtures:[{...fixture,status:'played',goalsFor:0,goalsAgainst:2}]};
 const result=await save(played);assert.equal(result.status,200);version=(await result.json()).version;
 const scores=await fetch(base+'/api/content').then(r=>r.json());assert.equal(scores.content.fixtures[0].goalsFor,0);
 const legacy={...initial.content};delete legacy.fixtures;
 const migrated=await save(legacy);assert.equal(migrated.status,200);version=(await migrated.json()).version;
 const normalized=await fetch(base+'/api/content').then(r=>r.json());assert.deepEqual(normalized.content.fixtures,[]);
 console.log('PASS: fixture and news persistence, server rendering, score zero, invalid dates/times/scores, required fields, and legacy content compatibility.');
} finally {
 const restored=await save(initial.content);assert.equal(restored.status,200,'Restore original test content');
}
