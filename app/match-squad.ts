import type {Content,Fixture,MatchRecord} from './content';
import type {Player} from './player-model';
import {fixtureTeamName} from './lineup';
import {eligibilityIssue} from './player-eligibility';
import {playerTeam} from './player-teams';

/** Search and the cross-team picker never change the automatic team roster. */
export function teamSquad(content:Content,fixture:Fixture,players:Player[]) {
 return players.filter(p=>!eligibilityIssue(p)&&fixtureTeamName(content,playerTeam(p))===fixtureTeamName(content,fixture.team));
}
export function automaticBench(match:MatchRecord,roster:Pick<Player,'id'>[]):MatchRecord {
 if(match.phase!=='pre')return match;
 const bench=[...new Set([...roster.map(p=>p.id),...match.bench])].filter(id=>!match.slots.includes(id));
 return {...match,bench};
}
