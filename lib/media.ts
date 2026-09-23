import { getPool } from '../db/mysql';
import type { RowDataPacket } from 'mysql2/promise';

export async function saveMedia(id: string, bytes: Buffer, contentType: string) {
  const db = await getPool().getConnection();
  const chunkSize = 256 * 1024;
  try {
    await db.beginTransaction();
    await db.execute('INSERT INTO media (id,body,content_type) VALUES (?,?,?)', [id, bytes.subarray(0, chunkSize), contentType]);
    for (let offset = chunkSize, sequence = 1; offset < bytes.length; offset += chunkSize, sequence++) {
      await db.execute('INSERT INTO media_chunks (media_id,sequence,body) VALUES (?,?,?)', [id, sequence, bytes.subarray(offset, offset + chunkSize)]);
    }
    await db.commit();
  } catch (error) { await db.rollback(); throw error; }
  finally { db.release(); }
}

export async function readMedia(id: string) {
  const [files] = await getPool().execute<RowDataPacket[]>('SELECT body,content_type FROM media WHERE id = ?', [id]);
  if (!files.length) return null;
  const [chunks] = await getPool().execute<RowDataPacket[]>('SELECT body FROM media_chunks WHERE media_id = ? ORDER BY sequence', [id]);
  return { body: Buffer.concat([files[0].body, ...chunks.map(row => row.body)]), contentType: files[0].content_type as string };
}
