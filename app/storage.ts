import {publicContent} from './lineup';
import { seed, type Content } from './content';
import { getAdminUser } from './auth';
import {replayMatch} from './match-record';
import {eligibilityIssue} from './player-eligibility';
import type {Player} from './player-model';
import { database } from '../db/mysql';
export { database };
export async function readContent(includeLineups=false) {
  const row = await database().prepare('SELECT body, version FROM site_content WHERE id = 1').first<{body: string; version: number}>();
  const data = row ? { content: { ...seed, ...JSON.parse(row.body) } as Content, version: row.version } : { content: seed, version: 0 };
  if(includeLineups)return data;
  if(data.content.fixtures.some(f=>f.match)){
    const rows=await database().prepare('SELECT id,body FROM players WHERE status = ?').bind('published').all<{id:string;body:string}>();
    const players=rows.results.map(r=>({...JSON.parse(r.body),id:r.id} as Player)).filter(p=>p.consent&&!eligibilityIssue(p));
    const label=(id:string)=>{const p=players.find(p=>p.id===id);return p?`${p.number||''} ${p.name}`.trim():'Player'};
    data.content={...data.content,fixtures:data.content.fixtures.map(f=>{
      if(!f.match||!f.lineup)return f;
      const slots=f.match.phase==='pre'?f.match.slots:replayMatch(f.match).slots;
      return {...f,lineup:{formation:f.lineup.formation,starters:slots.map(id=>id?label(id):'Vacant position'),substitutes:f.match.bench.filter(id=>!slots.includes(id)).map(label),portraits:Object.fromEntries(players.filter(p=>p.photo&&[...f.match!.slots,...f.match!.bench].includes(p.id)).map(p=>[label(p.id),p.photo]))}};
    })};
  }
  return {...data,content:publicContent(data.content)};
}
export async function canEdit() { return !!await getAdminUser(); }
export function sameOrigin(request: Request) {
  const expected = process.env.APP_URL || (process.env.NODE_ENV !== 'production' ? new URL(request.url).origin : '');
  return !!expected && request.headers.get('origin') === new URL(expected).origin;
}
