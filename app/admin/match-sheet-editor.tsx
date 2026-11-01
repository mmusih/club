'use client';
import {useEffect,useRef,useState} from 'react';
import type {Fixture,MatchSheetDetails} from '../content';

export default function MatchSheetEditor({fixture:f,onChange}:{fixture:Fixture;onChange:(patch:Partial<Fixture>)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [preview,setPreview]=useState<{url:string;fixture:string}|null>(null);
 const requestRef=useRef<AbortController|null>(null);
 useEffect(()=>()=>requestRef.current?.abort(),[]);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview.url)},[preview]);
 const sheet=f.sheet||{};
 function update<K extends keyof MatchSheetDetails>(key:K,value:MatchSheetDetails[K]){onChange({sheet:{...sheet,[key]:value}})}
 async function generate(action:'preview'|'download'){
  setBusy(true);setError('');
  const controller=new AbortController();requestRef.current=controller;
  const fixture=JSON.stringify(f);
  try{
   const response=await fetch('/api/admin/fixtures/'+encodeURIComponent(f.id)+'/match-sheet',{method:'POST',headers:{'Content-Type':'application/json'},body:fixture,cache:'no-store',signal:controller.signal});
   if(!response.ok){const data=await response.json();throw Error(data.error||'Could not create the match sheet.')}
   const blob=await response.blob();if(controller.signal.aborted)return;
   const url=URL.createObjectURL(blob);
   if(action==='preview')setPreview({url,fixture});
   else{const link=document.createElement('a');link.href=url;link.download='match-sheet-'+f.date+'-'+f.opponent.replace(/[^a-z0-9-]/gi,'-')+'.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Could not create the match sheet.')}finally{if(!controller.signal.aborted)setBusy(false)}
 }
 return <details className="game-details-editor"><summary>Match sheet & download</summary>
  <p className="hint">Preview and download at any time, including before kick-off. These PDFs use the current fixture and lineup edits, even before you publish. Previewing or downloading does not save changes or start the game. Signatures are left blank for signing.</p>
  <div className="fixture-edit-grid">
   {([['association','Association'],['teamColors','Academy kit colours'],['opponentColors','Opponent kit colours'],['assistantReferee1','Assistant referee 1'],['assistantReferee2','Assistant referee 2'],['fourthOfficial','Fourth official'],['refereeAssessor','Referee assessor'],['headCoach','Head coach'],['assistantCoach','Assistant coach'],['goalkeeperCoach','Goalkeeper coach'],['teamManager','Team manager'],['medic','Team medic'],['official2','Official 2'],['official3','Official 3'],['official4','Official 4'],['official5','Official 5'],['opponentCaptain','Opponent captain']] as const).map(([key,label])=><label key={key}>{label}<input maxLength={200} value={(key==='teamManager'?sheet.teamManager??sheet.official1:sheet[key])||''} onChange={e=>update(key,e.target.value)}/></label>)}
   {([['halfTimeFor','Academy half-time score'],['halfTimeAgainst','Opponent half-time score'],['penaltiesFor','Academy penalties'],['penaltiesAgainst','Opponent penalties'],['overallFor','Academy overall score'],['overallAgainst','Opponent overall score']] as const).map(([key,label])=><label key={key}>{label}<input type="number" min={0} max={key.startsWith('overall')?199:99} value={sheet[key]??''} onChange={e=>update(key,e.target.value===''?null:Number(e.target.value))}/></label>)}
   {([['halfTime','Half-time (CAT)'],['secondHalfStart','Second-half start (CAT)'],['fullTime','Final whistle time (CAT)']] as const).map(([key,label])=><label key={key}>{label}<input type="time" value={sheet[key]||''} onChange={e=>update(key,e.target.value)}/></label>)}
   <label>Captain<select value={sheet.captainId||''} onChange={e=>update('captainId',e.target.value)}><option value="">Choose captain</option>{(f.match?.slots||[]).filter(Boolean).map((id,i)=><option value={id} key={id}>{f.match?.roster?.[id]?.name||f.lineup?.starters[i]||'Starting player '+(i+1)}</option>)}</select></label>
   <label>Tactical approach<textarea maxLength={2000} rows={3} value={sheet.tactics||''} onChange={e=>update('tactics',e.target.value)}/></label>
   <label>Match official remarks<textarea maxLength={3000} rows={3} value={sheet.remarks||''} onChange={e=>update('remarks',e.target.value)}/></label>
  </div>
  <p className="hint">Referee, kick-off, venue and scores come from the fixture. The academy half-time score is calculated from linked goals after half-time when possible; enter it above to override. Missing information stays blank. Publish changes when you want to save them.</p>
  <div className="match-sheet-actions"><button type="button" className="button outline" disabled={busy} onClick={()=>void generate('preview')}>{preview?'Refresh preview':'Preview match sheet'}</button><button type="button" className="button outline" disabled={busy} onClick={()=>void generate('download')}>Download match sheet (PDF)</button>{preview&&<button type="button" className="button outline" onClick={()=>setPreview(null)}>Close preview</button>}</div>
  {busy&&<p role="status">Preparing PDF…</p>}
  {error&&<p className="notice error" role="alert">{error}</p>}
  {preview&&<section className="match-sheet-preview" aria-label="Match sheet preview"><p role="status">{preview.fixture!==JSON.stringify(f)?'Your edits have changed. Refresh the preview to see the latest sheet.':'Showing the current editor copy. Check the names, MA IDs, lineup and match details before printing.'}</p><p className="hint">If your browser cannot display the PDF below, use Download match sheet (PDF) to inspect it.</p><iframe title="Match sheet PDF preview" src={preview.url}/></section>}
 </details>;
}
