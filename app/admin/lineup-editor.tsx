'use client';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import TeamBadge from '../team-badge';
import {academyName,teamBranding} from '../team-branding';
import {useEffect,useRef,useState} from 'react';
import type {Content,Fixture,MatchRecord,MatchEvent} from '../content';
import {type Player,positions} from '../player-model';
import {recordPlayerEvent,formationSlots,replayMatch,fixturePlayerMatches,matchFixturePatch} from '../match-record';
import {fixtureTeamName,matchLimits,formatMatchMinute,matchClockIssue} from '../lineup';
import MatchClock from './match-clock';
import {eligibilityIssue} from '../player-eligibility';
import {isDeletedPlayer} from '../player-deletion';

const formations=['4-3-3','4-4-2','4-2-3-1','3-5-2','3-4-3','5-3-2','2-3-1','3-2-1','2-2'];
export default function LineupEditor({fixture:f,content,onChange}:{fixture:Fixture;content:Content;onChange:(patch:Partial<Fixture>)=>void}) {
 const pitchRef=useRef<HTMLDivElement>(null);
 const [reloadPlayers,setReloadPlayers]=useState(0);
 const [players,setPlayers]=useState<Player[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[selected,setSelected]=useState<number|null>(null),[chosen,setChosen]=useState(''),[search,setSearch]=useState(''),[minute,setMinute]=useState(0),[showAll,setShowAll]=useState(false);
 useEffect(()=>{let alive=true;fetch('/api/admin/players').then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(alive)setPlayers(d.players)}).catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[reloadPlayers]);
 const formation=f.lineup?.formation||'4-3-3',positionsOnPitch=formationSlots(formation);
 const m:MatchRecord=f.match||{phase:'pre',minute:0,duration:90,period:'first',firstHalfAdded:0,secondHalfAdded:0,slots:positionsOnPitch.map(()=>''),bench:[],events:[]};
 const state=replayMatch(m),slots=m.phase==='pre'?m.slots:state.slots;
 const byId=(id:string)=>players.find(p=>p.id===id);
 function label(id:string){if(isDeletedPlayer(id))return 'Deleted player';const p=byId(id);return p?`${p.number||''} ${p.name}`.trim():id?'Unavailable player':''}
 function portrait(id:string){const p=byId(id);return p?.headshot?<img src={p.headshot} alt=""/>:<span className="portrait-fallback">{p?.number||'+'}</span>}
 function save(next:MatchRecord,nextFormation=formation){
  const clockIssue=matchClockIssue(next);if(clockIssue){setError(clockIssue);return false}
  const result=replayMatch(next);if(result.errors.length){setError(result.errors[0]);return false}
  setError('');const current=next.phase==='pre'?next.slots:result.slots;
  const portraits=Object.fromEntries(players.filter(p=>p.headshot&&[...next.slots,...next.bench].includes(p.id)).map(p=>[label(p.id),p.headshot!]));
  onChange({match:next,lineup:{formation:nextFormation,starters:current.map(id=>label(id)||'Vacant position'),substitutes:next.bench.filter(id=>!current.includes(id)).map(label),portraits},...matchFixturePatch(f,next)});return true;
 }
 function assign(index:number,id:string){
  if(m.phase!=='pre'||!byId(id))return;
  if(!m.slots.includes(id)&&m.bench.length>=15&&m.slots[index]&&!m.bench.includes(id)){setError('Remove a reserve before replacing this player.');return}
  const next=[...m.slots],previous=next.indexOf(id),outgoing=next[index];if(previous>=0)next[previous]=outgoing;next[index]=id;
  const bench=m.bench.filter(p=>p!==id);if(outgoing&&previous<0&&!bench.includes(outgoing))bench.push(outgoing);
  if(bench.length>15){setError('The bench can contain up to 15 players. Remove a reserve first.');return}
  save({...m,slots:next,bench});setChosen('');
 }
 function event(kind:MatchEvent['kind'],replacementId?:string,slotIndex?:number){
  const playerId=selected===null?'':slots[selected];if(!playerId)return;
  if(f.status==='cancelled'||f.status==='postponed'){setError('Set this fixture to Scheduled or Live before recording match events.');return}
  try{const next=recordPlayerEvent(m,{id:crypto.randomUUID(),kind,minute,playerId,...(replacementId?{replacementId}:{}),...(slotIndex!==undefined?{slotIndex}:{})});
   if(save(next)&&(kind==='substitution'||kind==='position'||replayMatch(next).dismissed.has(playerId)))setSelected(null);
  }catch(e){setError(e instanceof Error?e.message:'Could not record this event.')}
 }

 const eligiblePlayers=players.filter(p=>!eligibilityIssue(p)&&(showAll||fixtureTeamName(content,p.ageGroup)===fixtureTeamName(content,f.team)));
 const roster=eligiblePlayers.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
 const selectedId=selected===null?'':slots[selected];
 return <div className="match-workbench"><div className="lineup-team-title"><TeamBadge name={academyName} branding={teamBranding(content)} logo={f.teamLogo}/><span>vs</span><TeamBadge name={f.opponent||'Opponent'} branding={teamBranding(content)} logo={f.opponentLogo}/></div><div className="match-control-bar"><label>Formation<select value={formation} disabled={m.phase!=='pre'} onChange={e=>{const shape=formationSlots(e.target.value);const overflow=m.slots.slice(shape.length).filter(Boolean);if(m.bench.length+overflow.length>15){setError('Remove reserves before switching to a smaller formation.');return}setSelected(null);save({...m,slots:shape.map((_,i)=>m.slots[i]||''),bench:[...m.bench,...overflow].slice(0,15)},e.target.value)}}>{!formations.includes(formation)&&<option>{formation}</option>}{formations.map(v=><option key={v}>{v}</option>)}</select></label><MatchClock match={m} onChange={save} onMinuteChange={setMinute}/></div>
 <p className="hint">Tap a pitch position and choose its player. You can also select a player below, then tap a position, or drag with a mouse. Tap a player on the pitch to record goals, assists, cards and substitutions. Set the event minute in the popup. Both scores can be corrected above. Goal events update the academy score only while score tracking is linked. Publish changes to update player statistics.</p>
 {error&&<p role="alert" className="notice error">{error}</p>}
 {!f.match&&f.lineup?.starters.length? <p className="notice">This fixture has a text lineup. Assigning profile players will replace it with this linked lineup.</p>:null}
 {chosen&&m.phase==='pre'&&<p className="notice lineup-selection" role="status">{label(chosen)} selected. Tap a pitch position.<button type="button" onClick={()=>setChosen('')}>Cancel selection</button></p>}
 <div className="lineup-workspace"><div><div ref={pitchRef} className="interactive-pitch"><div className="pitch-outline"/><div className="pitch-centre"/><div className="pitch-box top"/><div className="pitch-box bottom"/>{positionsOnPitch.map((position,i)=><button type="button" key={i} className={'pitch-position'+(selected===i?' active':'')} style={{left:position.x+'%',top:position.y+'%'}} aria-label={`${position.role} ${i+1}: ${label(slots[i])||'Empty position'}`} aria-pressed={selected===i} onDragOver={e=>{if(m.phase==='pre')e.preventDefault()}} onDrop={e=>{e.preventDefault();assign(i,e.dataTransfer.getData('text/plain'))}} onClick={()=>{if(chosen&&m.phase==='pre'){assign(i,chosen);return}setSelected(i);setMinute(m.minute)}}>{portrait(slots[i])}<b>{label(slots[i])||position.role}</b></button>)}</div>
 <Dialog open={selected!==null} onOpenChange={open=>{if(!open)setSelected(null)}}><DialogContent className="pitch-actions player-actions-dialog"><DialogTitle>{label(selectedId)||'Field position'}</DialogTitle><DialogDescription>{m.phase==='pre'?'Choose a player for this position. Tap Done to return to the pitch.':'Record goals, assists, cards and substitutions. Two yellows remove the player from the field.'} Publish changes to update player statistics.</DialogDescription>
 {error&&<p role="alert" className="notice error">{error}</p>}
 {selected!==null&&<>
 {m.phase==='pre'&&<label>Player for this position<select value={selectedId} disabled={loading} onChange={e=>assign(selected!,e.target.value)}><option value="">Choose a player</option>{selectedId&&!eligiblePlayers.some(p=>p.id===selectedId)&&<option value={selectedId}>{label(selectedId)}</option>}{eligiblePlayers.map(p=><option key={p.id} value={p.id}>{label(p.id)}</option>)}</select></label>}
 {selectedId&&<section aria-label="Player match actions">
  <h4>Record a match event</h4>
  <p role="status">{m.events.filter(e=>e.playerId===selectedId&&e.kind==='goal').length} goals · {m.events.filter(e=>e.playerId===selectedId&&e.kind==='assist').length} assists · {m.events.filter(e=>e.playerId===selectedId&&e.kind==='yellow').length} yellow cards · {state.dismissed.has(selectedId)?1:0} red cards</p>
  <label>Match minute (including added time)<input type="number" min={0} max={m.phase==='finished'?m.minute:matchLimits(m).end} value={Number.isNaN(minute)?'':minute} onChange={e=>setMinute(e.target.value===''?NaN:Number(e.target.value))}/></label>
  <p className="hint">Recording an event starts match tracking if needed and advances the clock to this minute. Fill every starting position first.</p>
  <div className="event-buttons">{(['goal','assist','yellow','red','injury'] as const).map(kind=><button type="button" key={kind} onClick={()=>event(kind)}>{({goal:'⚽ Goal',assist:'↗ Assist',yellow:'🟨 Yellow card',red:'🟥 Red card',injury:'✚ Injury'})[kind]}</button>)}</div>
  {m.events.filter(e=>e.playerId===selectedId).length>0&&<div className="match-log" aria-label="Selected player events">{m.events.filter(e=>e.playerId===selectedId).map(e=><div key={e.id}><span>{formatMatchMinute(m,e.minute,e.period)} · {e.kind}</span><button type="button" onClick={()=>save({...m,events:m.events.filter(x=>x.id!==e.id)})}>Undo {e.kind}</button></div>)}</div>}
 </section>}
 {selectedId&&<label>Position on the field<select value={selected} disabled={m.phase==='finished'} onChange={e=>{const target=Number(e.target.value);if(m.phase==='pre'){assign(target,selectedId);setSelected(target)}else event('position',undefined,target)}}>{positionsOnPitch.map((p,i)=><option key={i} value={i}>{p.role} {i+1}{slots[i]?' · '+label(slots[i]):' · Empty'}</option>)}</select></label>}
 {m.phase==='pre'&&<>{selectedId&&<button type="button" disabled={m.bench.length>=15} onClick={()=>save({...m,slots:m.slots.map((id,i)=>i===selected?'':id),bench:[...m.bench,selectedId].slice(0,15)})}>Move to substitutes</button>}</>}
 {selectedId&&<><h4>Substitute · choose replacement</h4><div className="replacement-grid">{[...m.bench,...m.slots].filter(id=>id&&byId(id)&&!slots.includes(id)&&!state.dismissed.has(id)).map(id=><button type="button" key={id} onClick={()=>event('substitution',id)}>{portrait(id)}<span>{label(id)}<small>{byId(id)?.position}</small></span></button>)}</div>{!m.bench.some(id=>!slots.includes(id)&&!state.dismissed.has(id))&&<p>Add a substitute to the bench to choose a replacement.</p>}</>}
 {!selectedId&&<p>Select a player for this position to record their goals, assists and cards.</p>}
 </>}<button type="button" className="button navy lineup-done" onClick={()=>setSelected(null)}>Done</button></DialogContent></Dialog>

 <section className="bench-panel"><h4>Substitutes · {m.bench.length}/15</h4><div className="replacement-grid">{m.bench.map(id=><button key={id} type="button" disabled={m.phase!=='pre'} onClick={()=>save({...m,bench:m.bench.filter(p=>p!==id)})}>{portrait(id)}<span>{label(id)}<small>{m.phase==='pre'?'Remove from bench':slots.includes(id)?'On pitch':'Reserve'}</small></span></button>)}</div></section></div>
 <aside className="player-pool"><div className="pool-heading"><h4>Available players</h4><button type="button" disabled={loading} onClick={()=>{setLoading(true);setError('');setReloadPlayers(n=>n+1)}}>Refresh photos</button></div><p className="hint">Upload a headshot in Player profiles, save it, then refresh here.</p><input aria-label="Find a player" placeholder="Search players…" value={search} onChange={e=>setSearch(e.target.value)}/><label className="pool-filter"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Show all eligible age groups</label>{loading&&<p>Loading player profiles…</p>}{!loading&&!roster.length&&<p>No matching profiles. Add players in Player profiles or show all age groups.</p>}{positions.filter(position=>roster.some(p=>p.position===position)).map(position=><section key={position}><h5>{position}s</h5>{roster.filter(p=>p.position===position).map(p=><div className="pool-row" key={p.id}><button type="button" draggable={m.phase==='pre'} onDragStart={e=>e.dataTransfer.setData('text/plain',p.id)} aria-pressed={chosen===p.id} disabled={m.phase!=='pre'} onClick={()=>{if(selected!==null)assign(selected,p.id);else {setChosen(p.id);pitchRef.current?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}}>{portrait(p.id)}<span>{p.name}<small>#{p.number||'—'} · {m.slots.includes(p.id)?'Starting':m.bench.includes(p.id)?'Bench':p.ageGroup}</small></span></button>{m.phase==='pre'&&!m.slots.includes(p.id)&&!m.bench.includes(p.id)&&<button type="button" disabled={m.bench.length>=15} aria-label={'Add '+p.name+' to bench'} onClick={()=>save({...m,bench:[...m.bench,p.id]})}>+ Bench</button>}</div>)}</section>)}</aside></div>
 <div className="match-log"><h4>Match events</h4>{!m.events.length&&<p>No events recorded yet.</p>}{[...m.events].sort((a,b)=>b.minute-a.minute).map(e=><div key={e.id}><b>{formatMatchMinute(m,e.minute,e.period||(e.minute<=matchLimits(m).halfEnd?'first':'second'))}</b><span>{label(e.playerId)} · {e.kind}{e.replacementId?' → '+label(e.replacementId):''}</span><button type="button" aria-label={'Remove '+e.kind+' at '+e.minute+' minutes'} onClick={()=>save({...m,events:m.events.filter(x=>x.id!==e.id)})}>Undo</button></div>)}</div>
 {m.phase!=='pre'&&<div className="table-scroll"><table className="match-table"><caption>Player statistics · through {formatMatchMinute(m)}</caption><thead><tr><th>Player</th><th>Minutes</th><th>Goals</th><th>Assists</th><th>Yellow</th><th>Red</th><th>Injuries</th></tr></thead><tbody>{[...state.appeared].map(id=>{const stats=fixturePlayerMatches([{...f,match:m}],id)[0];return stats&&<tr key={id}><td>{label(id)}</td>{[stats.minutes,stats.goals,stats.assists,stats.yellowCards,stats.redCards,stats.injuries].map((v,i)=><td key={i}>{v}</td>)}</tr>})}</tbody></table></div>}
 </div>;
}
