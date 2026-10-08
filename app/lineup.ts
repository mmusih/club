import type {Content,Fixture} from './content';

/** The academy publishes kickoff times in Africa/Gaborone (UTC+2, no DST). */
export function lineupAvailable(f:Fixture,now=Date.now()) {
  if(!f.time || f.status==='cancelled' || f.status==='postponed') return false;
  const kickoff=Date.parse(`${f.date}T${f.time}:00+02:00`);
  return Number.isFinite(kickoff) && now>=kickoff-60*60*1000;
}
export function publicContent(content:Content,now=Date.now()):Content {
  return {...content,fixtures:(content.fixtures||[]).map(f=>{
    const {match: privateMatch,...safe}=f;
    if(privateMatch?.phase==='live'&&f.status==='scheduled')safe.liveMinute=privateMatch.minute;
    if(lineupAvailable(f,now)) return safe;
    const {lineup: hidden,...visible}=safe;
    void hidden;
    return visible;
  })};
}
export function fixtureTeamName(content:Content,team:string) {
  const key=(value:string)=>value.toLowerCase().replace(/\bu[ -]?(\d+)/g,'under $1').replace(/[^a-z0-9]/g,'');
  const exact=content.programmes.find(p=>key(p.name)===key(team));
  if(exact)return exact.name;
  const matches=content.programmes.filter(p=>p.ages&&key(p.ages)===key(team));
  return matches.length===1?matches[0].name:team;
}
export function fixtureTeams(content:Content) {
  return [...new Set([...content.programmes.map(p=>p.name),...(content.fixtures||[]).map(f=>fixtureTeamName(content,f.team))])].filter(Boolean).sort();
}
