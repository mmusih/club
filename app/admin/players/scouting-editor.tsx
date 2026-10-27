'use client';
import {Plus,Trash2} from 'lucide-react';
import {experienceLevels,positions,recruitmentStatuses,type PlayerData} from '../../player-model';

export default function ScoutingEditor({player:p,teams,onChange}:{player:PlayerData;teams:string[];onChange:<K extends keyof PlayerData>(key:K,value:PlayerData[K])=>void}){
 const history=p.clubHistory||[];
 function updateHistory(id:string,patch:Partial<(typeof history)[number]>){onChange('clubHistory',history.map(row=>row.id===id?{...row,...patch}:row));}
 return <section className="scouting-editor">
  <h3>Scouting & recruitment</h3>
  <p className="hint">Optional football information for scouts and recruiting teams. These details appear on published profiles. Keep personal contact details out; enquiries go through the club.</p>
  <div className="form-grid">
   <label>Current team<input list="profile-teams" maxLength={100} value={p.team||''} onChange={e=>onChange('team',e.target.value)} placeholder={p.ageGroup||'Select or enter a team'}/><small>Choose an academy team or enter its name. If blank, the directory groups this player by division.</small><datalist id="profile-teams">{teams.map(team=><option key={team} value={team}/>)}</datalist></label>
   <label>Height (cm)<input type="number" min={50} max={250} step="0.1" value={p.heightCm??''} onChange={e=>onChange('heightCm',e.target.value===''?'':Number(e.target.value))}/></label>
   <label>Secondary position<select value={p.secondaryPosition||''} onChange={e=>onChange('secondaryPosition',e.target.value as PlayerData['secondaryPosition'])}><option value="">Not specified</option>{positions.map(position=><option key={position} disabled={position===p.position}>{position}</option>)}</select></label>
   <label>Nationality<input maxLength={100} value={p.nationality||''} onChange={e=>onChange('nationality',e.target.value)} placeholder="For example, Botswana"/></label>
   <label>Experience level<select value={p.experienceLevel||''} onChange={e=>onChange('experienceLevel',e.target.value as PlayerData['experienceLevel'])}><option value="">Not specified</option>{experienceLevels.map(level=><option key={level}>{level}</option>)}</select></label>
   <label>Recruitment availability<select value={p.recruitmentStatus||''} onChange={e=>onChange('recruitmentStatus',e.target.value as PlayerData['recruitmentStatus'])}><option value="">Not specified</option>{recruitmentStatuses.map(status=><option key={status}>{status}</option>)}</select></label>
   <label className="full">Experience details<textarea rows={3} maxLength={2000} value={p.experienceDetails||''} onChange={e=>onChange('experienceDetails',e.target.value)} placeholder="Years playing, leagues, competition levels and representative appearances"/></label>
   <label className="full">Playing style & strengths<textarea rows={3} maxLength={2000} value={p.strengths||''} onChange={e=>onChange('strengths',e.target.value)} placeholder="Technical skills, tactical roles and strengths, with examples"/></label>
   <label className="full">Achievements & honours<textarea rows={3} maxLength={2000} value={p.achievements||''} onChange={e=>onChange('achievements',e.target.value)} placeholder="Awards, titles and representative selections, including the year"/></label>
  </div>
  <div className="editor-section-heading"><div><h3>Club history</h3><p>Record previous clubs, academies or school teams. Leave the end year blank for an ongoing spell.</p></div><button className="button outline" type="button" disabled={history.length>=40} onClick={()=>onChange('clubHistory',[...history,{id:crypto.randomUUID(),club:'',team:'',startYear:new Date().getFullYear(),endYear:'',notes:''}])}><Plus size={17}/> Add club</button></div>
  {!history.length&&<p className="profile-empty">No club history recorded yet.</p>}
  {history.map((row,index)=><section className="record-editor" key={row.id}><div className="record-title"><h3>Club history {index+1}</h3><button type="button" className="icon-danger" aria-label={'Remove club history '+(index+1)} onClick={()=>onChange('clubHistory',history.filter(r=>r.id!==row.id))}><Trash2 size={17}/></button></div><div className="form-grid">
   <label>Club / academy (required)<input maxLength={100} value={row.club} onChange={e=>updateHistory(row.id,{club:e.target.value})}/></label>
   <label>Team / division<input maxLength={100} value={row.team} onChange={e=>updateHistory(row.id,{team:e.target.value})}/></label>
   <label>Start year<input type="number" min={1900} max={2100} value={row.startYear||''} onChange={e=>updateHistory(row.id,{startYear:Number(e.target.value)})}/></label>
   <label>End year<input type="number" min={row.startYear||1900} max={2100} value={row.endYear} onChange={e=>updateHistory(row.id,{endYear:e.target.value===''?'':Number(e.target.value)})}/><small>Blank means present.</small></label>
   <label className="full">Role, level & highlights<textarea rows={3} maxLength={1500} value={row.notes} onChange={e=>updateHistory(row.id,{notes:e.target.value})}/></label>
  </div></section>)}
 </section>;
}
