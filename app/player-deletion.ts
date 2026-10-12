import type {Content} from './content';
import type {PlayerData} from './player-model';

export const isDeletedPlayer=(id:string)=>/^deleted:[0-9a-f-]{36}$/i.test(id);
/** Keep match history replayable without retaining a link to a deleted profile. */
export function detachPlayer(content:Content,id:string,player:PlayerData):Content{
 const labels=new Set([player.name,`${player.number||''} ${player.name}`.trim()]);
 return {...content,fixtures:content.fixtures.map(f=>{
  if(!f.match||![...f.match.slots,...f.match.bench].includes(id))return f;
  const pre=f.match.phase==='pre',replacement='deleted:'+id;
  return {...f,match:{...f.match,slots:f.match.slots.map(p=>p===id?(pre?'':replacement):p),bench:pre?f.match.bench.filter(p=>p!==id):f.match.bench.map(p=>p===id?replacement:p),events:f.match.events.map(e=>({...e,playerId:e.playerId===id?replacement:e.playerId,...(e.replacementId===id?{replacementId:replacement}:{})}))},
   ...(f.lineup?{lineup:{...f.lineup,starters:f.lineup.starters.map(p=>labels.has(p)?(pre?'Vacant position':'Deleted player'):p),substitutes:f.lineup.substitutes.flatMap(p=>labels.has(p)?(pre?[]:['Deleted player']):[p]),portraits:Object.fromEntries(Object.entries(f.lineup.portraits||{}).filter(([name])=>!labels.has(name)))}}:{})};
 })};
}
