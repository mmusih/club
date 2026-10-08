import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.APP_URL;
if(!base||!['localhost','127.0.0.1'].includes(new URL(base).hostname)||!process.env.DB_NAME?.startsWith('club_hostinger_test_'))throw Error('Requires isolated local test database.');
const original=await fetch(base+'/api/content').then(r=>r.json());
assert.ok(original.content);
const delivery=JSON.parse(JSON.parse(fs.readFileSync('outputs/delivery-content.json','utf8')).site_content[0].body);
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:process.env.ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD}),redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert.ok(cookie);
const headers={cookie,origin:base,'content-type':'application/json'};
const realBefore=await fetch(base+'/api/admin/players',{headers:{cookie}}).then(r=>r.json());
let version=original.version;
async function save(content){const res=await fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({version,content})});assert.equal(res.status,200,await res.clone().text());version=(await res.json()).version;}
try {
  await save(delivery);
  const read=await fetch(base+'/api/content').then(r=>r.json());
  assert.equal(read.content.email,'info@eyesontheball.co.bw');
  assert.deepEqual(read.content.additionalEmails,['shakes@eyesontheball.co.bw','gbranthoka@eyesontheball.co.bw']);
  assert.deepEqual(read.content.additionalPhones,['+267 73 888 909']);
  const home=await fetch(base).then(r=>r.text());
  for(const email of [delivery.email,...delivery.additionalEmails])assert.ok(home.includes('mailto:'+email));
  assert.ok(home.includes('tel:+26773888909'));
  const players=await fetch(base+'/api/players').then(r=>r.json());
  assert.equal(players.players.filter(p=>p.id.startsWith('sample-')).length,5);
  assert.ok(players.players.every(p=>!('consent' in p)&&!('dateOfBirth' in p)));
  assert.equal((await fetch(base+'/api/players/sample-1')).status,200);
  const profile=await fetch(base+'/players/sample-1').then(r=>r.text());assert.ok(profile.includes('fictional'));
  for(const patch of [{additionalEmails:['invalid']},{demoPlayerIds:['arbitrary-profile']},{additionalPhones:Array(6).fill('73888909')}]) {
    const invalid=await fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({version,content:{...delivery,...patch}})});assert.equal(invalid.status,400);
  }
  await save({...delivery,demoPlayerIds:delivery.demoPlayerIds.filter(id=>id!=='sample-1')});
  assert.equal((await fetch(base+'/api/players/sample-1')).status,404);
  assert.equal((await fetch(base+'/players/sample-1')).status,404);
  const cleaned={...delivery,demoPlayerIds:[]};
  for(const key of ['news','fixtures','staff','standings','honours'])cleaned[key]=delivery[key].filter(item=>!item.id.startsWith('demo-'));
  await save(cleaned);
  const after=await fetch(base+'/api/players').then(r=>r.json());assert.equal(after.players.filter(p=>p.id.startsWith('sample-')).length,0);
  assert.equal((await fetch(base+'/news/demo-news-1')).status,404);
  const realAfter=await fetch(base+'/api/admin/players',{headers:{cookie}}).then(r=>r.json());assert.deepEqual(realAfter,realBefore);
  const remaining=await fetch(base+'/api/content').then(r=>r.json());
  assert.deepEqual(remaining.content.photos,delivery.photos);assert.deepEqual(remaining.content.programmes,delivery.programmes);assert.equal(remaining.content.email,delivery.email);
  console.log('PASS: contact persistence and links; 5 labelled demo profiles; validation; individual removal and direct-page 404; bulk cleanup; real player records, contacts, programmes and gallery preserved.');
} finally {await save(process.argv.includes('--keep-demo')?delivery:original.content);}
