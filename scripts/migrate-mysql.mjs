import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { connect } from './mysql-connection.mjs';
const db = await connect();
try {
  const [locks] = await db.execute("SELECT GET_LOCK(CONCAT(DATABASE(), ':club_migrate'), 30) AS acquired");
  if (Number(locks[0].acquired) !== 1) throw new Error('Could not acquire migration lock.');
  await db.query('CREATE TABLE IF NOT EXISTS club_migrations (name VARCHAR(255) PRIMARY KEY, checksum VARCHAR(64) NOT NULL)');
  for (const name of (await readdir('drizzle/mysql')).filter(n=>n.endsWith('.sql')).sort()) {
    const sql = await readFile('drizzle/mysql/'+name,'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const [existing] = await db.execute('SELECT checksum FROM club_migrations WHERE name = ?',[name]);
    if (existing.length) { if(existing[0].checksum!==checksum) throw new Error('Applied migration changed: '+name); continue; }
    for (const part of sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean)) {
      try { await db.query(part); } catch(e) {
        // MySQL DDL commits individually; allow retry after a partially applied initial migration.
        if(name.startsWith('0000_') && ['ER_TABLE_EXISTS_ERROR','ER_DUP_KEYNAME'].includes(e.code)) continue;
        throw e;
      }
    }
    await db.execute('INSERT INTO club_migrations (name,checksum) VALUES (?,?)',[name,checksum]);
    console.log('Applied '+name);
  }
  console.log('MySQL schema is ready.');
} finally { await db.end(); }
