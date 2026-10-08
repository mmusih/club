'use client';
import {useEffect,useRef,useState} from 'react';
import {CalendarDays,Plus,Trash2} from 'lucide-react';
import {seasonForDate,seasonOptions} from '../seasons';
import {clubToday} from '../player-eligibility';
import {fixtureTeamName,fixtureTeams} from '../lineup';
import type {Content,Fixture,Lineup} from '../content';
import Photo from '../photo';
import LineupEditor from './lineup-editor';
import type {Competition} from '../content';

const blankLineup:Lineup={formation:'4-3-3',starters:[],substitutes:[]};
export default function FixturesEditor({content:c,onChange,onRemove,onBusyChange}:{content:Content;onChange:(content:Content)=>void;onRemove:(id:string)=>void;onBusyChange:(busy:boolean)=>void}) {
 const fixtures=c.fixtures||[];
 const [team,setTeam]=useState(c.programmes[0]?.name||''),[competitionId,setCompetitionId]=useState(''),[competitionName,setCompetitionName]=useState(''),[competitionKind,setCompetitionKind]=useState<Competition['kind']>('league');
 const competitions=c.competitions||[];
 function defineCompetition(){if(!competitionName.trim())return;const id=crypto.randomUUID();onChange({...c,competitions:[...competitions,{id,name:competitionName.trim(),kind:competitionKind}]});setCompetitionId(id);setCompetitionName('')}

 const current=useRef(c);useEffect(()=>{current.current=c},[c]);
 const [uploading,setUploading]=useState(false),[error,setError]=useState('');
 function update(id:string,patch:Partial<Fixture>){const latest=current.current;onChange({...latest,fixtures:latest.fixtures.map(f=>f.id===id?{...f,...patch}:f)})}
 function lineup(id:string,patch:Partial<Lineup>){const f=current.current.fixtures.find(f=>f.id===id);if(f)update(id,{lineup:{...(f.lineup||blankLineup),...patch}})}
 function add(){const date=clubToday();onChange({...c,fixtures:[...fixtures,{id:crypto.randomUUID(),date,season:seasonForDate(date),time:'',team,opponent:'',competition:competitions.find(v=>v.id===competitionId)?.name||'',competitionId,venue:'',homeAway:'home',status:'scheduled',goalsFor:null,goalsAgainst:null}]})}
 async function upload(id:string,field:'teamLogo'|'opponentLogo'|'image',file?:File){
  if(!file)return;setUploading(true);onBusyChange(true);setError('');
  try{if(file.size>8*1024*1024)throw new Error('Choose a JPG, PNG or WebP smaller than 8 MB.');const body=new FormData();body.append('file',file);const res=await fetch('/api/upload',{method:'POST',body});const data=await res.json();if(!res.ok)throw new Error(data.error||'Upload failed.');if(field==='image')lineup(id,{image:data.url});else update(id,{[field]:data.url})}catch(e){setError(e instanceof Error?e.message:'Upload failed. Please try again.')}finally{setUploading(false);onBusyChange(false)}
 }
 function imageInput(f:Fixture,field:'teamLogo'|'opponentLogo'|'image',label:string){const src=field==='image'?f.lineup?.image:f[field];return <div className="fixture-image-editor"><label>{label}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{void upload(f.id,field,e.target.files?.[0]);e.target.value=''}}/></label>{src&&<><Photo src={src} alt={label}/><button type="button" onClick={()=>field==='image'?lineup(f.id,{image:''}):update(f.id,{[field]:''})}>Remove {label.toLowerCase()}</button></>}</div>}
 return <><div className="gallery-toolbar"><div><h2>The match-day calendar</h2><p>Edit fixtures and lineups, then publish your changes.</p></div><button className="button navy" disabled={uploading||fixtures.length>=200||!team||!competitionId} onClick={add}><Plus size={18}/> Add fixture</button></div>
 <div className="fixture-edit-grid fixture-create-bar"><label>Team for new fixture<select value={team} onChange={e=>setTeam(e.target.value)}><option value="">Choose team</option>{fixtureTeams(c).map(t=><option key={t}>{t}</option>)}</select></label><label>Competition for new fixture<select value={competitionId} onChange={e=>setCompetitionId(e.target.value)}><option value="">Choose defined competition</option>{competitions.map(v=><option key={v.id} value={v.id}>{v.name} · {v.kind}</option>)}</select></label></div>
 <details className="competition-manager"><summary>Define competitions · {competitions.length}</summary><div className="fixture-edit-grid"><label>Type<select value={competitionKind} onChange={e=>setCompetitionKind(e.target.value as Competition['kind'])}>{(['league','playoff','cup','friendly','custom'] as const).map(kind=><option value={kind} key={kind}>{({league:'League',playoff:'Promotional playoff',cup:'Cup',friendly:'Friendly',custom:'Custom'})[kind]}</option>)}</select></label><label>Competition name<input placeholder="e.g. Coca Cola League" maxLength={200} value={competitionName} onChange={e=>setCompetitionName(e.target.value)}/></label><button type="button" className="button navy" disabled={!competitionName.trim()||competitions.length>=100||competitions.some(v=>v.name.toLowerCase()===competitionName.trim().toLowerCase())} onClick={defineCompetition}>Define competition</button></div>{competitions.map(v=><div className="competition-row" key={v.id}><label>{v.kind}<input aria-label="Competition name" value={v.name} maxLength={200} onChange={e=>onChange({...c,competitions:competitions.map(x=>x.id===v.id?{...x,name:e.target.value}:x),fixtures:fixtures.map(f=>f.competitionId===v.id?{...f,competition:e.target.value}:f)})}/></label><button type="button" disabled={fixtures.some(f=>f.competitionId===v.id)} onClick={()=>{onChange({...c,competitions:competitions.filter(x=>x.id!==v.id)});if(competitionId===v.id)setCompetitionId('')}}>Remove</button></div>)}</details>
 <p className="hint">Kick-off times are Botswana time (CAT, UTC+2). Lineups open automatically one hour before kick-off. Scores are academy first, opponent second.</p>
 {error&&<p role="alert" className="notice error">{error}</p>}{uploading&&<p role="status">Uploading image…</p>}
 {!fixtures.length&&<div className="empty-state"><CalendarDays size={38}/><h2>Give supporters a date to remember.</h2><p>Add your first confirmed fixture to get started.</p></div>}
 <fieldset disabled={uploading} className="fixture-editor-list">{fixtures.map((f,i)=><article className="fixture-edit-card" key={f.id}><header><h3>Fixture {i+1}{f.opponent?' · '+f.opponent:''}</h3><button className="icon-danger" aria-label={'Remove fixture '+(i+1)} onClick={()=>onRemove(f.id)}><Trash2 size={18}/></button></header>
 <div className="fixture-edit-grid">
 <label>Date<input type="date" required value={f.date} onChange={e=>update(f.id,{date:e.target.value})}/></label>
 <label>Kick-off (CAT)<input type="time" value={f.time} onChange={e=>update(f.id,{time:e.target.value})}/></label>
 <label>Season<input list="fixture-seasons" value={f.season||seasonForDate(f.date)} onChange={e=>update(f.id,{season:e.target.value})}/></label>
 <label>Academy team<select disabled={!!f.match} value={fixtureTeams(c).includes(fixtureTeamName(c,f.team))?fixtureTeamName(c,f.team):''} onChange={e=>update(f.id,{team:e.target.value})}><option value="">Choose team</option>{fixtureTeams(c).map(t=><option key={t}>{t}</option>)}</select></label>
 <label>Competition<select value={f.competitionId||''} onChange={e=>update(f.id,{competitionId:e.target.value,competition:competitions.find(v=>v.id===e.target.value)?.name||''})}><option value="">{f.competition||'Choose competition'}</option>{competitions.map(v=><option key={v.id} value={v.id}>{v.name} · {v.kind}</option>)}</select></label>
 <label>Opponent<input maxLength={200} value={f.opponent} onChange={e=>update(f.id,{opponent:e.target.value})}/></label>
 <label>Academy plays<select value={f.homeAway} onChange={e=>update(f.id,{homeAway:e.target.value as Fixture['homeAway']})}><option value="home">At home</option><option value="away">Away</option><option value="neutral">At a neutral venue</option></select></label>
 <label>Venue<input maxLength={200} value={f.venue} onChange={e=>update(f.id,{venue:e.target.value})}/></label>
 <label>Status<select value={f.status} onChange={e=>update(f.id,{status:e.target.value as Fixture['status']})}><option value="scheduled">Scheduled</option><option value="played">Played</option><option value="postponed">Postponed</option><option value="cancelled">Cancelled</option></select></label>
 <label>Academy score<input disabled={!!f.match||f.status!=='played'} type="number" min={0} max={99} value={f.goalsFor??''} onChange={e=>update(f.id,{goalsFor:e.target.value===''?null:Number(e.target.value)})}/></label>
 <label>Opponent score<input disabled={f.status!=='played'} type="number" min={0} max={99} value={f.goalsAgainst??''} onChange={e=>update(f.id,{goalsAgainst:e.target.value===''?null:Number(e.target.value)})}/></label>
 </div><div className="fixture-edit-images">{imageInput(f,'teamLogo','Academy logo')}{imageInput(f,'opponentLogo','Opponent logo')}</div><p className="hint">JPG, PNG or WebP · up to 8 MB. The club logo is used unless you upload a team logo.</p>
 <LineupSection fixture={f} content={c} onChange={patch=>update(f.id,patch)}/></article>)}</fieldset>
 <datalist id="fixture-seasons">{seasonOptions().map(s=><option key={s} value={s}/>)}</datalist></>;
}

function LineupSection(props:{fixture:Fixture;content:Content;onChange:(patch:Partial<Fixture>)=>void}){const [open,setOpen]=useState(false);return <details className="fixture-lineup-editor" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Lineup & live match tracker</summary>{open&&<LineupEditor {...props}/>}</details>}
