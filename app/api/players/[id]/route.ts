import {z} from 'zod';
import {database,canEdit,sameOrigin} from '../../../storage';
import {findPublicPlayer} from '../../../player-storage';
import {playerSchema,playerIssueMessage} from '../../../player-model';
import {getPool} from '../../../../db/mysql';
import {detachPlayer} from '../../../player-deletion';
import type {RowDataPacket} from 'mysql2/promise';
export const dynamic='force-dynamic';
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(!sameOrigin(request)||!await canEdit())return Response.json({error:'Editor access required.'},{status:403});
  const {id}=await params;
  if(!z.string().uuid().safeParse(id).success)return Response.json({error:'Invalid player ID.'},{status:400});
  const version=Number(request.headers.get('If-Match'));
  if(!Number.isSafeInteger(version)||version<1)return Response.json({error:'A saved profile version is required.'},{status:400});
  const connection=await getPool().getConnection();
  try{
   await connection.beginTransaction();
   const [contentRows]=await connection.execute<RowDataPacket[]>('SELECT body FROM site_content WHERE id = 1 FOR UPDATE');
   const [players]=await connection.execute<RowDataPacket[]>('SELECT body,version FROM players WHERE id = ? FOR UPDATE',[id]);
   if(!players[0]||players[0].version!==version){await connection.rollback();return Response.json({error:'This profile changed or was already deleted. Reload the page before trying again.'},{status:409})}
   if(contentRows[0]){
    const content=JSON.parse(contentRows[0].body),updated=detachPlayer(content,id,JSON.parse(players[0].body));
    if(JSON.stringify(content)!==JSON.stringify(updated))await connection.execute('UPDATE site_content SET body = ?, version = version + 1, updated_at = ? WHERE id = 1',[JSON.stringify(updated),new Date().toISOString()]);
   }
   await connection.execute('DELETE FROM players WHERE id = ? AND version = ?',[id,version]);
   await connection.commit();
  }catch(e){await connection.rollback();throw e}finally{connection.release()}
  return Response.json({deleted:true});
 }catch(e){console.error(e);return Response.json({error:'Could not delete this player. Please try again.'},{status:503})}
}
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;if(!z.string().uuid().safeParse(id).success&&!/^sample-[1-5]$/.test(id))return Response.json({error:'Player not found.'},{status:404});const player=await findPublicPlayer(id);return player?Response.json({player},{headers:{'Cache-Control':'no-store'}}):Response.json({error:'Player not found.'},{status:404})}catch{return Response.json({error:'Profile temporarily unavailable.'},{status:503})}}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
 try{if(!sameOrigin(request)||!await canEdit())return Response.json({error:'Editor access required.'},{status:403});const {id}=await params;if(!z.string().uuid().safeParse(id).success)return Response.json({error:'Invalid player ID.'},{status:400});if(Number(request.headers.get('content-length')||0)>250000)return Response.json({error:'Profile is too large.'},{status:413});const raw=await request.text();if(raw.length>250000)return Response.json({error:'Profile is too large.'},{status:413});let body;try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request.'},{status:400})}const parsed=z.object({player:playerSchema,version:z.number().int().min(0)}).safeParse(body);if(!parsed.success)return Response.json({error:parsed.error.issues.map(playerIssueMessage).join('; ')},{status:400});const {player,version}=parsed.data;const now=new Date().toISOString();const result=version===0?await database().prepare('INSERT IGNORE INTO players (id,body,status,version,updated_at) VALUES (?,?,?,1,?)').bind(id,JSON.stringify(player),player.status,now).run():await database().prepare('UPDATE players SET body = ?, status = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?').bind(JSON.stringify(player),player.status,now,id,version).run();if(!result.meta.changes)return Response.json({error:'This profile has changed since you opened it. Copy your edits before reloading the page.'},{status:409});return Response.json({player:{...player,id,version:version+1,updatedAt:now}},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Could not save this player. Your edits are still here; please try again.'},{status:503})}
}
