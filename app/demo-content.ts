import {seed,type Content} from './content';
const demoId=(id:string)=>/^(demo|sample)-/i.test(id);
const demoLabel=(name:string)=>/\b(demo|sample|fictional)\b/i.test(name);
/** Remove labelled examples from every collection, including their shared references. */
export function removeDemoContent(c:Content):Content {
 const keep=<T extends {id:string}>(rows:T[])=>rows.filter(r=>!demoId(r.id));
 const removedPhotos=new Set(c.photos.filter(p=>demoId(p.id)).map(p=>p.url));
 const cleanImage=(url:string)=>removedPhotos.has(url)||/^\/images\/players\/demo-/.test(url)?'':url;
 const competitions=c.competitions?.filter(v=>!demoId(v.id)&&!demoLabel(v.name));
 const demoCompetitions=new Set(c.competitions?.filter(v=>demoId(v.id)||demoLabel(v.name)).map(v=>v.id));
 const fixtures=keep(c.fixtures).filter(f=>!demoCompetitions.has(f.competitionId||'')&&!demoLabel(f.competition)&&!demoLabel(f.opponent));
 return {...c,demoPlayerIds:[],news:keep(c.news).map(n=>({...n,image:cleanImage(n.image||'')})),fixtures:fixtures.map(f=>({...f,teamLogo:cleanImage(f.teamLogo||''),opponentLogo:cleanImage(f.opponentLogo||''),...(f.lineup?{lineup:{...f.lineup,image:cleanImage(f.lineup.image||''),portraits:Object.fromEntries(Object.entries(f.lineup.portraits||{}).filter(([,url])=>!!cleanImage(url)))}}:{})})),staff:keep(c.staff).map(v=>({...v,photo:cleanImage(v.photo)})),standings:keep(c.standings).map(v=>({...v,logo:cleanImage(v.logo||'')})),honours:keep(c.honours).map(v=>({...v,photo:cleanImage(v.photo)})),programmes:keep(c.programmes).map(v=>({...v,photo:cleanImage(v.photo||'')})),photos:keep(c.photos),supporters:keep(c.supporters||[]).filter(v=>v.kind!=='photo'||!!cleanImage(v.url)),competitions,
 leagueSchedules:c.leagueSchedules?.filter(s=>!demoCompetitions.has(s.competitionId)&&!demoId(s.competitionId)&&!demoLabel(s.competition)).map(s=>({...s,fixtures:s.fixtures.filter(f=>!demoLabel(f.home)&&!demoLabel(f.away))})),
 teamLogos:c.teamLogos?.filter(t=>!demoLabel(t.name)).map(t=>({...t,logo:cleanImage(t.logo)})),hero:cleanImage(c.hero)||seed.hero,logo:c.logo&&!cleanImage(c.logo)?seed.logo:c.logo};
}
export function demoContentCount(c:Content){const cleaned=removeDemoContent(c);return (c.demoPlayerIds||[]).length+(['news','fixtures','staff','standings','honours','programmes','photos','supporters','competitions','leagueSchedules','teamLogos'] as const).reduce((total,key)=>total+(c[key]?.length||0)-(cleaned[key]?.length||0),0)+(c.leagueSchedules||[]).reduce((total,s)=>total+s.fixtures.length-(cleaned.leagueSchedules?.find(v=>v.competitionId===s.competitionId&&v.season===s.season)?.fixtures.length||0),0);}
