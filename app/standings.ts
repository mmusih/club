import type {Standing} from './content';
import {seasonLabel} from './seasons';

/** Rank each table independently; all-zero tables naturally sort alphabetically. */
export function rankStandings(rows:Standing[]):Standing[] {
 const tables=new Map<string,Standing[]>();
 for(const row of rows){
  const key=JSON.stringify([seasonLabel(row.season),row.competition.trim().toLowerCase(),row.group.trim().toLowerCase()]);
  const table=tables.get(key)||[];
  table.push(row);tables.set(key,table);
 }
 return [...tables.values()].flatMap(table=>[...table].sort((a,b)=>
  b.points-a.points||
  (b.goalsFor-b.goalsAgainst)-(a.goalsFor-a.goalsAgainst)||
  b.goalsFor-a.goalsFor||
  a.club.localeCompare(b.club,'en',{sensitivity:'base'})||a.id.localeCompare(b.id)
 ).map((row,index)=>({...row,position:index+1})));
}
