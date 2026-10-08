'use client';
import {useState} from 'react';
import Photo from '../photo';
import {Plus,Trash2} from 'lucide-react';
import type {Content,Staff,Standing,Honour} from '../content';
import {seasonForDate,seasonOptions} from '../seasons';

type Kind='staff'|'standings'|'honours';
export default function ClubRecordsEditor({section,content:c,onChange,onRemove,onBusyChange}:{section:'Staff'|'Standings'|'Honours';content:Content;onChange:(c:Content)=>void;onRemove:(kind:Kind,id:string)=>void;onBusyChange?:(busy:boolean)=>void}) {
 const kind=section.toLowerCase() as Kind;
 const [uploading,setUploading]=useState(false),[uploadError,setUploadError]=useState('');
 const records=c[kind]||[];
 function update(id:string,patch:Partial<Staff&Standing&Honour>) {onChange({...c,[kind]:records.map(r=>r.id===id?{...r,...patch}:r)});}
 async function uploadLogo(id:string,file?:File){if(!file)return;setUploading(true);onBusyChange?.(true);setUploadError('');try{if(file.size>8*1024*1024)throw Error('Choose a logo smaller than 8 MB.');const body=new FormData();body.append('file',file);const response=await fetch('/api/upload',{method:'POST',body});const data=await response.json();if(!response.ok)throw Error(data.error||'Logo upload failed.');update(id,{logo:data.url});}catch(e){setUploadError(e instanceof Error?e.message:'Logo upload failed.')}finally{setUploading(false);onBusyChange?.(false)}}
 function add(){
  const id=crypto.randomUUID(),season=seasonForDate(new Date().toISOString().slice(0,10));
  const row=kind==='staff'?{id,name:'',role:'',team:'',bio:'',photo:''}:kind==='honours'?{id,season,title:'',team:'',achievement:'',photo:''}:{id,season,competition:'',group:c.programmes[0]?.name||'',position:1,club:'',logo:'',played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,points:0};
  onChange({...c,[kind]:[...records,row]});
 }
 const limit=kind==='staff'?60:kind==='standings'?500:100;
 return <><div className="gallery-toolbar"><div><h2>{section==='Staff'?'The people behind the team':section==='Standings'?'The league picture':'Our proudest moments'}</h2><p>{section==='Standings'?'Enter the official table, including each club’s position and points.':'Add confirmed club information, then publish your changes.'}</p></div><button className="button navy" onClick={add} disabled={records.length>=limit}><Plus size={18}/> Add {kind==='standings'?'club row':kind==='staff'?'staff member':'honour'}</button></div>
 {uploadError&&<p className="notice error" role="alert">{uploadError}</p>}{uploading&&<p role="status">Uploading club logo…</p>}
 {kind==='standings'&&<p className="hint">Use the same season, competition and academy team for all rows in a table. Points can include official deductions. Played must equal wins + draws + losses.</p>}
 {!records.length&&<div className="empty-state"><h3>No {kind} added yet.</h3><p>Only confirmed records will appear on the public website.</p></div>}
 {records.map((record,i)=><section className="edit-panel repeat-panel" key={record.id}><div className="panel-title"><h2>{section} · {i+1}</h2><button className="icon-danger" aria-label={'Remove '+section.toLowerCase()+' entry '+(i+1)} onClick={()=>onRemove(kind,record.id)}><Trash2 size={18}/></button></div><div className="form-grid">
 {Object.entries(record).filter(([key])=>!['id','photo','logo'].includes(key)).map(([key,value])=><label key={key} className={key==='bio'?'full':''}>{({name:'Name',role:'Role',team:'Team',bio:'Biography',season:'Season',title:'Competition / trophy',achievement:'Achievement (e.g. Winners)',competition:'Competition',group:'Academy team',position:'Official position',club:'Club',played:'Played',won:'Won',drawn:'Drawn',lost:'Lost',goalsFor:'Goals for',goalsAgainst:'Goals against',points:'Points'} as Record<string,string>)[key]}{key==='bio'?<textarea rows={4} maxLength={2000} value={value} onChange={e=>update(record.id,{[key]:e.target.value})}/>:<input type={typeof value==='number'?'number':'text'} min={key==='points'?-100:key==='position'?1:0} list={key==='season'?'record-seasons':undefined} maxLength={200} placeholder={key==='season'?'2026/27':undefined} value={value} onChange={e=>update(record.id,{[key]:typeof value==='number'?Number(e.target.value):e.target.value})}/>}</label>)}
 {kind==='standings'&&<div className="standing-logo-editor"><label>Club logo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e=>{void uploadLogo(record.id,e.target.files?.[0]);e.target.value=''}}/></label><label>Or choose an existing image<select value={(record as Standing).logo||''} onChange={e=>update(record.id,{logo:e.target.value})}><option value="">No custom logo</option>{(record as Standing).logo&&!c.photos.some(p=>p.url===(record as Standing).logo)&&<option value={(record as Standing).logo}>Current logo</option>}{c.logo&&c.logo!==(record as Standing).logo&&<option value={c.logo}>Academy logo</option>}{c.photos.map(p=><option key={p.id} value={p.url}>{p.caption}</option>)}</select></label>{(record as Standing).logo&&<><Photo src={(record as Standing).logo!} alt="Club logo preview"/><button type="button" onClick={()=>update(record.id,{logo:''})}>Remove custom logo</button></>}<small>JPG, PNG or WebP · up to 8 MB. The academy row uses the club logo by default.</small></div>}
 {'photo' in record&&<label>Photo<select value={record.photo} onChange={e=>update(record.id,{photo:e.target.value})}><option value="">No photo yet</option>{record.photo&&!c.photos.some(p=>p.url===record.photo)&&<option value={record.photo}>Current photo</option>}{c.photos.map(p=><option key={p.id} value={p.url}>{p.caption}</option>)}</select><small>Upload portraits or trophy photos in Photo gallery first.</small></label>}
 </div></section>)}<datalist id="record-seasons">{seasonOptions().map(s=><option key={s} value={s}/>)}</datalist></>;
}
