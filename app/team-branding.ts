import type {Content} from './content';
import {fixtureTeamName} from './lineup';

export type TeamBranding={logos:Record<string,string>};
export const teamKey=(name:string)=>name.trim().toLowerCase().replace(/\s+/g,' ');
export function teamNames(c:Content){return [...new Set([c.name,...c.programmes.map(p=>p.name),...c.fixtures.flatMap(f=>[fixtureTeamName(c,f.team),f.opponent]),...c.standings.map(r=>r.club),...c.staff.map(s=>s.team),...c.honours.map(h=>h.team),...(c.teamLogos||[]).map(t=>t.name)].filter(n=>n.trim()))].sort((a,b)=>a.localeCompare(b));}
/** A shared badge takes precedence over old fixture/table-specific uploads. */
export function teamBranding(c:Content):TeamBranding{
 const logos:Record<string,string>={};
 const put=(name:string,logo?:string)=>{if(name&&logo)logos[teamKey(name)]=logo};
 const clubLogo=c.teamLogos?.find(t=>teamKey(t.name)===teamKey(c.name)&&t.logo)?.logo||c.logo;
 put(c.name,clubLogo);for(const p of c.programmes)put(p.name,clubLogo);
 for(const f of c.fixtures){put(f.opponent,f.opponentLogo);put(fixtureTeamName(c,f.team),f.teamLogo)}
 for(const row of c.standings)put(row.club,row.logo);
 for(const team of c.teamLogos||[])put(fixtureTeamName(c,team.name),team.logo);
 for(const p of c.programmes){const canonical=fixtureTeamName(c,p.ages);if(canonical===p.name){put(p.ages,logos[teamKey(p.name)]);const number=p.ages.match(/^under\s+(\d+)$/i)?.[1];if(number){put('U'+number,logos[teamKey(p.name)]);put('U '+number,logos[teamKey(p.name)])}}}
 return {logos};
}
