import type {Content} from './content';
import {academyName,brandingName,isAcademy,teamKey} from './team-branding';
import {seasonForDate,seasonLabel} from './seasons';
import {sameLeagueTable,saveLeagueResult} from './league-results';
import {integrateClubContent} from './club-integration';

export type ScheduledResult = {key:string;date:string;round:string;competition:string;season:string;group:string;home:string;away:string;homeId:string;awayId:string;fixtureId?:string;resultId?:string;homeGoals:number|null;awayGoals:number|null};
export function scheduledResults(c:Content):ScheduledResult[]{
 const rows:ScheduledResult[]=[];
 for(const s of c.leagueSchedules||[]){
  if(c.competitions?.some(v=>v.id===s.competitionId&&v.kind!=='league'))continue;
  const table=c.standings.filter(r=>seasonLabel(r.season)===seasonLabel(s.season)&&teamKey(r.competition)===teamKey(s.competition));
  for(const f of s.fixtures){
   if(isAcademy(c,f.home)||isAcademy(c,f.away))continue;
   for(const home of table.filter(r=>teamKey(brandingName(c,r.club))===teamKey(f.home))){
    const away=table.find(r=>sameLeagueTable(home,r)&&teamKey(brandingName(c,r.club))===teamKey(f.away));
    if(!away)continue;
    const result=c.leagueResults?.find(r=>r.date===f.date&&[r.homeId,r.awayId].includes(home.id)&&[r.homeId,r.awayId].includes(away.id));
    const reversed=result?.homeId===away.id;
    rows.push({key:JSON.stringify([s.competitionId,s.season,f.number,home.group]),date:f.date,round:f.round,competition:s.competition,season:s.season,group:home.group,home:f.home,away:f.away,homeId:home.id,awayId:away.id,resultId:result?.id,homeGoals:result?(reversed?result.awayGoals:result.homeGoals):null,awayGoals:result?(reversed?result.homeGoals:result.awayGoals):null});
   }
  }
 }
 for(const f of c.fixtures){
  if(c.competitions?.some(v=>(f.competitionId?v.id===f.competitionId:v.name===f.competition)&&v.kind!=='league'))continue;
  const away=f.homeAway==='away';
  rows.push({key:f.id,fixtureId:f.id,date:f.date,round:f.round||'',competition:f.competition,season:f.season||seasonForDate(f.date),group:f.team,home:away?f.opponent:academyName,away:away?academyName:f.opponent,homeId:'',awayId:'',homeGoals:away?f.goalsAgainst:f.goalsFor,awayGoals:away?f.goalsFor:f.goalsAgainst});
 }
 return rows.sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
}
export function saveScheduledResult(c:Content,row:ScheduledResult,homeGoals:number,awayGoals:number):Content{
 if(![homeGoals,awayGoals].every(n=>Number.isInteger(n)&&n>=0&&n<=99))throw Error('Enter both final scores, from 0 to 99.');
 if(row.fixtureId)return integrateClubContent({...c,fixtures:c.fixtures.map(f=>f.id===row.fixtureId?{...f,status:'played',scoreMode:'manual',goalsFor:f.homeAway==='away'?awayGoals:homeGoals,goalsAgainst:f.homeAway==='away'?homeGoals:awayGoals,...(f.match?{match:{...f.match,phase:'finished' as const}}:{})}:f)});
 const id=row.resultId||crypto.randomUUID();
 return saveLeagueResult(c,id,{id,date:row.date,homeId:row.homeId,awayId:row.awayId,homeGoals,awayGoals});
}
