/** Seasons are identified by their starting year. Legacy year-only records stay in that season. */
export function seasonLabel(value:string):string {
 const match=value.match(/^(\d{4})(?:[/-](\d{2}|\d{4}))?$/);
 if(!match)return value;
 return `${match[1]}/${String(Number(match[1])+1).slice(-2)}`;
}
export function seasonForDate(date:string):string {
 const year=Number(date.slice(0,4)),month=Number(date.slice(5,7));
 return seasonLabel(String(month>=7?year:year-1));
}
export function seasonOptions(values:string[]=[]):string[] {
 const current=Number(seasonForDate(new Date().toISOString().slice(0,10)).slice(0,4));
 return [...new Set([...Array.from({length:4},(_,i)=>seasonLabel(String(current-i))),...values.map(seasonLabel)])].sort().reverse();
}
