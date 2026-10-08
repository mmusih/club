import assert from 'node:assert/strict';
import {lineupAvailable,publicContent,fixtureTeamName,fixtureTeams} from '../app/lineup.ts';
const fixture={id:'one',date:'2026-10-10',time:'15:00',status:'scheduled',team:'Under 13',lineup:{formation:'2-3-1',starters:['1 Keeper','2 A','3 B','4 C','5 D','6 E','7 F'],substitutes:[]}};
const release=Date.parse('2026-10-10T12:00:00Z');
assert.equal(lineupAvailable(fixture,release-1),false);
assert.equal(lineupAvailable(fixture,release),true);
assert.equal(lineupAvailable(fixture,release+3600000),true);
for(const patch of [{time:''},{status:'cancelled'},{status:'postponed'},{date:'invalid'}])assert.equal(lineupAvailable({...fixture,...patch},release),false);
const content={programmes:[{name:'Under 17'},{name:'Under 13'},{name:'Girls’ Team'}],fixtures:[fixture]};
assert.equal('lineup' in publicContent(content,release-1).fixtures[0],false);
assert.deepEqual(publicContent(content,release).fixtures[0].lineup,fixture.lineup);
assert.ok(content.fixtures[0].lineup,'Public filtering must not remove the stored lineup');
assert.deepEqual(fixtureTeams(content),['Girls’ Team','Under 13','Under 17']);
console.log('PASS: CAT release boundary, missing times, cancellations, postponements, public data redaction, and all academy teams.');

const legacy={programmes:[{name:'Boys’ Under 13',ages:'Under 13'},{name:'Girls’ Team',ages:'Over 15'}],fixtures:[{team:'Under 13'},{team:'U13'}]};
assert.equal(fixtureTeamName(legacy,'U13'),'Boys’ Under 13');
assert.deepEqual(fixtureTeams(legacy),['Boys’ Under 13','Girls’ Team']);
assert.equal(fixtureTeamName({...legacy,programmes:[...legacy.programmes,{name:'Girls’ Under 13',ages:'Under 13'}]},'Under 13'),'Under 13','Ambiguous age groups must not be merged');
