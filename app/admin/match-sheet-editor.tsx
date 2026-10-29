'use client';
import {useState} from 'react';
import type {Fixture,MatchSheetDetails} from '../content';

export default function MatchSheetEditor({fixture:f,onChange}:{fixture:Fixture;onChange:(patch:Partial<Fixture>)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const sheet=f.sheet||{};
 function update<K extends keyof MatchSheetDetails>(key:K,value:MatchSheetDetails[K]){onChange({sheet:{...sheet,[key]:value}})}
 async function download(){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/admin/fixtures/'+encodeURIComponent(f.id)+'/match-sheet',{cache:'no-store'});
   if(!response.ok){const data=await response.json();throw Error(data.error||'Could not download the match sheet.')}
   const url=URL.createObjectURL(await response.blob()),link=document.createElement('a');
   link.href=url;link.download='match-sheet-'+f.date+'-'+f.opponent.replace(/[^a-z0-9-]/gi,'-')+'.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){setError(e instanceof Error?e.message:'Could not download the match sheet.')}finally{setBusy(false)}
 }
 return <details className="game-details-editor"><summary>Match sheet & download</summary>
  <p className="hint">Every fixture has a match sheet. The saved lineup, MA IDs, result and match events fill it automatically. Complete the remaining details below and publish changes before downloading. Signatures are left blank for signing.</p>
  <div className="fixture-edit-grid">
   {([['association','Association'],['teamColors','Academy kit colours'],['opponentColors','Opponent kit colours'],['assistantReferee1','Assistant referee 1'],['assistantReferee2','Assistant referee 2'],['fourthOfficial','Fourth official'],['headCoach','Head coach'],['assistantCoach','Assistant coach'],['teamManager','Team manager'],['medic','Team medic']] as const).map(([key,label])=><label key={key}>{label}<input maxLength={200} value={sheet[key]||''} onChange={e=>update(key,e.target.value)}/></label>)}
   {([['halfTimeFor','Academy half-time score'],['halfTimeAgainst','Opponent half-time score'],['penaltiesFor','Academy penalties'],['penaltiesAgainst','Opponent penalties']] as const).map(([key,label])=><label key={key}>{label}<input type="number" min={0} max={99} value={sheet[key]??''} onChange={e=>update(key,e.target.value===''?null:Number(e.target.value))}/></label>)}
   {([['secondHalfStart','Second-half start (CAT)'],['fullTime','Final whistle time (CAT)']] as const).map(([key,label])=><label key={key}>{label}<input type="time" value={sheet[key]||''} onChange={e=>update(key,e.target.value)}/></label>)}
   <label>Captain<select value={sheet.captainId||''} onChange={e=>update('captainId',e.target.value)}><option value="">Choose captain</option>{(f.match?.slots||[]).filter(Boolean).map((id,i)=><option value={id} key={id}>{f.match?.roster?.[id]?.name||f.lineup?.starters[i]||'Starting player '+(i+1)}</option>)}</select></label>
   <label>Tactical approach<textarea maxLength={2000} rows={3} value={sheet.tactics||''} onChange={e=>update('tactics',e.target.value)}/></label>
   <label>Match official remarks<textarea maxLength={3000} rows={3} value={sheet.remarks||''} onChange={e=>update('remarks',e.target.value)}/></label>
  </div>
  <p className="hint">Referee, kick-off, venue and final scores come from the fixture. The academy half-time score is calculated from linked goals when possible; enter it above to override. Missing information stays blank. Downloads use the last published version.</p>
  <button type="button" className="button outline" disabled={busy||f.status!=='played'} onClick={()=>void download()}>{busy?'Preparing PDF…':'Download match sheet (PDF)'}</button>
  {f.status!=='played'&&<p className="hint">Available after the match is marked Played and published.</p>}
  {error&&<p className="notice error" role="alert">{error}</p>}
 </details>;
}
