import assert from 'node:assert/strict';
import { connect } from '../scripts/mysql-connection.mjs';
const base=process.env.APP_URL;
if(!base || !['localhost','127.0.0.1'].includes(new URL(base).hostname) || !process.env.DB_NAME?.startsWith('club_hostinger_test_')) throw new Error('Use the isolated local test database.');
const db=await connect();
let mediaId;
try {
  await db.execute('DELETE FROM login_attempts WHERE id = ?', ['admin']);
  const login=(password=process.env.TEST_ADMIN_PASSWORD, extra={})=>fetch(base+'/api/auth/login',{
    method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({email:process.env.ADMIN_EMAIL,password,return_to:'https://evil.example',...extra}),redirect:'manual',
  });
  assert.equal((await fetch(base+'/admin',{redirect:'manual'})).status,307);
  const spoof=await fetch(base+'/api/admin/players',{headers:{'oai-authenticated-user-id':'local_seedy','oai-authenticated-user-email':process.env.ADMIN_EMAIL}});
  assert.equal(spoof.status,403);
  assert.ok((await login('wrong-password')).headers.get('location').includes('error=invalid'));
  const response=await login();
  assert.equal(response.status,303);
  assert.equal(response.headers.get('location'),base+'/admin');
  const setCookie=response.headers.getSetCookie().find(c=>c.startsWith('club_session='));
  assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/SameSite=lax/i);
  const cookie=setCookie.split(';')[0];
  assert.equal((await fetch(base+'/api/admin/players',{headers:{cookie}})).status,200);
  assert.equal((await fetch(base+'/api/admin/players',{headers:{cookie:'club_session='+'0'.repeat(64)}})).status,403);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aLRkAAAAASUVORK5CYII=','base64');
  const bytes=Buffer.concat([png,Buffer.alloc(2*1024*1024)]);
  const data=new FormData();data.append('file',new File([bytes],'large.png',{type:'image/png'}));
  const uploaded=await fetch(base+'/api/upload',{method:'POST',headers:{cookie,origin:base},body:data});
  assert.equal(uploaded.status,200,await uploaded.clone().text());
  const {url}=await uploaded.json();mediaId=url.split('/').pop();
  const image=await fetch(base+url);assert.equal(image.status,200);assert.deepEqual(Buffer.from(await image.arrayBuffer()),bytes);
  const logout=await fetch(base+'/api/auth/logout',{method:'POST',headers:{cookie,origin:base},redirect:'manual'});
  assert.equal(logout.status,303);
  assert.equal((await fetch(base+'/api/admin/players',{headers:{cookie}})).status,403);
  for(let i=0;i<10;i++)await login('wrong-password');
  assert.ok((await login()).headers.get('location').includes('error=limit'));
  await db.execute('UPDATE login_attempts SET reset_at = ? WHERE id = ?', ['2000-01-01T00:00:00.000Z','admin']);
  assert.equal((await login()).headers.get('location'),base+'/admin');
  console.log('PASS: login, protected routes, forged identity rejection, cookie flags, safe redirects, large photo round-trip, logout revocation, persistent login throttling and window reset.');
} finally {
  if(mediaId)await db.execute('DELETE FROM media WHERE id = ?',[mediaId]);
  await db.execute('DELETE FROM login_attempts WHERE id = ?', ['admin']);
  await db.end();
}
