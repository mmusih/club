import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
const base=process.env.APP_URL||'http://localhost:5181';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname)&&process.env.DB_NAME?.startsWith('club_hostinger_test_'),'Use only the isolated local test database');
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:process.env.ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD}),redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
assert.ok(cookie);
const headers={cookie,origin:base,'content-type':'application/json'};
const read=()=>fetch(base+'/api/content',{headers:{cookie}}).then(r=>r.json());
const initial=await read();let version=initial.version;
async function save(content){const response=await fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({content,version})});assert.equal(response.status,200,await response.clone().text());version=(await response.json()).version;}
const backup=new URL('../outputs/fixture-preview-backup.json',import.meta.url);
if(process.argv.includes('--restore')){await save(JSON.parse(await readFile(backup,'utf8')));await unlink(backup);console.log('Restored isolated test content.');}else{
let keep=false;
try {
 const data=new FormData();data.append('file',new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aLRkAAAAASUVORK5CYII=','base64')],'badge.png',{type:'image/png'}));
 const uploaded=await fetch(base+'/api/upload',{method:'POST',headers:{cookie,origin:base},body:data});assert.equal(uploaded.status,200);const {url}=await uploaded.json();assert.equal((await fetch(base+url)).status,200);
 function kickoff(minutes){const local=new Date(Date.now()+minutes*60000+2*3600000).toISOString();return {date:local.slice(0,10),time:local.slice(11,16)}}
 const lineup={formation:'2-3-1',starters:['1 Keeper','2 Defender A','3 Defender B','4 Midfield A','5 Midfield B','6 Midfield C','9 Forward'],substitutes:['12 Substitute']};
 const fixture={id:'lineup-check',...kickoff(120),team:'Under 13',competition:'Preview friendly',opponent:'Preview United',venue:'Preview ground',homeAway:'home',status:'scheduled',goalsFor:null,goalsAgainst:null,teamLogo:url,opponentLogo:url,lineup};
 const content={...initial.content,fixtures:[fixture]};
 for(const patch of [{teamLogo:'javascript:alert(1)'},{lineup:{...lineup,formation:'invalid'}},{lineup:{...lineup,starters:['1 Keeper']}}]){const response=await fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({content:{...content,fixtures:[{...fixture,...patch}]},version})});assert.equal(response.status,400)}
 await save(content);
 let publicData=await fetch(base+'/api/content').then(r=>r.json());assert.equal(publicData.content.fixtures[0].lineup,undefined);assert.deepEqual((await read()).content.fixtures[0].lineup,lineup);
 let html=await fetch(base).then(r=>r.text());assert.ok(!html.includes('Midfield A'),'Unreleased lineup must not be in server-rendered page');
 fixture.date=kickoff(30).date;fixture.time=kickoff(30).time;
 await save(content);publicData=await fetch(base+'/api/content').then(r=>r.json());assert.deepEqual(publicData.content.fixtures[0].lineup,lineup);assert.equal(publicData.content.fixtures[0].opponentLogo,url);
 for(const status of ['postponed','cancelled']){await save({...content,fixtures:[{...fixture,status}]});publicData=await fetch(base+'/api/content').then(r=>r.json());assert.equal(publicData.content.fixtures[0].lineup,undefined)}
 // Keep a useful set of explicitly fictional fixtures briefly for visual QA.
 if(process.argv.includes('--preview')){await writeFile(backup,JSON.stringify(initial.content));await save({...content,fixtures:[{...fixture,teamLogo:initial.content.logo,opponentLogo:undefined},{...fixture,id:'away-check',team:'Under 17',homeAway:'away',opponent:'Preview Rovers',status:'played',goalsFor:2,goalsAgainst:3,teamLogo:initial.content.logo,opponentLogo:undefined}]});keep=true}
 console.log('PASS: logo upload, persistence, schema errors, unpublished lineup redaction in API and HTML, editor access, release window, cancelled/postponed matches.');
}finally{if(!keep)await save(initial.content)}

}
