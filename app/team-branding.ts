import type {Content} from './content';
export const academyName='Eyes On The Ball Academy';
export type TeamBranding={logos:Record<string,string>;names?:Record<string,string>};
export const teamKey=(name:string)=>name.trim().toLowerCase().replace(/\b(?:f\.?\s*c\.?|football club)\s*$/i,'').replace(/[^a-z0-9]/g,'').replace(/^eyesontheball(?:academy)?$/,'eyesontheballacademy');
export function isAcademy(c:Content,name:string){const key=teamKey(name).replace(/^u(\d+)$/,'under$1');return [c.name,academyName,'Eyes On The Ball Academy',...c.programmes.flatMap(p=>[p.name,p.ages]),...c.fixtures.map(f=>f.team)].some(n=>teamKey(n)===key);}
export function brandingName(c:Content,name:string){return isAcademy(c,name)?academyName:name.trim();}
export function teamNames(c:Content){const names=[academyName,...c.fixtures.map(f=>f.opponent),...c.standings.map(r=>r.club),...(c.leagueSchedules||[]).flatMap(s=>s.fixtures.flatMap(f=>[f.home,f.away])),...(c.teamLogos||[]).map(t=>t.name)];return [...new Map(names.filter(n=>n.trim()).map(n=>[teamKey(brandingName(c,n)),brandingName(c,n)])).values()].sort((a,b)=>a.localeCompare(b));}
/** All academy divisions share one badge, regardless of legacy fixture uploads. */
export function teamBranding(c:Content):TeamBranding{
 const logos:Record<string,string>={},names:Record<string,string>={};
 const put=(name:string,logo?:string)=>{if(name&&logo)logos[teamKey(name)]=logo};
 for(const f of c.fixtures)put(f.opponent,f.opponentLogo);
 for(const row of c.standings)put(row.club,row.logo);
 for(const team of c.teamLogos||[])if(!isAcademy(c,team.name))put(team.name,team.logo);
 const clubLogo=c.logo||c.teamLogos?.find(t=>teamKey(t.name)===teamKey(c.name))?.logo||'';
 const aliases=[c.name,academyName,'Eyes On The Ball Academy',...c.programmes.flatMap(p=>[p.name,p.ages,p.ages.replace(/^under\s+/i,'U')]),...c.fixtures.map(f=>f.team)];
 for(const alias of aliases){logos[teamKey(alias)]=clubLogo;names[teamKey(alias)]=academyName;}
 return {logos,names};
}

/** Clear shared and legacy copies so deleting a badge cannot reveal an older one. */
export function deleteTeamLogo(c:Content,name:string):Content {
 const matches=(other:string)=>teamKey(brandingName(c,other))===teamKey(brandingName(c,name));
 return {...c,...(isAcademy(c,name)?{logo:''}:{}),teamLogos:(c.teamLogos||[]).filter(t=>!matches(t.name)),fixtures:c.fixtures.map(f=>({...f,...(matches(f.team)?{teamLogo:''}:{}),...(matches(f.opponent)?{opponentLogo:''}:{})})),standings:c.standings.map(r=>matches(r.club)?{...r,logo:''}:r)};
}
