import type {Content,Fixture,MatchRecord} from './content';

export function matchLimits(m:MatchRecord){return {half:Math.floor(m.duration/2),halfEnd:Math.floor(m.duration/2)+(m.firstHalfAdded||0),end:m.duration+(m.firstHalfAdded||0)+(m.secondHalfAdded||0)};}
export function matchPeriod(m:MatchRecord){return m.period||(m.minute<=matchLimits(m).halfEnd?'first':'second');}
/** Stored minutes are playing time, including added time but never the half-time break. */
export function formatMatchMinute(m:MatchRecord,minute=m.minute,period: 'first'|'interval'|'second'=matchPeriod(m)){
 const {half}=matchLimits(m),first=period!=='second',base=first?half:m.duration;
 const clock=minute-(first?0:m.firstHalfAdded||0);
 return (clock>base?`${base}+${clock-base}`:String(clock))+'′';
}
export function matchClockIssue(m:MatchRecord){
 const limits=matchLimits(m);
 if(m.minute>limits.end)return 'The clock cannot exceed normal time plus added time.';
 if(m.period==='first'&&m.minute>limits.halfEnd)return 'Update first-half added time before advancing beyond half-time.';
 if(m.period==='interval'&&m.minute!==limits.halfEnd)return 'Half-time must match the end of the first half, including added time.';
 if(m.period==='second'&&m.minute<limits.halfEnd)return 'The second half cannot start before the first half ends.';
 for(const e of m.events){
  if(e.period==='first'&&e.minute>limits.halfEnd||e.period==='second'&&e.minute<limits.halfEnd)return 'An event is outside its recorded half.';
  if(m.period==='first'&&e.period==='second')return 'Second-half events cannot be recorded in the first half.';
 }
 return null;
}

/** The academy publishes kickoff times in Africa/Gaborone (UTC+2, no DST). */
export function lineupAvailable(f:Fixture,now=Date.now()) {
  if(!f.time || f.status==='cancelled' || f.status==='postponed') return false;
  const kickoff=Date.parse(`${f.date}T${f.time}:00+02:00`);
  return Number.isFinite(kickoff) && now>=kickoff-60*60*1000;
}
export function publicContent(content:Content,now=Date.now()):Content {
  return {...content,fixtures:(content.fixtures||[]).map(f=>{
    const {match: privateMatch,...safe}=f;
    if(privateMatch?.phase==='live'&&(f.status==='scheduled'||f.status==='live')){safe.liveMinute=privateMatch.minute;safe.liveClock=matchPeriod(privateMatch)==='interval'?'Half-time':formatMatchMinute(privateMatch);}
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
