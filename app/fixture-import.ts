import type {Content,Fixture,LeagueSchedule} from './content';
import {seasonForDate} from './seasons';
import {teamKey} from './team-branding';

export type PdfText={str:string;transform:number[];width:number};
export type ImportedFixture={number:number;date:string;home:string;away:string;venue:string;round:string};
export const trfaCompetition='TRFA Division 1 Western Stream';

/** Read the supplied landscape schedule by column position, never by team-name guesses. */
export function parseFixturePages(pages:{width:number;items:PdfText[]}[]):ImportedFixture[]{
 const fixtures:ImportedFixture[]=[];let week='';
 for(const [pageIndex,page] of pages.entries()){
  const lines:{y:number;items:PdfText[]}[]=[];
  for(const item of page.items.filter(t=>t.str.trim()).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4])){
   let line=lines.find(l=>Math.abs(l.y-item.transform[5])<2);
   if(!line){line={y:item.transform[5],items:[]};lines.push(line)}line.items.push(item);
  }
  // PDF font changes can split a single word (for example VE + NUE).
  for(const line of lines){
   const merged:PdfText[]=[];
   for(const item of line.items.sort((a,b)=>a.transform[4]-b.transform[4])){
    const previous=merged.at(-1);
    if(previous&&item.transform[4]-(previous.transform[4]+previous.width)<1){previous.str+=item.str;previous.width=item.transform[4]+item.width-previous.transform[4]}
    else merged.push({...item});
   }
   line.items=merged;
  }
  const heading=(name:string)=>lines.flatMap(l=>l.items).find(t=>t.str.trim()===name);
  const homeHeading=heading('HOME'),awayHeading=heading('AWAY'),venueHeading=heading('VENUE');
  if(!homeHeading||!awayHeading||!venueHeading)throw new Error(`Page ${pageIndex+1} does not have the expected HOME, AWAY and VENUE columns.`);
  const center=(t:PdfText)=>t.transform[4]+t.width/2;
  const homeCenter=center(homeHeading),awayCenter=center(awayHeading),venueCenter=center(venueHeading);
  const bounds=[homeCenter-(awayCenter-homeCenter)/2,(homeCenter+awayCenter)/2,(awayCenter+venueCenter)/2];
  for(const line of lines){
   const items=line.items.sort((a,b)=>a.transform[4]-b.transform[4]);
   const label=items.map(t=>t.str).join(' ').trim();
   const weekMatch=label.match(/^WEEK\s+(\d+)\b/i);if(weekMatch){week='Week '+weekMatch[1];continue}
   const first=items[0];if(!/^\d+$/.test(first.str.trim())||first.transform[4]/page.width>0.13)continue;
   const number=Number(first.str.trim());
   const dateText=items.filter(t=>t.transform[4]/page.width>0.125&&center(t)<bounds[0]).map(t=>t.str).join(' ');
   const dateMatch=dateText.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
   const cell=(left:number,right:number)=>items.filter(t=>center(t)>=left&&center(t)<right).map(t=>t.str.trim()).join(' ').replace(/\s+/g,' ').trim();
   const home=cell(bounds[0],bounds[1]),away=cell(bounds[1],bounds[2]),venue=cell(bounds[2],Infinity);
   const date=dateMatch?`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`:'';
   if(!date||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||!home||!away||!venue||!week)throw new Error(`Could not read fixture ${number} on page ${pageIndex+1}. Check the PDF table before importing.`);
   fixtures.push({number,date,home,away,venue,round:week});
  }
 }
 if(!fixtures.length)throw new Error('No fixtures found. Choose a text-based TRFA fixture PDF in the supplied table format.');
 for(let i=0;i<fixtures.length;i++)if(fixtures[i].number!==(fixtures[0].number+i))throw new Error('The fixture numbers are missing, repeated or out of order. Check the PDF before importing.');
 return fixtures;
}

export function prepareFixtureImport(rows:ImportedFixture[],content:Content,pdfTeam:string,academyTeam:string,competitionId:string){
 const competition=content.competitions?.find(c=>c.id===competitionId);
 if(!competition||!academyTeam||!pdfTeam)throw new Error('Choose the PDF team, academy team and competition first.');
 const key=(f:Pick<Fixture,'date'|'team'|'opponent'|'homeAway'|'competition'>)=>[f.date,teamKey(f.team),teamKey(f.opponent),f.homeAway,teamKey(f.competition)].join('|');
 const existing=new Set(content.fixtures.map(key));let skipped=0;
 const fixtures:Fixture[]=[];
 for(const row of rows){
  const home=teamKey(row.home)===teamKey(pdfTeam),away=teamKey(row.away)===teamKey(pdfTeam);if(!home&&!away)continue;
  const f:Fixture={id:crypto.randomUUID(),date:row.date,season:seasonForDate(row.date),time:'16:00',team:academyTeam,opponent:home?row.away:row.home,venue:row.venue,homeAway:home?'home':'away',competition:competition.name,competitionId:competition.id,round:row.round,status:'scheduled',goalsFor:null,goalsAgainst:null};
  if(existing.has(key(f))){skipped++;continue}existing.add(key(f));fixtures.push(f);
 }
 if(content.fixtures.length+fixtures.length>200)throw new Error('This import would exceed the 200-fixture limit. Remove old fixtures first.');
 const seasons=[...new Set(rows.map(r=>seasonForDate(r.date)))];
 const leagueSchedules:LeagueSchedule[]=[...(content.leagueSchedules||[]).filter(s=>s.competitionId!==competition.id||!seasons.includes(s.season)),...seasons.map(season=>({competitionId:competition.id,competition:competition.name,season,fixtures:rows.filter(r=>seasonForDate(r.date)===season).map(r=>({...r,time:'16:00'}))}))];
 if(leagueSchedules.length>20)throw new Error('The saved league schedule limit has been reached.');
 return {fixtures,skipped,leagueSchedules};
}
