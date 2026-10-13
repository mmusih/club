import type {Fixture,MatchRecord,MatchEvent} from './content';
import {matchClockIssue,matchLimits,matchPeriod} from './lineup';
import {seasonForDate} from './seasons';

/** Score corrections stay authoritative until the editor explicitly reconnects goal events. */
export function matchFixturePatch(fixture:Fixture,next:MatchRecord):Partial<Fixture>{
 const patch:Partial<Fixture>={match:next};
 if(next.phase!==fixture.match?.phase&&next.phase!=='pre')patch.status=next.phase==='finished'?'played':'live';
 if(next.phase!=='pre'){
  if(fixture.scoreMode!=='manual')patch.goalsFor=next.events.filter(e=>e.kind==='goal').length;
  if(fixture.goalsAgainst===null&&next.phase!==fixture.match?.phase)patch.goalsAgainst=0;
 }
 return patch;
}

export function formationSlots(formation:string) {
 const lines=[1,...formation.split('-').map(Number)];
 return lines.flatMap((count,row)=>Array.from({length:count},(_,column)=>({role:row===0?'Goalkeeper':row===1?'Defender':row===lines.length-1?'Forward':'Midfielder',x:(column+1)*100/(count+1),y:90-row*78/(lines.length-1)})));
}
export function replayMatch(match:MatchRecord,until=match.minute) {
 const slots=[...match.slots],active=new Map<string,number>(),minutes:Record<string,number>={},yellow:Record<string,number>={},dismissed=new Set<string>(),appeared=new Set<string>();
 const errors:string[]=[];
 slots.filter(Boolean).forEach(id=>{active.set(id,0);appeared.add(id)});
 const leave=(id:string,minute:number)=>{if(active.has(id)){minutes[id]=(minutes[id]||0)+minute-active.get(id)!;active.delete(id)}};
 for(const event of [...match.events].sort((a,b)=>a.minute-b.minute)) {
  if(event.minute>until)continue;
  if(!active.has(event.playerId)){errors.push('Match events must belong to a player on the pitch at that minute.');continue}
  if(event.kind==='position') {
   const target=event.slotIndex;
   if(target===undefined||target<0||target>=slots.length){errors.push('Choose a valid field position.');continue}
   const from=slots.indexOf(event.playerId);[slots[from],slots[target]]=[slots[target],slots[from]];
  } else if(event.kind==='substitution') {
   const incoming=event.replacementId;
   if(!incoming||incoming===event.playerId||active.has(incoming)||dismissed.has(incoming)||!match.bench.includes(incoming)&&!match.slots.includes(incoming)){errors.push('Choose an available squad player for the substitution.');continue}
   leave(event.playerId,event.minute);slots[slots.indexOf(event.playerId)]=incoming;active.set(incoming,event.minute);appeared.add(incoming);
  } else {
   if(event.kind==='yellow')yellow[event.playerId]=(yellow[event.playerId]||0)+1;
   if(event.kind==='red'||yellow[event.playerId]===2){leave(event.playerId,event.minute);dismissed.add(event.playerId);slots[slots.indexOf(event.playerId)]=''}
  }
 }
 for(const [id,start] of active)minutes[id]=(minutes[id]||0)+Math.max(0,until-start);
 return {slots,minutes,appeared,dismissed,errors};
}
export function fixturePlayerMatches(fixtures:Fixture[],playerId:string) {
 return fixtures.flatMap(f=>{
  const m=f.match;if(!m||m.phase==='pre'||f.status==='cancelled'||f.status==='postponed')return [];
  const state=replayMatch(m);if(!state.appeared.has(playerId))return [];
  const events=m.events.filter(e=>e.playerId===playerId&&e.minute<=m.minute);
  const count=(kind:string)=>events.filter(e=>e.kind===kind).length;
  return [{id:f.id,date:f.date,season:f.season||seasonForDate(f.date),opponent:f.opponent,minutes:state.minutes[playerId]||0,goals:count('goal'),assists:count('assist'),saves:0,yellowCards:count('yellow'),redCards:count('red')+(count('yellow')>=2?1:0),injuries:count('injury')}];
 });
}

/** Player actions can start tracking and advance the clock directly from the pitch. */
export function recordPlayerEvent(match:MatchRecord,event:MatchEvent):MatchRecord {
 if(!match.slots.length||match.slots.some(id=>!id))throw Error('Fill every starting position before recording match events.');
 if(!Number.isInteger(event.minute)||event.minute<0||event.minute>matchLimits(match).end)throw Error('Enter a valid event minute within the match length and added time.');
 if(match.phase==='finished'&&event.minute>match.minute)throw Error('The event cannot be after the final whistle.');
 const minute=Math.max(match.minute,event.minute),halfEnd=matchLimits(match).halfEnd;
 const period=minute>halfEnd?'second':match.phase==='pre'?'first':matchPeriod(match);
 const eventPeriod=event.minute>halfEnd||event.minute===halfEnd&&period!=='first'?'second':'first';
 const next:MatchRecord={...match,phase:match.phase==='pre'?'live':match.phase,minute,period,events:[...match.events,{...event,period:eventPeriod}]};
 const issue=matchClockIssue(next)||replayMatch(next).errors[0];if(issue)throw Error(issue);
 return next;
}
