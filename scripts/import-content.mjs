import fs from 'node:fs';
import { connect } from './mysql-connection.mjs';
const input=process.argv[2];
if(!input) throw new Error('Pass the content-migration.json path.');
const bundle=JSON.parse(fs.readFileSync(input,'utf8'));
const db=await connect();
try {
  await db.beginTransaction();
  for(const row of bundle.site_content) await db.execute('INSERT INTO site_content (id,body,version,updated_at) VALUES (?,?,?,?)',[row.id,row.body,row.version,row.updated_at]);
  for(const row of bundle.players) await db.execute('INSERT INTO players (id,body,status,version,updated_at) VALUES (?,?,?,?,?)',[row.id,row.body,row.status,row.version,row.updated_at]);
  for(const row of bundle.media) {
    const bytes=Buffer.from(row.body,'base64');const size=256*1024;
    await db.execute('INSERT INTO media (id,body,content_type) VALUES (?,?,?)',[row.id,bytes.subarray(0,size),row.content_type]);
    for(let offset=size,sequence=1;offset<bytes.length;offset+=size,sequence++)await db.execute('INSERT INTO media_chunks (media_id,sequence,body) VALUES (?,?,?)',[row.id,sequence,bytes.subarray(offset,offset+size)]);
  }
  await db.commit();console.log('Content, player records and images imported. Existing records are never overwritten.');
} catch(e) {await db.rollback();throw e;} finally {await db.end();}
