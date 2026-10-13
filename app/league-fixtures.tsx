'use client';
import {useState} from 'react';
import {CalendarDays} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogTrigger} from '@/components/ui/dialog';
import type {Content,LeagueSchedule} from './content';
import CompetitionBrand from './competition-brand';
import TeamBadge from './team-badge';
import {brandingName,teamBranding} from './team-branding';

export default function LeagueFixtures({schedules,content}:{schedules:LeagueSchedule[];content:Content}){
 const [open,setOpen]=useState(false);
 return <Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><button type="button" className="league-fixtures-button"><CalendarDays size={16}/> View league fixtures</button></DialogTrigger>
  <DialogContent className="league-fixtures-dialog"><DialogTitle>League fixtures</DialogTitle><DialogDescription>The full league schedule · Kick-off times are Botswana time (CAT).</DialogDescription>
   {open&&<LeagueScheduleView schedules={schedules} content={content}/>}
  </DialogContent>
 </Dialog>;
}

function LeagueScheduleView({schedules,content}:{schedules:LeagueSchedule[];content:Content}){
 const [selection,setSelection]=useState(''),[week,setWeek]=useState('all');
 const key=(s:LeagueSchedule)=>s.competitionId+'|'+s.season;
 const schedule=schedules.find(s=>key(s)===selection)||schedules.toSorted((a,b)=>b.season.localeCompare(a.season))[0];
 if(!schedule)return <p className="league-empty">The full league schedule will appear here once it has been imported and published.</p>;
 const rounds=[...new Set(schedule.fixtures.map(f=>f.round))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const rows=schedule.fixtures.filter(f=>week==='all'||f.round===week).toSorted((a,b)=>a.date.localeCompare(b.date)||a.number-b.number);
 const branding=teamBranding(content);
 return <>
  <CompetitionBrand name={schedule.competition}/>
  <div className="league-fixtures-filters"><label>Competition / season<select value={key(schedule)} onChange={e=>{setSelection(e.target.value);setWeek('all')}}>{schedules.map(s=><option key={key(s)} value={key(s)}>{s.competition} · {s.season}</option>)}</select></label><label>Week<select value={week} onChange={e=>setWeek(e.target.value)}><option value="all">All weeks</option>{rounds.map(r=><option key={r}>{r}</option>)}</select></label></div>
  <p className="league-fixtures-count" role="status">{rows.length} {rows.length===1?'fixture':'fixtures'} · All teams</p>
  <div className="league-fixtures-scroll" role="region" tabIndex={0} aria-label="Full league fixtures — scroll for all teams and weeks"><table className="league-fixtures-table"><caption className="sr-only">{schedule.competition} · {schedule.season} · {week==='all'?'All weeks':week}</caption><thead><tr><th scope="col">Week / date</th><th scope="col">Home</th><th scope="col">Away</th><th scope="col">Kick-off</th><th scope="col">Venue</th></tr></thead><tbody>{rows.map(f=><tr key={f.number}><td><strong>{f.round}</strong><time dateTime={f.date}>{new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(f.date+'T12:00:00Z'))}</time></td><td><TeamBadge name={brandingName(content,f.home)} branding={branding}/></td><td><TeamBadge name={brandingName(content,f.away)} branding={branding}/></td><td>{f.time}</td><td>{f.venue}</td></tr>)}</tbody></table></div>
 </>;
}
