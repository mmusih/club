import {z} from 'zod';
import {connectPlayerRecords,detachPlayerConnections,PlayerConnectionError} from '../../../player-connections';
import type {Player} from '../../../player-model';
import {canEdit,sameOrigin} from '../../../storage';
import {findPublicPlayer} from '../../../player-storage';
import {playerSchema,playerIssueMessage} from '../../../player-model';
import {getPool} from '../../../../db/mysql';
import {detachPlayer} from '../../../player-deletion';
import type {RowDataPacket} from 'mysql2/promise';
export const dynamic='force-dynamic';
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(!sameOrigin(request))return Response.json({error:'This website address is not authorised.'},{status:403});
  if(!await canEdit())return Response.json({error:'Your session has expired. Sign in again in another tab, then retry. Your edits are still here.'},{status:401});
  const {id}=await params;
  if(!z.string().uuid().safeParse(id).success)return Response.json({error:'Invalid player ID.'},{status:400});
  const version=Number(request.headers.get('If-Match'));
  if(!Number.isSafeInteger(version)||version<1)return Response.json({error:'A saved profile version is required.'},{status:400});
  const connection=await getPool().getConnection();
  const updatedPlayers:Player[]=[];
  try{
   await connection.beginTransaction();
   const [contentRows]=await connection.execute<RowDataPacket[]>('SELECT body FROM site_content WHERE id = 1 FOR UPDATE');
   const [playerRows]=await connection.execute<RowDataPacket[]>('SELECT id,body,version,updated_at FROM players ORDER BY id FOR UPDATE');
   const players=playerRows.filter(p=>p.id===id);
   if(!players[0]||players[0].version!==version){await connection.rollback();return Response.json({error:'This profile changed or was already deleted. Reload the page before trying again.'},{status:409})}
   if(contentRows[0]){
    const content=JSON.parse(contentRows[0].body),updated=detachPlayer(content,id,JSON.parse(players[0].body));
    if(JSON.stringify(content)!==JSON.stringify(updated))await connection.execute('UPDATE site_content SET body = ?, version = version + 1, updated_at = ? WHERE id = 1',[JSON.stringify(updated),new Date().toISOString()]);
   }
   const allPlayers=playerRows.map(row=>({...JSON.parse(row.body),id:row.id,version:row.version,updatedAt:row.updated_at}) as Player);
   for(const connected of detachPlayerConnections(allPlayers,id)){
    const data=playerSchema.parse(connected),now=new Date().toISOString();
    await connection.execute('UPDATE players SET body = ?, version = version + 1, updated_at = ? WHERE id = ?',[JSON.stringify(data),now,connected.id]);
    updatedPlayers.push({...data,id:connected.id,version:connected.version+1,updatedAt:now});
   }
   await connection.execute('DELETE FROM players WHERE id = ? AND version = ?',[id,version]);
   await connection.commit();
  }catch(e){await connection.rollback();throw e}finally{connection.release()}
  return Response.json({deleted:true,updatedPlayers});
 }catch(e){console.error(e);return Response.json({error:'Could not delete this player. Please try again.'},{status:503})}
}
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;if(!z.string().uuid().safeParse(id).success&&!/^sample-[1-5]$/.test(id))return Response.json({error:'Player not found.'},{status:404});const player=await findPublicPlayer(id);return player?Response.json({player},{headers:{'Cache-Control':'no-store'}}):Response.json({error:'Player not found.'},{status:404})}catch{return Response.json({error:'Profile temporarily unavailable.'},{status:503})}}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(!sameOrigin(request))return Response.json({error:'This website address is not authorised.'},{status:403});
  if(!await canEdit())return Response.json({error:'Your session has expired. Sign in again in another tab, then retry. Your edits are still here.'},{status:401});
  const {id}=await params;
  if(!z.string().uuid().safeParse(id).success)return Response.json({error:'Invalid player ID.'},{status:400});
  if(Number(request.headers.get('content-length')||0)>250000)return Response.json({error:'Profile is too large.'},{status:413});
  const raw=await request.text();if(raw.length>250000)return Response.json({error:'Profile is too large.'},{status:413});
  let body;try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request.'},{status:400})}
  const parsed=z.object({player:playerSchema,version:z.number().int().min(0)}).safeParse(body);
  if(!parsed.success)return Response.json({error:parsed.error.issues.map(playerIssueMessage).join('; ')},{status:400});
  const {player,version}=parsed.data,now=new Date().toISOString();
  const connection=await getPool().getConnection();
  try{
   await connection.beginTransaction();
   // Lock in a consistent order so linked edits cannot overwrite another editor's save.
   const [rows]=await connection.execute<RowDataPacket[]>('SELECT id,body,version,updated_at FROM players ORDER BY id FOR UPDATE');
   const players=rows.map(row=>({...JSON.parse(row.body),id:row.id,version:row.version,updatedAt:row.updated_at}) as Player);
   const previous=players.find(p=>p.id===id);
   if((previous?.version||0)!==version){await connection.rollback();return Response.json({error:'This profile or one of its linked records has changed since you opened it. Copy your edits before reloading the page.'},{status:409})}
   const changes=connectPlayerRecords(players,id,player),updated:Player[]=[];
   for(const [playerId,data] of changes){
    const valid=playerSchema.safeParse(data);
    if(!valid.success)throw new PlayerConnectionError(data.name+': '+valid.error.issues.map(playerIssueMessage).join('; '));
    const old=players.find(p=>p.id===playerId),nextVersion=(old?.version||0)+1;
    if(old)await connection.execute('UPDATE players SET body = ?, status = ?, version = version + 1, updated_at = ? WHERE id = ?',[JSON.stringify(valid.data),valid.data.status,now,playerId]);
    else await connection.execute('INSERT INTO players (id,body,status,version,updated_at) VALUES (?,?,?,1,?)',[playerId,JSON.stringify(valid.data),valid.data.status,now]);
    updated.push({...valid.data,id:playerId,version:nextVersion,updatedAt:now});
   }
   await connection.commit();
   return Response.json({player:updated.find(p=>p.id===id),updatedPlayers:updated,linkedProfilesUpdated:updated.length-1},{headers:{'Cache-Control':'no-store'}});
  }catch(e){await connection.rollback();throw e}finally{connection.release()}
 }catch(e){if(e instanceof PlayerConnectionError)return Response.json({error:e.message},{status:400});console.error(e);return Response.json({error:'Could not save the connected profiles. No changes were saved. Your edits are still here; please try again.'},{status:503})}
}
