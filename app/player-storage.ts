import {eligibilityIssue} from './player-eligibility';
import {database} from './storage';
import {type Player,type PlayerData,publicPlayer} from './player-model';
type Row={id:string;body:string;version:number;updated_at:string};
function decode(row:Row):Player{return {...JSON.parse(row.body) as PlayerData,id:row.id,version:row.version,updatedAt:row.updated_at};}
export async function listPlayers(admin=false){const sql=admin?'SELECT id,body,version,updated_at FROM players ORDER BY updated_at DESC':'SELECT id,body,version,updated_at FROM players WHERE status = ? ORDER BY updated_at DESC';const q=database().prepare(sql);const rows=await (admin?q:q.bind('published')).all<Row>();return rows.results.map(decode);}
export async function findPublicPlayer(id:string){const row=await database().prepare('SELECT id,body,version,updated_at FROM players WHERE id = ? AND status = ?').bind(id,'published').first<Row>();if(!row)return null;const p=decode(row);return p.consent&&!eligibilityIssue(p)?publicPlayer(p):null;}
export async function publicPlayers(){return (await listPlayers()).filter(p=>p.consent&&!eligibilityIssue(p)).map(publicPlayer);}
