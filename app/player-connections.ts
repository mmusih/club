import type {Player,PlayerData} from './player-model';
import {seasonLabel} from './seasons';
import {teamKey} from './team-branding';

type Match=PlayerData['matches'][number];
type Contribution=NonNullable<Match['contributions']>[number];
const nameKey=(name:string)=>name.trim().toLocaleLowerCase().replace(/\s+/g,' ');
const matchKey=(m:Match)=>JSON.stringify([m.date,seasonLabel(m.season),teamKey(m.opponent)]);
const count=(m:Match,kind:Contribution['kind'])=>(m.contributions||[]).filter(c=>c.kind===kind).length;
export class PlayerConnectionError extends Error {}

/** Retain teammates' match history without retaining a link to a deleted profile. */
export function detachPlayerConnections(players:Player[],id:string):Player[]{
 const deleted=players.find(p=>p.id===id);
 const uniqueName=deleted&&players.filter(p=>nameKey(p.name)===nameKey(deleted.name)).length===1;
 return players.filter(p=>p.id!==id).flatMap(p=>{
  let changed=false;
  const matches=p.matches.map(m=>({...m,contributions:m.contributions?.map(c=>{
   if(c.partnerId===id||!c.partnerId&&uniqueName&&nameKey(c.partner)===nameKey(deleted!.name)){changed=true;const next={...c,partner:'Deleted player'};delete next.partnerId;return next}
   return c;
  })}));
  return changed?[{...p,matches}]:[];
 });
}

/** Existing unnamed totals remain intact; new details count once and removals subtract once. */
export function withContributions(match:Match,contributions:Contribution[]):Match {
 const next={...match,contributions};
 for(const kind of ['goal','assist'] as const){
  const field=kind==='goal'?'goals':'assists';
  next[field]=Math.max(count(next,kind),match[field]+Math.min(0,count(next,kind)-count(match,kind)));
 }
 return next;
}

