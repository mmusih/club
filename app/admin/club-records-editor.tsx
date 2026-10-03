'use client';
import {Plus,Trash2} from 'lucide-react';
import type {Content,Staff,Standing,Honour} from '../content';
import {seasonForDate,seasonOptions} from '../seasons';

type Kind='staff'|'standings'|'honours';
export default function ClubRecordsEditor({section,content:c,onChange,onRemove}:{section:'Staff'|'Standings'|'Honours';content:Content;onChange:(c:Content)=>void;onRemove:(kind:Kind,id:string)=>void}) {
 const kind=section.toLowerCase() as Kind;
 const records=c[kind]||[];
 function update(id:string,patch:Partial<Staff&Standing&Honour>) {onChange({...c,[kind]:records.map(r=>r.id===id?{...r,...patch}:r)});}
 function add(){
  const id=crypto.randomUUID(),season=seasonForDate(new Date().toISOString().slice(0,10));
  const row=kind==='staff'?{id,name:'',role:'',team:'',bio:'',photo:''}:kind==='honours'?{id,season,title:'',team:'',achievement:'',photo:''}:{id,season,competition:'',group:c.programmes[0]?.name||'',position:1,club:'',played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,points:0};
  onChange({...c,[kind]:[...records,row]});
 }
 const limit=kind==='staff'?60:kind==='standings'?500:100;
 return <><div className="gallery-toolbar"><div><h2>{section==='Staff'?'The people behind the team':section==='Standings'?'The league picture':'Our proudest moments'}</h2><p>{section==='Standings'?'Enter the official table, including each club’s position and points.':'Add confirmed club information, then publish your changes.'}</p></div><button className="button navy" onClick={add} disabled={records.length>=limit}><Plus size={18}/> Add {kind==='standings'?'club row':kind==='staff'?'staff member':'honour'}</button></div>
 {kind==='standings'&&<p className="hint">Use the same season, competition and academy team for all rows in a table. Points can include official deductions. Played must equal wins + draws + losses.</p>}
 {!records.length&&<div className="empty-state"><h3>No {kind} added yet.</h3><p>Only confirmed records will appear on the public website.</p></div>}
 {records.map((record,i)=><section className="edit-panel repeat-panel" key={record.id}><div className="panel-title"><h2>{section} · {i+1}</h2><button className="icon-danger" aria-label={'Remove '+section.toLowerCase()+' entry '+(i+1)} onClick={()=>onRemove(kind,record.id)}><Trash2 size={18}/></button></div><div className="form-grid">
 {Object.entries(record).filter(([key])=>!['id','photo'].includes(key)).map(([key,value])=><label key={key} className={key==='bio'?'full':''}>{({name:'Name',role:'Role',team:'Team',bio:'Biography',season:'Season',title:'Competition / trophy',achievement:'Achievement (e.g. Winners)',competition:'Competition',group:'Academy team',position:'Official position',club:'Club',played:'Played',won:'Won',drawn:'Drawn',lost:'Lost',goalsFor:'Goals for',goalsAgainst:'Goals against',points:'Points'} as Record<string,string>)[key]}{key==='bio'?<textarea rows={4} maxLength={2000} value={value} onChange={e=>update(record.id,{[key]:e.target.value})}/>:<input type={typeof value==='number'?'number':'text'} min={key==='points'?-100:key==='position'?1:0} list={key==='season'?'record-seasons':undefined} maxLength={200} placeholder={key==='season'?'2026/27':undefined} value={value} onChange={e=>update(record.id,{[key]:typeof value==='number'?Number(e.target.value):e.target.value})}/>}</label>)}
 {'photo' in record&&<label>Photo<select value={record.photo} onChange={e=>update(record.id,{photo:e.target.value})}><option value="">No photo yet</option>{record.photo&&!c.photos.some(p=>p.url===record.photo)&&<option value={record.photo}>Current photo</option>}{c.photos.map(p=><option key={p.id} value={p.url}>{p.caption}</option>)}</select><small>Upload portraits or trophy photos in Photo gallery first.</small></label>}
 </div></section>)}<datalist id="record-seasons">{seasonOptions().map(s=><option key={s} value={s}/>)}</datalist></>;
}
