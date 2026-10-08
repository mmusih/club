import fs from 'node:fs';
import {createHash} from 'node:crypto';
const bundle=JSON.parse(fs.readFileSync(process.argv[2]||'outputs/content-migration.json','utf8'));
const hex=value=>"X'"+Buffer.from(String(value),'utf8').toString('hex')+"'";
let sql='-- Import into a NEW, EMPTY Hostinger MySQL database. Contains private site data.\nSET NAMES utf8mb4;\n';
sql+='CREATE TABLE club_migrations (name VARCHAR(255) PRIMARY KEY, checksum VARCHAR(64) NOT NULL);\n';
for(const name of fs.readdirSync('drizzle/mysql').filter(n=>n.endsWith('.sql')).sort()) {
  const migration=fs.readFileSync('drizzle/mysql/'+name,'utf8');
  sql+=migration.replaceAll('--> statement-breakpoint','')+'\n';
  sql+='INSERT INTO club_migrations (name,checksum) VALUES ('+hex(name)+','+hex(createHash('sha256').update(migration).digest('hex'))+');\n';
}
sql+='START TRANSACTION;\n';
for(const row of bundle.site_content)sql+='INSERT INTO site_content (id,body,version,updated_at) VALUES ('+[row.id,hex(row.body),row.version,hex(row.updated_at)].join(',')+');\n';
for(const row of bundle.players)sql+='INSERT INTO players (id,body,status,version,updated_at) VALUES ('+[hex(row.id),hex(row.body),hex(row.status),row.version,hex(row.updated_at)].join(',')+');\n';
for(const row of bundle.media){
  const bytes=Buffer.from(row.body,'base64');const size=256*1024;
  sql+='INSERT INTO media (id,body,content_type) VALUES ('+[hex(row.id),"X'"+bytes.subarray(0,size).toString('hex')+"'",hex(row.content_type)].join(',')+');\n';
  for(let offset=size,sequence=1;offset<bytes.length;offset+=size,sequence++)sql+='INSERT INTO media_chunks (media_id,sequence,body) VALUES ('+[hex(row.id),sequence,"X'"+bytes.subarray(offset,offset+size).toString('hex')+"'"].join(',')+');\n';
}
sql+='COMMIT;\n';
fs.writeFileSync('outputs/hostinger-database.sql',sql);
console.log('Created outputs/hostinger-database.sql for a new empty database.');
