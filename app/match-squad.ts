import type {Content,Fixture,MatchRecord} from './content';
import type {Player} from './player-model';
import {fixtureTeamName} from './lineup';
import {eligibilityIssue} from './player-eligibility';
import {playerTeam} from './player-teams';

/** Search and the cross-team picker never change the automatic team roster. */
export function teamSquad(content:Content,fixture:Fixture,players:Player[]) {
 return players.filter(p=>!eligibilityIssue(p)&&fixtureTeamName(content,playerTeam(p))===fixtureTeamName(content,fixture.team));
}
/** Only an explicitly chosen limit restricts the bench. Unselected players stay in the pool. */
export function substituteLimit(match:MatchRecord){return match.substituteLimit;}
export function squadIssue(match:MatchRecord){
 if(match.substituteLimit!==undefined&&match.bench.length>match.substituteLimit)return `Choose at most ${substituteLimit(match)} substitutes. Remove extra players from the bench.`;
 const ids=[...match.slots.filter(Boolean),...match.bench];
 return new Set(ids).size!==ids.length?'A player can only occupy one squad place.':null;
}
