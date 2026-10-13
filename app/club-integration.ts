import type {Content,Standing} from './content';
import {academyName,brandingName,teamKey} from './team-branding';
import {seasonForDate,seasonLabel} from './seasons';

/** Add missing clubs only: the editor remains responsible for official results. */
export function integrateClubContent(content:Content):Content {
 const c={...content,name:academyName};
 const standings=[...c.standings];
 const identity=(season:string,competition:string,group:string,club:string)=>JSON.stringify([seasonLabel(season),competition.trim().toLowerCase(),group.trim().toLowerCase(),teamKey(brandingName(c,club))]);
 const existing=new Set(standings.map(r=>identity(r.season,r.competition,r.group,r.club)));
 function add(season:string,competition:string,group:string,club:string){
  const key=identity(season,competition,group,club);
  if(!competition||!group||existing.has(key))return;
  existing.add(key);
  const row:Standing={id:'fixture-table-'+encodeURIComponent(key),season:seasonLabel(season),competition,group,club:brandingName(c,club),position:1,played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,points:0};
  // Compact deterministic IDs keep repeated reads/imports stable.
  let hash=2166136261;for(const char of key){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}
  row.id='fixture-table-'+(hash>>>0).toString(36);
  row.position=1+standings.filter(r=>seasonLabel(r.season)===row.season&&r.competition===competition&&r.group===group).length;
  standings.push(row);
 }
 for(const schedule of c.leagueSchedules||[]){
  const linked=c.fixtures.filter(f=>(f.competitionId===schedule.competitionId||f.competition===schedule.competition)&&seasonLabel(f.season||seasonForDate(f.date))===seasonLabel(schedule.season));
  const groups=[...new Set(linked.map(f=>f.team))];
  if(!groups.length)groups.push(c.programmes.find(p=>/senior/i.test(p.name))?.name||academyName);
  for(const group of groups)for(const f of schedule.fixtures){add(schedule.season,schedule.competition,group,f.home);add(schedule.season,schedule.competition,group,f.away)}
 }
 for(const f of c.fixtures){
  const kind=c.competitions?.find(x=>x.id===f.competitionId||x.name===f.competition)?.kind;
  if(kind&&kind!=='league')continue;
  const season=f.season||seasonForDate(f.date);
  add(season,f.competition,f.team,academyName);add(season,f.competition,f.team,f.opponent);
 }
 return {...c,standings};
}
