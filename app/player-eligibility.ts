/** Use the club's local date so birthdays change eligibility consistently. */
export function clubToday(now=new Date()):string {
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Gaborone',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=(type:string)=>parts.find(p=>p.type===type)!.value;
 return `${part('year')}-${part('month')}-${part('day')}`;
}
export function ageToday(dateOfBirth:string,today=clubToday()):number|null {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth))return null;
 const parsed=new Date(dateOfBirth+'T12:00:00Z');
 if(Number.isNaN(parsed.valueOf())||parsed.toISOString().slice(0,10)!==dateOfBirth||dateOfBirth>today)return null;
 return Number(today.slice(0,4))-Number(dateOfBirth.slice(0,4))-(today.slice(5)<dateOfBirth.slice(5)?1:0);
}
export function divisionMaximum(ageGroup:string):number|null {
 const match=ageGroup.match(/\b(?:under[\s-]*|u[\s-]*)(\d{1,2})\b/i);
 return match?Number(match[1])-2:null;
}
export function eligibilityIssue(player:{ageGroup:string;dateOfBirth?:string},today=clubToday()):string|null {
 const maximum=divisionMaximum(player.ageGroup);
 const age=player.dateOfBirth?ageToday(player.dateOfBirth,today):null;
 if(player.dateOfBirth&&age===null)return 'Enter a valid birth date that is not in the future.';
 if(maximum===null)return null;
 if(age===null)return `Add a private birth date to check eligibility for ${player.ageGroup}. Players must be ${maximum} or younger today.`;
 return age>maximum?`${player.ageGroup} allows players aged ${maximum} or younger today. This player is ${age}; choose an eligible division.`:null;
}
