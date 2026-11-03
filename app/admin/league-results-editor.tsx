'use client';
import {useState} from 'react';
import type {Content,LeagueResult} from '../content';
import {sameLeagueTable,saveLeagueResult} from '../league-results';
import {clubToday} from '../player-eligibility';

export default function LeagueResultsEditor({content:c,onChange}:{content:Content;onChange:(c:Content)=>void}){
 const [draft,setDraft]=useState<LeagueResult>({id:'',date:clubToday(),homeId:'',awayId:'',homeGoals:0,awayGoals:0});
 const [error,setError]=useState('');
 const home=c.standings.find(r=>r.id===draft.homeId);
 const label=(id:string)=>{const r=c.standings.find(r=>r.id===id);return r?`${r.club} · ${r.competition} · ${r.group} · ${r.season}`:'Removed club'};
 function save(remove?:string){try{const id=remove||draft.id||crypto.randomUUID();onChange(saveLeagueResult(c,id,remove?undefined:{...draft,id}));setError('');setDraft({...draft,id:'',homeGoals:0,awayGoals:0});}catch(e){setError(e instanceof Error?e.message:'Could not update result.')}}
 return <section className="edit-panel"><h3>League match results · all clubs</h3><p>Record matches between any two clubs, including games without Eyes On The Ball. Each result updates both clubs: played, wins, draws, losses, goals and points (3 for a win, 1 for a draw). Add missing clubs below first.</p><p className="hint">Enter only results not already included in the totals below. Completed league fixtures update this table automatically. Correct those scores in Fixtures. Editing or removing a result adjusts its previous contribution; official totals and points deductions remain editable below.</p>
 {error&&<p className="notice error" role="alert">{error}</p>}
 <div className="form-grid"><label>Match date<input type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></label><label>Home club / league table<select value={draft.homeId} onChange={e=>setDraft({...draft,homeId:e.target.value,awayId:''})}><option value="">Choose club</option>{c.standings.map(r=><option key={r.id} value={r.id}>{label(r.id)}</option>)}</select></label><label>Away club<select value={draft.awayId} onChange={e=>setDraft({...draft,awayId:e.target.value})}><option value="">Choose club</option>{c.standings.filter(r=>home&&r.id!==home.id&&sameLeagueTable(home,r)).map(r=><option key={r.id} value={r.id}>{r.club}</option>)}</select></label>{(['homeGoals','awayGoals'] as const).map(key=><label key={key}>{key==='homeGoals'?'Home goals':'Away goals'}<input type="number" min={0} max={99} value={Number.isNaN(draft[key])?'':draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value===''?NaN:Number(e.target.value)})}/></label>)}</div>
 <button type="button" className="button navy" disabled={!draft.homeId||!draft.awayId||!draft.date} onClick={()=>save()}>{draft.id?'Update result':'Record result'}</button>{draft.id&&<button type="button" onClick={()=>setDraft({...draft,id:''})}>Cancel edit</button>}
 <div className="match-log">{[...(c.leagueResults||[])].sort((a,b)=>b.date.localeCompare(a.date)).map(r=><div key={r.id}><span>{r.date} · {label(r.homeId)} — {c.standings.find(s=>s.id===r.awayId)?.club} · <b>{r.homeGoals}–{r.awayGoals}</b></span>{r.fixtureId?<span>Linked fixture · edit in Fixtures</span>:<><button type="button" onClick={()=>{setDraft(r);setError('')}}>Edit</button><button type="button" onClick={()=>save(r.id)}>Remove result</button></>}</div>)}</div></section>;
}
