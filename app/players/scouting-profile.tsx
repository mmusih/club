import type {PublicPlayer} from '../player-model';
import {playerTeam} from '../player-teams';

export default function ScoutingProfile({player:p}:{player:PublicPlayer}){
 const facts=[['Age',p.age==null?'Not recorded':`${p.age} years`],['Current team',playerTeam(p)],['Division / age group',p.ageGroup],['Primary position',p.position],['Secondary position',p.secondaryPosition||'Not specified'],['Height',p.heightCm?`${p.heightCm} cm`:'Not specified'],['Nationality',p.nationality||'Not specified'],['Experience level',p.experienceLevel||'Not specified'],['Preferred foot',p.foot],['Recruitment availability',p.recruitmentStatus||'Contact the club']];
 const history=[...(p.clubHistory||[])].sort((a,b)=>(b.endYear===''?Infinity:b.endYear)-(a.endYear===''?Infinity:a.endYear)||b.startYear-a.startYear||a.club.localeCompare(b.club));
 return <>
  <section className="profile-section"><p className="eyebrow dark">PLAYER DETAILS</p><h2>Scouting overview</h2><dl className="scouting-facts">{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   {([['Experience',p.experienceDetails],['Playing style & strengths',p.strengths],['Achievements & honours',p.achievements]] as const).filter(([,value])=>value).map(([label,value])=><div className="scouting-notes" key={label}><h3>{label}</h3><p>{value}</p></div>)}
  </section>
  <section className="profile-section"><p className="eyebrow dark">THE FOOTBALL JOURNEY</p><h2>Club history</h2>{history.length?<ol className="career-history">{history.map(row=><li key={row.id}><span>{row.startYear} – {row.endYear||'Present'}</span><div><h3>{row.club}</h3>{row.team&&<strong>{row.team}</strong>}{row.notes&&<p>{row.notes}</p>}</div></li>)}</ol>:<p className="profile-empty">Club history has not been added yet.</p>}</section>
 </>;
}
