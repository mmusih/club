'use client';
import {useState} from 'react';
import type {Content} from '../content';
import {scheduledResults,saveScheduledResult,type ScheduledResult} from '../scheduled-results';
import {saveLeagueResult} from '../league-results';

export default function LeagueResultsEditor({content:c,onChange}:{content:Content;onChange:(c:Content)=>void}){
 const [filter,setFilter]=useState(''),[week,setWeek]=useState('');
 const rows=scheduledResults(c);
 const tableKey=(r:ScheduledResult)=>`${r.competition} · ${r.season} · ${r.group}`;
 const tables=[...new Set(rows.map(tableKey))];
 const selected=tables.includes(filter)?filter:tables[0]||'';
 const matches=rows.filter(r=>tableKey(r)===selected);
 return <section className="edit-panel"><h3>League match scores</h3><p>Find the match, enter both final scores and save the result. Played, wins, draws, losses, goals and points update automatically. Publish changes when you are ready.</p><p className="hint">Matches come from the league fixtures. Academy scores can also be updated in Fixtures or Lineup &amp; live match tracker.</p>
 {!rows.length?<p>Import the league fixture PDF in Fixtures to see the matches here.</p>:<><div className="form-grid"><label>League table<select value={selected} onChange={e=>{setFilter(e.target.value);setWeek('')}}>{tables.map(t=><option key={t}>{t}</option>)}</select></label><label>Week / round<select value={week} onChange={e=>setWeek(e.target.value)}><option value="">All rounds</option>{[...new Set(matches.map(r=>r.round))].filter(Boolean).map(r=><option key={r}>{r}</option>)}</select></label></div>
 {matches.filter(r=>!week||r.round===week).map(row=><ScoreRow key={`${row.key}:${row.homeGoals}:${row.awayGoals}`} row={row} content={c} onChange={onChange}/>)}</>}
 </section>;
}
function ScoreRow({row,content:c,onChange}:{row:ScheduledResult;content:Content;onChange:(c:Content)=>void}){
 const [home,setHome]=useState(row.homeGoals?.toString()??''),[away,setAway]=useState(row.awayGoals?.toString()??''),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 function save(){try{onChange(saveScheduledResult(c,row,home===''?NaN:Number(home),away===''?NaN:Number(away)));setError('');setSaved(true)}catch(e){setError(e instanceof Error?e.message:'Could not save score.')}}
 function remove(){try{if(row.resultId)onChange(saveLeagueResult(c,row.resultId));setError('')}catch(e){setError(e instanceof Error?e.message:'Could not remove score.')}}
 return <section className="edit-panel" aria-label={`${row.home} vs ${row.away}`}><h4>{row.home} vs {row.away}</h4><p className="hint">{row.date} {row.round&&`· ${row.round}`}{row.fixtureId?' · Academy match':''}</p><div className="form-grid"><label>{row.home} score<input type="number" min={0} max={99} step={1} value={home} onChange={e=>{setHome(e.target.value);setSaved(false)}}/></label><label>{row.away} score<input type="number" min={0} max={99} step={1} value={away} onChange={e=>{setAway(e.target.value);setSaved(false)}}/></label></div>{error&&<p className="notice error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="button navy" disabled={home===''||away===''} onClick={save}>Save result</button>{row.resultId&&<button type="button" onClick={remove}>Clear result</button>}</div>{(saved||row.resultId)&&<p className="hint" role="status">Result saved in this draft. Publish changes to update the website.</p>}</section>;
}
