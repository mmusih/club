'use client';
import Photo from './photo';
import {sectionVisible} from './sections';
import {useEffect,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {fixtureTeamName,fixtureTeams,lineupAvailable,formatMatchMinute,matchPeriod} from './lineup';
import {clubToday} from './player-eligibility';
import {inMatchView,type MatchView} from './fixture-view';
import {ArrowUpRight,CalendarDays,ArrowRight,Newspaper} from 'lucide-react';
import Link from 'next/link';
import {seasonForDate,seasonLabel,seasonOptions} from './seasons';
import type {Content,Fixture} from './content';

export function displayDate(date:string) {
 return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
}

export function NewsWall({content:c}:{content:Content}) {
 const [category,setCategory]=useState('All stories');
 const stories=[...c.news].sort((a,b)=>b.date.localeCompare(a.date)).filter(n=>category==='All stories'||(n.category||'Club news')===category);
 return <section className="section news-wall" id="news">
  <div className="section-heading"><div><p className="eyebrow dark">THE PEOPLE. THE PASSION. THE PROGRESS.</p><h2>FROM THE<br/><em>TOUCHLINE.</em></h2></div><p>Big moments and everyday wins.<br/>The stories that bring our academy together.</p></div>
  {c.news.length>0&&<div className="news-filters" aria-label="Filter news">{['All stories',...new Set(c.news.map(n=>n.category||'Club news'))].map(item=><button key={item} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div>}
  <div className="news-wall-grid">{stories.map((n,i)=><article className={'story-card'+(i===0?' story-featured':'')} key={n.id}>
   <Link href={'/news/'+encodeURIComponent(n.id)} aria-label={'Read '+n.title}><div className="story-image"><Photo src={n.image||c.hero} alt="" loading="lazy"/><span className="story-tag">{n.category||'Club news'}</span><span className="story-arrow"><ArrowUpRight size={22}/></span></div><div className="story-copy"><time dateTime={n.date}>{displayDate(n.date)}</time><h3>{n.title}</h3><p>{n.body}</p><span className="story-read">Read the story <ArrowRight size={17}/></span></div></Link>
  </article>)}</div>
  {!c.news.length&&<div className="news-coming"><Photo src={c.hero} alt="Academy team" loading="lazy"/><div><Newspaper size={30}/><p className="eyebrow">OUR STORY IS STILL BEING WRITTEN</p><h3>Every great moment<br/>starts with showing up.</h3><p>Match reports, academy updates and stories from our community will appear here.</p>{sectionVisible(c,'gallery')&&<a className="inline-link" href="#gallery">Explore life at the club <ArrowUpRight size={20}/></a>}</div></div>}
 </section>;
}

export function Fixtures({content:c}:{content:Content}) {
 const [view,setView]=useState<MatchView>('Upcoming'),[team,setTeam]=useState('All teams'),[season,setSeason]=useState(seasonForDate(clubToday()));
 const [fixtures,setFixtures]=useState(c.fixtures||[]),[selected,setSelected]=useState<string|null>(null),[now,setNow]=useState<number|null>(null),[loadError,setLoadError]=useState(false);
 useEffect(()=>{
  let active=true;
  async function refresh(){
   setNow(Date.now());
   try{const response=await fetch('/api/content',{cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();if(active){setFixtures((data.content.fixtures||[]).map((f:Fixture)=>({...f,...(f.match?.phase==='live'&&f.status==='scheduled'?{liveMinute:f.match.minute,liveClock:matchPeriod(f.match)==='interval'?'Half-time':formatMatchMinute(f.match)}:{})})));setLoadError(false)}}catch{if(active)setLoadError(true)}
  }
  void refresh();const timer=setInterval(refresh,15000);
  return()=>{active=false;clearInterval(timer)};
 },[]);
 const matches=fixtures.filter(f=>seasonLabel(f.season||seasonForDate(f.date))===season&&(team==='All teams'||fixtureTeamName(c,f.team)===team)&&inMatchView(f,view,now===null?clubToday():clubToday(new Date(now)))).sort((a,b)=>view==='Results'?(b.date+b.time).localeCompare(a.date+a.time):(a.date+a.time).localeCompare(b.date+b.time));
 const active=fixtures.find(f=>f.id===selected);
 function badge(src:string|undefined,name:string){return src?<Photo className="fixture-badge" src={src} alt=""/>:<span className="fixture-badge badge-placeholder" aria-hidden="true">{name.slice(0,2).toUpperCase()}</span>}
 function teamRow(f:Fixture,academy:boolean,home:boolean){
  const name=academy?c.name:f.opponent,logo=academy?(f.teamLogo||c.logo):f.opponentLogo;
  const score=academy?f.goalsFor:f.goalsAgainst;
  return <div className={'fixture-team-row'+(home?' home-team':'')}>
   {home||academy?<button className="fixture-team-name" onClick={()=>setSelected(f.id)} aria-label={'View '+f.team+' lineup for '+name+' vs '+(academy?f.opponent:c.name)}>{badge(logo,name)}<span>{name}<small>{home?'Home':f.homeAway==='neutral'?'Neutral venue':'Away'}{academy?' · '+fixtureTeamName(c,f.team):''}</small></span></button>:<div className="fixture-team-name">{badge(logo,name)}<span>{name}<small>{f.homeAway==='neutral'?'Neutral venue':'Away'}</small></span></div>}
   <b className="fixture-row-score">{f.status==='played'||f.liveMinute!==undefined?score:'–'}</b>
  </div>;
 }
 return <section className="section fixtures-section" id="fixtures"><div className="section-heading"><div><p className="eyebrow">ON THE CALENDAR. ON THE PITCH.</p><h2>MATCH<br/><em>CENTRE.</em></h2></div><p>Every team. Every match day.<br/>Follow the next chapter.</p></div>
 <div className="fixtures-toolbar"><div className="fixture-tabs" aria-label="Match view">{(['Upcoming','Results','Other matches'] as const).map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v}</button>)}</div><label>Season <select value={season} onChange={e=>setSeason(e.target.value)}>{seasonOptions(fixtures.map(f=>f.season||seasonForDate(f.date))).map(s=><option key={s}>{s}</option>)}</select></label><label>Team <select value={team} onChange={e=>setTeam(e.target.value)}><option>All teams</option>{fixtureTeams({...c,fixtures}).map(t=><option key={t}>{t}</option>)}</select></label></div>
 <div className="fixture-cards">{matches.map(f=><article className="fixture-card" key={f.id}>
  <header><span>{f.competition||'Competition TBC'}</span><span>{fixtureTeamName(c,f.team)}</span></header>
  <div className="fixture-card-body"><div className="fixture-kickoff"><time dateTime={f.date}>{displayDate(f.date)}</time><strong>{f.time||'Time TBC'}</strong><span>{f.liveMinute!==undefined?f.liveClock==='Half-time'?'Half-time':'Live · '+(f.liveClock||f.liveMinute+'′'):({scheduled:'Scheduled',played:'Full time',postponed:'Postponed',cancelled:'Cancelled'})[f.status]}</span></div>
  <div className="fixture-teams">{teamRow(f,f.homeAway!=='away',f.homeAway!=='neutral')}{teamRow(f,f.homeAway==='away',false)}</div></div>
  <div className="fixture-card-footer"><span>{f.venue||'Venue TBC'}{f.homeAway==='neutral'?' · Neutral venue':''}</span><button onClick={()=>setSelected(f.id)}>Academy lineup <ArrowUpRight size={15}/></button></div>
 </article>)}</div>
 {!matches.length&&<div className="fixtures-empty"><CalendarDays size={30}/><h3>No {view.toLowerCase()} for {team==='All teams'?'this selection':team}.</h3><p>Choose another team or season, or check back for confirmed match details.</p></div>}
 <p className="fixtures-note">Kick-off times: Botswana (CAT, UTC+2). Academy lineups open one hour before kick-off. Schedules may change.</p>
 <Dialog open={!!active} onOpenChange={open=>{if(!open)setSelected(null)}}><DialogContent className="lineup-dialog"><DialogTitle>{active&&fixtureTeamName(c,active.team)} lineup</DialogTitle><DialogDescription>{active&&<>{c.name} vs {active.opponent} · {active.competition||'Competition TBC'}<br/>{displayDate(active.date)} · {active.time||'Time TBC'} CAT</>}</DialogDescription>
 {active&&(now!==null&&lineupAvailable(active,now)?active.lineup&&(active.lineup.image||active.lineup.starters.length)?<AcademyLineup fixture={active} club={c.name}/>:<p className="lineup-message">The academy has not published this lineup yet. Check back soon.</p>:<p className="lineup-message">{active.status==='postponed'||active.status==='cancelled'?'Lineups are unavailable for postponed or cancelled matches.':!active.time?'The lineup will be available once a kick-off time is confirmed.':'The academy lineup opens one hour before kick-off.'}</p>)}
 {loadError&&<p role="status">Could not refresh match details. Please check your connection and try again.</p>}
 </DialogContent></Dialog></section>;
}

function AcademyLineup({fixture,club}:{fixture:Fixture;club:string}){
 const lineup=fixture.lineup!;
 let offset=0;
 const rows=[1,...lineup.formation.split('-').map(Number)].map(count=>{const row=lineup.starters.slice(offset,offset+count);offset+=count;return row}).reverse();
 return <div className="academy-lineup"><div className="lineup-heading"><strong>{club}</strong><span>{lineup.formation}</span></div>
 {lineup.image?<Photo className="lineup-graphic" src={lineup.image} alt={fixture.team+' match lineup'}/>:<div className="lineup-pitch"><div className="pitch-circle" aria-hidden="true"/>{rows.map((row,i)=><div className="lineup-row" key={i}>{row.map((name,j)=>{const number=name.match(/^([0-9]{1,2})[.\s-]+/);return <div className="lineup-player" key={j}>{lineup.portraits?.[name]?<Photo className="lineup-headshot" src={lineup.portraits[name]} alt=""/>:<span className="lineup-shirt">{number?number[1]:'●'}</span>}<span>{number?name.slice(number[0].length):name}</span></div>})}</div>)}</div>}
 {lineup.image&&lineup.starters.length>0&&<p className="lineup-names">Starting lineup: {lineup.starters.join(' · ')}</p>}
 {lineup.substitutes.length>0&&<div className="lineup-subs"><h3>Substitutes</h3><ul>{lineup.substitutes.map((name,i)=><li key={i}>{name}</li>)}</ul></div>}
 </div>;
}
