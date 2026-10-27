type TeamPlayer={id:string;name:string;ageGroup:string;team?:string};
export function playerTeam(player:Pick<TeamPlayer,'ageGroup'|'team'>){return player.team?.trim()||player.ageGroup.trim()||'Unassigned';}
const compare=(a:string,b:string)=>a.localeCompare(b,'en',{numeric:true,sensitivity:'base'});
export function sortPlayersByTeam<T extends TeamPlayer>(players:T[]):T[]{
 return [...players].sort((a,b)=>compare(playerTeam(a),playerTeam(b))||compare(a.name,b.name)||compare(a.id,b.id));
}
export function groupPlayersByTeam<T extends TeamPlayer>(players:T[]){
 const groups=new Map<string,{team:string;players:T[]}>();
 for(const player of sortPlayersByTeam(players)){
  const team=playerTeam(player),key=team.toLowerCase();
  const group=groups.get(key)||{team,players:[]};
  group.players.push(player);groups.set(key,group);
 }
 return [...groups.values()];
}
