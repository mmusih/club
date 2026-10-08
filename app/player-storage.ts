import {fixturePlayerMatches} from './match-record';
import {eligibilityIssue} from './player-eligibility';
import {database,readContent} from './storage';
import {samplePlayers} from './sample-players';
import {type Player,type PlayerData,publicPlayer} from './player-model';
type Row={id:string;body:string;version:number;updated_at:string};
function decode(row:Row):Player{return {...JSON.parse(row.body) as PlayerData,id:row.id,version:row.version,updatedAt:row.updated_at};}
export async function listPlayers(admin=false){const sql=admin?'SELECT id,body,version,updated_at FROM players ORDER BY updated_at DESC':'SELECT id,body,version,updated_at FROM players WHERE status = ? ORDER BY updated_at DESC';const q=database().prepare(sql);const rows=await (admin?q:q.bind('published')).all<Row>();const {content}=await readContent(true);return rows.results.map(decode).map(p=>({...p,fixtureMatches:fixturePlayerMatches(content.fixtures,p.id)}));}
export async function findPublicPlayer(id:string){if(id.startsWith('sample-')){const {content}=await readContent();return (content.demoPlayerIds||[]).includes(id)?samplePlayers.find(p=>p.id===id)??null:null;}const row=await database().prepare('SELECT id,body,version,updated_at FROM players WHERE id = ? AND status = ?').bind(id,'published').first<Row>();if(!row)return null;const p=decode(row);const {content}=await readContent(true);p.matches=[...p.matches,...fixturePlayerMatches(content.fixtures,p.id)];return p.consent&&!eligibilityIssue(p)?publicPlayer(p):null;}
export async function publicPlayers(){const {content}=await readContent();return [...(await listPlayers()).filter(p=>p.consent&&!eligibilityIssue(p)).map(p=>publicPlayer({...p,matches:[...p.matches,...(p.fixtureMatches||[])]})),...samplePlayers.filter(p=>(content.demoPlayerIds||[]).includes(p.id))];}
