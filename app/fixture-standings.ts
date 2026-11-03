import type {Content,LeagueResult} from './content';
import {academyName,brandingName,teamKey} from './team-branding';
import {seasonForDate,seasonLabel} from './seasons';
import {saveLeagueResult} from './league-results';

/** Reconcile finished fixtures against their last applied result, never their full totals. */
export function syncFixtureStandings(content:Content):Content {
 let next=content;
 const desired:LeagueResult[]=[];
 for(const f of content.fixtures){
  const competition=content.competitions?.find(c=>f.competitionId?c.id===f.competitionId:c.name===f.competition);
  if(competition&&competition.kind!=='league'||f.status!=='played'||f.goalsFor===null||f.goalsAgainst===null||!f.date||!f.competition||!f.team||!f.opponent)continue;
  const rows=content.standings.filter(r=>seasonLabel(r.season)===seasonLabel(f.season||seasonForDate(f.date))&&r.competition.trim().toLowerCase()===f.competition.trim().toLowerCase()&&r.group.trim().toLowerCase()===f.team.trim().toLowerCase());
  const find=(name:string)=>rows.find(r=>teamKey(brandingName(content,r.club))===teamKey(brandingName(content,name)));
  const academy=find(academyName),opponent=find(f.opponent);
  if(!academy||!opponent||academy.id===opponent.id)continue;
  const away=f.homeAway==='away';
  desired.push({id:content.leagueResults?.find(r=>r.fixtureId===f.id)?.id||'fixture-'+f.id,fixtureId:f.id,date:f.date,homeId:away?opponent.id:academy.id,awayId:away?academy.id:opponent.id,homeGoals:away?f.goalsAgainst:f.goalsFor,awayGoals:away?f.goalsFor:f.goalsAgainst});
 }
 for(const old of content.leagueResults||[]){
  if(old.fixtureId&&!desired.some(r=>r.fixtureId===old.fixtureId))next=saveLeagueResult(next,old.id);
 }
 for(let result of desired){
  const previous=next.leagueResults?.find(r=>r.fixtureId===result.fixtureId);
  // Adopt a manually entered result for this match rather than count it twice.
  const manual=next.leagueResults?.find(r=>!r.fixtureId&&r.date===result.date&&[r.homeId,r.awayId].includes(result.homeId)&&[r.homeId,r.awayId].includes(result.awayId));
  if(manual&&!previous)result={...result,id:manual.id};
  if(previous&&previous.date===result.date&&previous.homeId===result.homeId&&previous.awayId===result.awayId&&previous.homeGoals===result.homeGoals&&previous.awayGoals===result.awayGoals)continue;
  next=saveLeagueResult(next,result.id,result);
 }
 return next;
}
