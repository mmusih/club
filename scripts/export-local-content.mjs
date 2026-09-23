import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
const root='.wrangler/state/v3';
const findDb = dir => fs.readdirSync(dir).filter(f=>f.endsWith('.sqlite')&&f!=='metadata.sqlite');
const d1dir=path.join(root,'d1/miniflare-D1DatabaseObject');
const names=findDb(d1dir);
if(names.length!==1) throw new Error('Expected exactly one local content database.');
const db=new DatabaseSync(path.join(d1dir,names[0]),{readOnly:true});
const bundle={site_content:db.prepare('SELECT id,body,version,updated_at FROM site_content').all(),players:db.prepare('SELECT id,body,status,version,updated_at FROM players').all(),media:[]};
db.close();
const r2dir=path.join(root,'r2/miniflare-R2BucketObject');
if(fs.existsSync(r2dir)) for(const name of findDb(r2dir)) {
  const r2=new DatabaseSync(path.join(r2dir,name),{readOnly:true});
  for(const row of r2.prepare('SELECT key,blob_id,http_metadata FROM _mf_objects').all()) {
    if(!row.blob_id) continue;
    const blob=path.join(root,'r2/site-creator-r2/blobs',row.blob_id);
    const bytes=fs.readFileSync(blob);
    bundle.media.push({id:row.key,content_type:JSON.parse(row.http_metadata).contentType||'application/octet-stream',body:bytes.toString('base64')});
  }
  r2.close();
}
fs.mkdirSync('outputs',{recursive:true});
fs.writeFileSync('outputs/content-migration.json',JSON.stringify(bundle));
console.log('Preserved '+bundle.site_content.length+' content record, '+bundle.players.length+' player records, and '+bundle.media.length+' uploaded images.');
