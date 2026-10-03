'use client';
import {sectionVisible} from './sections';
import {useState} from 'react';
import {ArrowUpRight,CalendarDays,ArrowRight,Newspaper} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {seasonForDate,seasonLabel,seasonOptions} from './seasons';
import type {Content} from './content';

export function displayDate(date:string) {
 return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
}

export function NewsWall({content:c}:{content:Content}) {
 const [category,setCategory]=useState('All stories');
 const [story,setStory]=useState<Content['news'][number]|null>(null);
 const stories=[...c.news].sort((a,b)=>b.date.localeCompare(a.date)).filter(n=>category==='All stories'||(n.category||'Club news')===category);
 return <section className="section news-wall" id="news">
  <div className="section-heading"><div><p className="eyebrow dark">THE PEOPLE. THE PASSION. THE PROGRESS.</p><h2>FROM THE<br/><em>TOUCHLINE.</em></h2></div><p>Big moments and everyday wins.<br/>The stories that bring our academy together.</p></div>
  {c.news.length>0&&<div className="news-filters" aria-label="Filter news">{['All stories',...new Set(c.news.map(n=>n.category||'Club news'))].map(item=><button key={item} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div>}
  <div className="news-wall-grid">{stories.map((n,i)=><article className={'story-card'+(i===0?' story-featured':'')} key={n.id}>
   <button onClick={()=>setStory(n)} aria-label={'Read '+n.title}><div className="story-image"><img src={n.image||c.hero} alt="" loading="lazy"/><span className="story-tag">{n.category||'Club news'}</span><span className="story-arrow"><ArrowUpRight size={22}/></span></div><div className="story-copy"><time dateTime={n.date}>{displayDate(n.date)}</time><h3>{n.title}</h3><p>{n.body}</p><span className="story-read">Read the story <ArrowRight size={17}/></span></div></button>
  </article>)}</div>
  {!c.news.length&&<div className="news-coming"><img src={c.hero} alt="Academy team" loading="lazy"/><div><Newspaper size={30}/><p className="eyebrow">OUR STORY IS STILL BEING WRITTEN</p><h3>Every great moment<br/>starts with showing up.</h3><p>Match reports, academy updates and stories from our community will appear here.</p>{sectionVisible(c,'gallery')&&<a className="inline-link" href="#gallery">Explore life at the club <ArrowUpRight size={20}/></a>}</div></div>}
  <Dialog open={!!story} onOpenChange={open=>{if(!open)setStory(null)}}><DialogContent className="story-dialog"><DialogTitle>{story?.title}</DialogTitle><DialogDescription>{story?`${story.category||'Club news'} · ${displayDate(story.date)}`:''}</DialogDescription>{story&&<><img src={story.image||c.hero} alt=""/><p>{story.body}</p></>}</DialogContent></Dialog>
 </section>;
}

export function Fixtures({content:c}:{content:Content}) {
 const [view,setView]=useState('Upcoming'),[team,setTeam]=useState('All teams'),[season,setSeason]=useState(seasonOptions()[0]);
 const fixtures=c.fixtures||[];
 const matches=fixtures.filter(f=>seasonLabel(f.season||seasonForDate(f.date))===season&&(team==='All teams'||f.team===team)&&(view==='Results'?f.status==='played':f.status!=='played')).sort((a,b)=>view==='Results'?b.date.localeCompare(a.date):a.date.localeCompare(b.date));
 return <section className="section fixtures-section" id="fixtures"><div className="section-heading"><div><p className="eyebrow">ON THE CALENDAR. ON THE PITCH.</p><h2>THE NEXT<br/><em>CHAPTER.</em></h2></div><p>Follow the teams. Feel the anticipation.<br/>Fixtures and results, all in one place.</p></div>
 <div className="fixtures-toolbar"><div className="fixture-tabs" aria-label="Match view">{['Upcoming','Results'].map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v}</button>)}</div><label>Season <select value={season} onChange={e=>setSeason(e.target.value)}>{seasonOptions(fixtures.map(f=>f.season||seasonForDate(f.date))).map(s=><option key={s}>{s}</option>)}</select></label><label>Team <select value={team} onChange={e=>setTeam(e.target.value)}><option>All teams</option>{[...new Set(fixtures.map(f=>f.team))].sort().map(t=><option key={t}>{t}</option>)}</select></label></div>
 <div className="table-scroll fixtures-scroll" role="region" aria-label="Fixtures and results" tabIndex={0}><table className="fixtures-table"><caption className="sr-only">{view} matches — {team} — {season}</caption><thead><tr><th scope="col">Date / kick-off</th><th scope="col">Team / competition</th><th scope="col">Match</th><th scope="col">Venue</th><th scope="col">Status / score</th></tr></thead><tbody>{matches.map(f=><tr key={f.id}><td data-label="Date / kick-off"><strong>{displayDate(f.date)}</strong><small>{f.time||'Time TBC'}</small></td><td data-label="Team / competition"><strong>{f.team}</strong><small>{f.competition||'Competition TBC'}</small></td><td data-label="Opponent"><span className="match-opponent">{f.opponent}</span><small>{f.homeAway==='home'?'Home':f.homeAway==='away'?'Away':'Neutral venue'} · {c.name}</small></td><td data-label="Venue">{f.venue||'Venue TBC'}</td><td data-label="Status / score">{f.status==='played'?<><b className="match-score">{f.goalsFor} <span>–</span> {f.goalsAgainst}</b><small>Academy – opponent · FT</small></>:<span className={'fixture-status '+f.status}>{({scheduled:'Scheduled',postponed:'Postponed',cancelled:'Cancelled'})[f.status]}</span>}</td></tr>)}</tbody></table></div>
 {!matches.length&&<div className="fixtures-empty"><CalendarDays size={30}/><h3>{view==='Results'?'The story of the season starts here.':'The next whistle is coming.'}</h3><p>{view==='Results'?'Published results will appear here after the final whistle.':'Confirmed fixtures will appear here. Check back for the next match day.'}</p></div>}
 <p className="fixtures-note">All kick-off times are local to the match venue. Schedules may change.</p></section>;
}
