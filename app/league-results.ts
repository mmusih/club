import type {Content,Standing,LeagueResult} from './content';
import {seasonLabel} from './seasons';

export function sameLeagueTable(a:Standing,b:Standing){return seasonLabel(a.season)===seasonLabel(b.season)&&a.competition.trim().toLowerCase()===b.competition.trim().toLowerCase()&&a.group.trim().toLowerCase()===b.group.trim().toLowerCase();}

/** Apply only the difference, preserving official totals and points deductions. */
export function saveLeagueResult(content:Content,id:string,result?:LeagueResult):Content {
 const previous=content.leagueResults?.find(r=>r.id===id);
 if(result){
  const home=content.standings.find(r=>r.id===result.homeId),away=content.standings.find(r=>r.id===result.awayId);
  if(result.id!==id||!home||!away||home.id===away.id||!sameLeagueTable(home,away))throw Error('Choose two different clubs in the same league table.');
  if(![result.homeGoals,result.awayGoals].every(n=>Number.isInteger(n)&&n>=0&&n<=99))throw Error('Enter both scores, from 0 to 99.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(result.date)||new Date(result.date+'T12:00:00Z').toISOString().slice(0,10)!==result.date)throw Error('Enter a valid match date.');
  if(content.leagueResults?.some(r=>r.id!==id&&r.date===result.date&&[r.homeId,r.awayId].includes(result.homeId)&&[r.homeId,r.awayId].includes(result.awayId)))throw Error('This match already has a result. Edit the existing result.');
 }
 const standings=content.standings.map(row=>{
  const next={...row};
  for(const [r,sign] of [[previous,-1],[result,1]] as const){
   if(!r||![r.homeId,r.awayId].includes(row.id))continue;
   const home=r.homeId===row.id,gf=home?r.homeGoals:r.awayGoals,ga=home?r.awayGoals:r.homeGoals;
   next.played+=sign;next.won+=sign*Number(gf>ga);next.drawn+=sign*Number(gf===ga);next.lost+=sign*Number(gf<ga);next.goalsFor+=sign*gf;next.goalsAgainst+=sign*ga;next.points+=sign*(gf>ga?3:gf===ga?1:0);
  }
  if([next.played,next.won,next.drawn,next.lost,next.goalsFor,next.goalsAgainst].some(n=>n<0))throw Error('Official totals were changed below this result. Correct the totals before editing or removing it.');
  return next;
 });
 return {...content,standings,leagueResults:[...(content.leagueResults||[]).filter(r=>r.id!==id),...(result?[result]:[])]};
}