/** Synchronise both sides in memory; the caller commits every changed profile atomically. */
export function connectPlayerRecords(players:Player[],id:string,input:PlayerData):Map<string,PlayerData>{
 const previous=players.find(p=>p.id===id);
 const all=new Map<string,PlayerData>(players.map(p=>[p.id,structuredClone(p)]));
 const source=structuredClone(input);all.set(id,source);
 const sourceEventIds=new Set(source.matches.flatMap(m=>(m.contributions||[]).map(c=>c.id)));
 const before=new Map(players.map(p=>[p.id,p]));
 const resolve=(event:Contribution,ownerId:string):string|undefined=>{
  if(event.partnerId){
   if(event.partnerId===ownerId)throw new PlayerConnectionError('Choose another player as the teammate.');
   if(!all.has(event.partnerId))throw new PlayerConnectionError('A linked teammate no longer exists. Choose a saved player again.');
   return event.partnerId;
  }
  if(!event.partner.trim())return undefined;
  const matches=[...all].filter(([otherId,p])=>otherId!==ownerId&&nameKey(p.name)===nameKey(event.partner));
  if(matches.length>1)throw new PlayerConnectionError(`More than one player is named ${event.partner}. Select the teammate from the player list.`);
  return matches[0]?.[0];
 };
 // Remember the original counterpart, including legacy name-only entries.
 const targets=new Map<string,{playerId:string;matchId:string}>();
 for(const oldMatch of previous?.matches||[]){
  for(const event of oldMatch.contributions||[]){
   const partnerId=resolve(event,id);if(!partnerId)continue;
   const partner=all.get(partnerId)!;
   const exact=partner.matches.flatMap(m=>(m.contributions||[]).filter(c=>c.id===event.id).map(c=>({match:m,event:c})));
   const candidates=exact.length?exact:partner.matches.flatMap(m=>(m.contributions||[]).filter(c=>
    !sourceEventIds.has(c.id)&&matchKey(m)===matchKey(oldMatch)&&c.kind!==event.kind&&c.minute===event.minute&&(c.partnerId===id||!c.partnerId&&nameKey(c.partner)===nameKey(previous!.name))
   ).map(c=>({match:m,event:c})));
   if(candidates.length>1)throw new PlayerConnectionError('Duplicate linked contributions were found. Remove the duplicate goal / assist detail before saving.');
   const target=candidates[0];if(!target)continue;
   targets.set(event.id,{playerId:partnerId,matchId:target.match.id});
   target.match.contributions=target.match.contributions!.filter(c=>c.id!==target.event.id);
  }
 }
 for(const match of source.matches){
  const oldMatch=previous?.matches.find(m=>m.id===match.id);
  // IDs are server-owned: retain a stored link, never accept an arbitrary client link.
  match.sharedMatchId=oldMatch?.sharedMatchId||match.id;
  for(const event of match.contributions||[]){
   const partnerId=resolve(event,id);if(!partnerId){delete event.partnerId;continue}
   event.partnerId=partnerId;event.partner=all.get(partnerId)!.name;
   const partner=all.get(partnerId)!;
   const remembered=targets.get(event.id);
   let target=remembered?.playerId===partnerId?partner.matches.find(m=>m.id===remembered.matchId):undefined;
   if(!target){
    const candidates=partner.matches.filter(m=>m.sharedMatchId===match.sharedMatchId||matchKey(m)===matchKey(match));
    if(candidates.length>1)throw new PlayerConnectionError(`There are multiple match records for ${partner.name} on ${match.date}. Merge those records before linking this contribution.`);
    target=candidates[0];
   }
   if(!target){target={id:crypto.randomUUID(),sharedMatchId:match.sharedMatchId,autoLinked:true,date:match.date,season:match.season,opponent:match.opponent,minutes:0,goals:0,assists:0,saves:0,contributions:[]};partner.matches.push(target)}
   // Adopt a legacy reciprocal detail instead of adding a second copy.
   const inverse=(target.contributions||[]).filter(c=>c.id===event.id||!sourceEventIds.has(c.id)&&c.kind!==event.kind&&c.minute===event.minute&&(c.partnerId===id||!c.partnerId&&[source.name,previous?.name||''].some(n=>nameKey(c.partner)===nameKey(n))));
   if(inverse.length>1)throw new PlayerConnectionError(`Duplicate goal / assist details exist for ${partner.name}. Remove the duplicate before saving.`);
   target.contributions=(target.contributions||[]).filter(c=>!inverse.includes(c));
   target.contributions.push({id:event.id,kind:event.kind==='goal'?'assist':'goal',minute:event.minute,partnerId:id,partner:source.name});
   const oldGroup=target.sharedMatchId;
   for(const p of all.values())for(const m of p.matches){
    if(m===target||oldGroup&&m.sharedMatchId===oldGroup){m.sharedMatchId=match.sharedMatchId}
   }
  }
  // A date, season or opponent correction belongs to every linked copy of this match.
  for(const p of all.values())for(const m of p.matches){
   if(m.sharedMatchId===match.sharedMatchId){m.date=match.date;m.season=match.season;m.opponent=match.opponent}
  }
 }
 for(const [playerId,p] of all){
  for(const m of p.matches){
   for(const c of m.contributions||[]){
    if(c.partnerId===id||!c.partnerId&&previous&&nameKey(c.partner)===nameKey(previous.name)&&players.filter(other=>nameKey(other.name)===nameKey(previous.name)).length===1){c.partnerId=id;c.partner=source.name}
   }
   if(playerId!==id){
    const old=before.get(playerId)?.matches.find(row=>row.id===m.id);
    const adjusted=withContributions(old||{...m,contributions:[]},m.contributions||[]);
    m.goals=adjusted.goals;m.assists=adjusted.assists;
   }
  }
  p.matches=p.matches.filter(m=>!m.autoLinked||!!m.contributions?.length||m.minutes+m.goals+m.assists+m.saves+(m.yellowCards||0)+(m.redCards||0)+(m.injuries||0)>0);
 }
 const changed=new Map<string,PlayerData>([[id,source]]);
 for(const [playerId,p] of all)if(playerId!==id&&JSON.stringify(p)!==JSON.stringify(before.get(playerId)))changed.set(playerId,p);
 return changed;
}
