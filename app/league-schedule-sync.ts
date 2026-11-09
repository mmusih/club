import type {Content,Fixture,LeagueFixture,LeagueSchedule} from './content';
import {academyName,isAcademy,teamKey} from './team-branding';
import {seasonForDate,seasonLabel} from './seasons';

/** Academy fixtures own their linked schedule rows; other clubs retain imported rows. */
export function syncLeagueSchedules(c:Content):Content {
 const schedules:LeagueSchedule[]=(c.leagueSchedules||[]).map(s=>({...s,fixtures:s.fixtures.map(f=>({...f}))}));
 const inSchedule=(f:Fixture,s:LeagueSchedule)=>(f.competitionId?f.competitionId===s.competitionId:teamKey(f.competition)===teamKey(s.competition))&&seasonLabel(f.season||seasonForDate(f.date))===seasonLabel(s.season);
 // Migrate older PDFs to stable links once. Only adopt an unambiguous match.
 const linked=new Set(schedules.flatMap(s=>s.fixtures.flatMap(r=>r.fixtureId?[r.fixtureId]:[])));
 for(const s of schedules)for(const row of s.fixtures){
  if(row.fixtureId)continue;
  const home=isAcademy(c,row.home),away=isAcademy(c,row.away);
  if(!home&&!away)continue;
  const candidates=c.fixtures.filter(f=>!linked.has(f.id)&&inSchedule(f,s)&&teamKey(f.opponent)===teamKey(home?row.away:row.home)&&(f.homeAway==='away')===away);
  const exact=candidates.filter(f=>f.date===row.date);
  const matches=exact.length?exact:candidates.filter(f=>f.round&&f.round===row.round);
  if(matches.length===1){row.fixtureId=matches[0].id;linked.add(matches[0].id)}
 }
 const previousRows=new Map(schedules.flatMap(s=>s.fixtures.flatMap(r=>r.fixtureId?[[r.fixtureId,r] as const]:[])));
 for(const s of schedules)s.fixtures=s.fixtures.filter(r=>!r.fixtureId);
 for(const f of c.fixtures){
  const competition=c.competitions?.find(v=>f.competitionId?v.id===f.competitionId:teamKey(v.name)===teamKey(f.competition));
  if(competition&&competition.kind!=='league')continue;
  if(!f.date||!f.team.trim()||!f.opponent.trim()||!f.competition.trim())continue;
  let schedule=schedules.find(s=>inSchedule(f,s));
  if(!schedule){
   if(!competition)continue;
   schedule={competitionId:competition.id,competition:competition.name,season:seasonLabel(f.season||seasonForDate(f.date)),fixtures:[]};
   schedules.push(schedule);
  }
  const previous=previousRows.get(f.id);
  const number=previous&&!schedule.fixtures.some(r=>r.number===previous.number)?previous.number:Math.max(0,...schedule.fixtures.map(r=>r.number))+1;
  const row:LeagueFixture={fixtureId:f.id,number,date:f.date,home:f.homeAway==='away'?f.opponent:academyName,away:f.homeAway==='away'?academyName:f.opponent,venue:f.venue,round:f.round||'',time:f.time,status:f.status};
  schedule.fixtures.push(row);
 }
 return {...c,...(c.leagueSchedules||schedules.length?{leagueSchedules:schedules.map(s=>({...s,fixtures:s.fixtures.sort((a,b)=>a.number-b.number)}))}:{})};
}
