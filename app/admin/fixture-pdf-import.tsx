'use client';
import {useRef,useState} from 'react';
import {Upload} from 'lucide-react';
import type {Content} from '../content';
import {fixtureTeams} from '../lineup';
import {teamKey} from '../team-branding';
import {prepareFixtureImport,trfaCompetition,type ImportedFixture} from '../fixture-import';
import CompetitionBrand from '../competition-brand';

export default function FixturePdfImport({content,onChange,onBusyChange}:{content:Content;onChange:(c:Content)=>void;onBusyChange:(busy:boolean)=>void}){
 const [rows,setRows]=useState<ImportedFixture[]>([]),[pdfTeam,setPdfTeam]=useState(''),[team,setTeam]=useState(''),[competition,setCompetition]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const fileInput=useRef<HTMLInputElement>(null);
 const teams=[...new Map(rows.flatMap(r=>[r.home,r.away]).map(name=>[teamKey(name),name])).values()].sort();
 const selected=rows.filter(r=>teamKey(r.home)===teamKey(pdfTeam)||teamKey(r.away)===teamKey(pdfTeam));
 async function read(file?:File){
  if(!file)return;setBusy(true);onBusyChange(true);setError('');setMessage('');setRows([]);
  try{
   if(file.size>10*1024*1024)throw new Error('Choose a PDF smaller than 10 MB.');
   const form=new FormData();form.append('file',file);
   const res=await fetch('/api/admin/fixtures/import',{method:'POST',body:form});const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not read the PDF.');
   const parsed=data.fixtures as ImportedFixture[];setRows(parsed);
   setPdfTeam([...new Set(parsed.flatMap(r=>[r.home,r.away]))].find(t=>teamKey(t)===teamKey(content.name))||'');
   setTeam(fixtureTeams(content).find(t=>/senior/i.test(t))||fixtureTeams(content)[0]||'');
   setCompetition(content.competitions?.find(c=>teamKey(c.name)===teamKey(trfaCompetition))?.id||'new');
  }catch(e){setError(e instanceof Error?e.message:'Could not read the PDF.')}finally{setBusy(false);onBusyChange(false)}
 }
 function add(){
  try{
   const existing=content.competitions||[];
   const defined=competition==='new'?existing.find(c=>teamKey(c.name)===teamKey(trfaCompetition))||{id:crypto.randomUUID(),name:trfaCompetition,kind:'league' as const}:existing.find(c=>c.id===competition);
   if(!defined)throw new Error('Choose a competition.');
   const competitions=existing.some(c=>c.id===defined.id)?existing:[...existing,defined];
   if(competitions.length>100)throw new Error('The competition limit has been reached. Choose an existing competition.');
   const result=prepareFixtureImport(rows,{...content,competitions},pdfTeam,team,defined.id);
   onChange({...content,competitions,leagueSchedules:result.leagueSchedules,fixtures:[...content.fixtures,...result.fixtures]});
   setMessage(`${result.fixtures.length} fixtures added. ${result.skipped} duplicates skipped. The full ${rows.length}-match league schedule is also saved. Publish changes to make it public.`);setRows([]);setError('');
  }catch(e){setError(e instanceof Error?e.message:'Could not add fixtures.')}
 }
 return <section className="fixture-pdf-import" aria-label="Import fixtures from PDF">
  <div className="gallery-toolbar"><div><h3>Import fixtures from PDF</h3><CompetitionBrand name={trfaCompetition}/><p>Upload the league schedule, choose your team, then review its fixtures before adding them.</p></div><button type="button" className="button outline" disabled={busy} onClick={()=>fileInput.current?.click()}><Upload size={18}/>{busy?'Reading PDF…':'Choose fixture PDF'}</button></div>
  <input ref={fileInput} hidden type="file" accept="application/pdf,.pdf" aria-label="Choose fixture PDF" onChange={e=>{void read(e.target.files?.[0]);e.target.value=''}}/>
  {busy&&<p role="status">Reading all fixture pages…</p>}{error&&<p className="notice error" role="alert">{error}</p>}{message&&<p className="notice success" role="status">{message}</p>}
  {!!content.leagueSchedules?.length&&<p className="hint">Published with your next save: {content.leagueSchedules.map(s=>`${s.competition} (${s.season}) · ${s.fixtures.length} league fixtures`).join('; ')}. Importing another PDF for the same competition and season replaces that full league schedule.</p>}
  {!!rows.length&&<><p>{rows.length} league fixtures found. The full schedule will be saved for View league fixtures. Matches involving the selected PDF team will also be added to the academy calendar.</p><div className="fixture-edit-grid">
   <label>Our team in the PDF<select value={pdfTeam} onChange={e=>setPdfTeam(e.target.value)}><option value="">Choose PDF team</option>{teams.map(t=><option key={t}>{t}</option>)}</select></label>
   <label>Academy team<select value={team} onChange={e=>setTeam(e.target.value)}><option value="">Choose academy team</option>{fixtureTeams(content).map(t=><option key={t}>{t}</option>)}</select></label>
   <label>Competition<select value={competition} onChange={e=>setCompetition(e.target.value)}><option value="new">{trfaCompetition} (use or create)</option>{content.competitions?.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
  </div><p className="hint">Dates, home/away and venues come from the fixture rows. Kick-off defaults to 16:00 Botswana time (CAT). You can edit each fixture after importing. Existing fixtures, scores and lineups are kept; exact duplicates are skipped.</p>
  {!!selected.length&&<div className="table-scroll fixture-import-preview"><table className="match-table"><caption>{selected.length} fixtures for {pdfTeam}</caption><thead><tr><th>Week</th><th>Date</th><th>Home</th><th>Away</th><th>Venue</th></tr></thead><tbody>{selected.map(r=><tr key={r.number}><td>{r.round}</td><td>{r.date}</td><td>{r.home}</td><td>{r.away}</td><td>{r.venue}</td></tr>)}</tbody></table></div>}
  <div className="dialog-actions"><button type="button" className="button outline" onClick={()=>setRows([])}>Cancel import</button><button type="button" className="button navy" disabled={!selected.length||!team||busy} onClick={add}>Save league schedule + {selected.length} academy fixtures</button></div></>}
 </section>;
}
