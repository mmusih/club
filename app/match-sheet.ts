import type {Content,Fixture,MatchPlayer} from './content';
import type {Player} from './player-model';
import {isDeletedPlayer} from './player-deletion';
import {formatMatchMinute,matchLimits} from './lineup';
import {ageToday} from './player-eligibility';

/** Freeze identity at the first published match action; later profile edits do not rewrite history. */
export function snapshotMatchPlayers(content:Content,previous:Content,players:Player[]):Content {
 const byId=new Map(players.map(p=>[p.id,p]));
 return {...content,fixtures:content.fixtures.map(f=>{
  if(!f.match)return f;
  const match=f.match;
  const old=previous.fixtures.find(row=>row.id===f.id)?.match;
  const roster:Record<string,MatchPlayer>={};
  for(const id of [...match.slots,...match.bench].filter(Boolean)){
   if(isDeletedPlayer(id))continue;
   const frozen=old?.phase!=='pre'?old?.roster?.[id]:undefined;
   const p=byId.get(id);
   if(frozen)roster[id]=frozen;
   else if(p)roster[id]={name:p.name,number:p.number,maId:p.maId||'',age:ageToday(p.dateOfBirth||'',f.date)};
  }
  const label=(id:string)=>{const p=byId.get(id);return p?`${p.number||''} ${p.name}`.trim():'Unavailable player'};
  const current=match.slots;
  const portraits=Object.fromEntries(players.filter(p=>p.headshot&&[...match.slots,...match.bench].includes(p.id)).map(p=>[label(p.id),p.headshot!]));
  return {...f,match:{...match,roster},...(f.lineup?{lineup:{...f.lineup,starters:current.map(id=>id?label(id):'Vacant position'),substitutes:match.bench.map(label),portraits}}:{})};
 })};
}

export type SheetRow=MatchPlayer & {id:string;in:string;out:string;yellow:string;red:string;goals:string};
export function matchSheetRows(f:Fixture,players:Player[]) {
 const m=f.match;
 const row=(id:string,index:number,substitute:boolean):SheetRow=>{
  const p=players.find(p=>p.id===id);
  const legacy=(substitute?f.lineup?.substitutes:f.lineup?.starters)?.[index]||'';
  const jersey=legacy.match(/^(\d{1,2})[.\s-]+/);
  const identity=isDeletedPlayer(id)?{name:'Deleted player',number:'' as const,maId:''}:m?.roster?.[id]||(p?{name:p.name,number:p.number,maId:p.maId||'',age:ageToday(p.dateOfBirth||'',f.date)}:{name:m?'':legacy||'',number:!m&&jersey?Number(jersey[1]):'' as const,maId:''});
  if(!m&&!isDeletedPlayer(id)&&jersey)identity.name=legacy.slice(jersey[0].length);
  const events=[...(m?.events||[])].sort((a,b)=>a.minute-b.minute);
  const time=(e:typeof events[number])=>formatMatchMinute(m!,e.minute,e.period||(e.minute<=matchLimits(m!).halfEnd?'first':'second')).replace('′',"'");
  const times=(kind:string)=>events.filter(e=>e.playerId===id&&e.kind===kind).map(time).join(', ');
  const yellows=events.filter(e=>e.playerId===id&&e.kind==='yellow');
  return {...identity,age:identity.age??(p&&!isDeletedPlayer(id)?ageToday(p.dateOfBirth||'',f.date):null),id,in:events.filter(e=>e.kind==='substitution'&&e.replacementId===id).map(time).join(', '),out:times('substitution'),yellow:times('yellow'),red:[times('red'),yellows.length>=2?time(yellows[1])+' (2YC)':''].filter(Boolean).join(', '),goals:times('goal')};
 };
 return {
  starters:(m?m.slots:f.lineup?.starters.map((_,i)=>'legacy-starter-'+i)||[]).map((id,i)=>row(id,i,false)),
  substitutes:(m?m.bench:f.lineup?.substitutes.map((_,i)=>'legacy-sub-'+i)||[]).map((id,i)=>row(id,i,true)),
 };
}
