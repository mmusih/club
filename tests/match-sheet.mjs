import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}}});
const {seed}=await import('../app/content.ts');
const {newPlayer,playerSchema,publicPlayer}=await import('../app/player-model.ts');
const {ageToday}=await import('../app/player-eligibility.ts');
const {automaticBench,teamSquad}=await import('../app/match-squad.ts');
const {snapshotMatchPlayers,matchSheetRows}=await import('../app/match-sheet.ts');
const {createMatchSheetPdf}=await import('../app/match-sheet-pdf.ts');
const {fixtureSchema}=await import('../app/validation.ts');
const {publicContent}=await import('../app/lineup.ts');
const {detachPlayer}=await import('../app/player-deletion.ts');
const players=Array.from({length:20},(_,i)=>({...newPlayer(),name:'Example Player '+(i+1),ageGroup:'Senior',team:'Senior A',number:i+1,maId:'00'+(1000+i)+'M01',dateOfBirth:'2000-10-30'}));
const fixture={id:'sheet-test',date:'2026-10-29',time:'15:00',team:'Senior A',opponent:'Example United',competition:'Regional Football League',venue:'Example Ground',homeAway:'home',status:'played',goalsFor:2,goalsAgainst:1,lineup:{formation:'4-3-3',starters:players.slice(0,11).map(p=>p.name),substitutes:[]},match:{phase:'pre',minute:0,duration:90,slots:players.slice(0,11).map(p=>p.id),bench:[],events:[]},referee:'Example Referee',sheet:{association:'TSWAPONG REGIONAL FOOTBALL ASSOCIATION',halfTimeFor:1,halfTimeAgainst:0,teamColors:'Navy / white',opponentColors:'Red / black',headCoach:'Example Coach',captainId:players[2].id,tactics:'Build from the back. Press together.',remarks:'Example data for layout verification.'}};
const squad=teamSquad(seed,fixture,[...players,{...players[0],id:'other',team:'Senior B'},{...players[0],id:'ineligible',ageGroup:'Under 13'}]);
assert.equal(squad.length,20);
const auto=automaticBench(fixture.match,squad);
assert.deepEqual(auto.bench,players.slice(11).map(p=>p.id));
assert.equal(fixture.match.bench.length,0);
const replaced=automaticBench({...auto,slots:auto.slots.map((id,i)=>i===1?auto.bench[0]:id)},squad);
assert.ok(replaced.bench.includes(auto.slots[1]));assert.ok(!replaced.bench.includes(auto.bench[0]));
const vacated=automaticBench({...auto,slots:auto.slots.map((id,i)=>i===1?'':id)},squad);
assert.equal(vacated.bench.length,10);
assert.deepEqual(automaticBench({...auto,phase:'live'},[...squad,{id:'late'}]).bench,auto.bench);
assert.equal(automaticBench({...auto,slots:['']},Array.from({length:30},(_,i)=>({id:String(i)}))).bench.length,39,'No silent bench truncation');
const [a,b,c]=players.map(p=>p.id),sub=players[11].id;
fixture.match={...auto,phase:'finished',minute:95,period:'second',firstHalfAdded:2,secondHalfAdded:3,events:[
 {id:'g1',kind:'goal',playerId:a,minute:20,period:'first'},
 {id:'s',kind:'substitution',playerId:b,replacementId:sub,minute:60,period:'second'},
 {id:'y1',kind:'yellow',playerId:c,minute:25,period:'first'},
 {id:'y2',kind:'yellow',playerId:c,minute:75,period:'second'},
 {id:'g2',kind:'goal',playerId:sub,minute:94,period:'second'},
]};
let content=snapshotMatchPlayers({...seed,fixtures:[fixture]},seed,players);
assert.equal(fixtureSchema.safeParse(content.fixtures[0]).success,true);
const captured=content.fixtures[0];
players[0].name='Changed after match';players[0].maId='CHANGED';
content=snapshotMatchPlayers(content,content,players);
assert.equal(content.fixtures[0].match.roster[a].name,'Example Player 1');
assert.equal(content.fixtures[0].match.roster[a].maId,'001000M01');
const rows=matchSheetRows(captured,players);
assert.equal(rows.starters[1].out,"58'");assert.equal(rows.substitutes[0].in,"58'");
assert.equal(rows.substitutes[0].goals,"90+2'");assert.equal(rows.starters[2].red,"73' (2YC)");
assert.equal(rows.starters[1].name,'Example Player 2','Original starters survive substitutions');
const visible=publicContent(content).fixtures[0];assert.equal(visible.match,undefined);assert.equal(visible.sheet,undefined);
const pub=publicPlayer(players[0]);assert.equal(pub.age,ageToday(players[0].dateOfBirth));for(const key of ['dateOfBirth','maId','consent'])assert.equal(key in pub,false);
assert.equal(playerSchema.parse(players[1]).maId,'001001M01');assert.equal(playerSchema.safeParse({...players[1],maId:'x'.repeat(41)}).success,false);
const deleted=detachPlayer(content,a,players[0]);assert.equal(deleted.fixtures[0].match.roster[a],undefined);
assert.equal(matchSheetRows(deleted.fixtures[0],players).starters[0].name,'Deleted player');
await mkdir('outputs/match-sheet-qa',{recursive:true});
const normal=await createMatchSheetPdf(captured,seed,players);
await writeFile('outputs/match-sheet-qa/standard.pdf',normal);
const overflow={...captured,sheet:{...captured.sheet,remarks:'Long official remarks. '.repeat(130),tactics:'Long tactical approach. '.repeat(70)},match:{...captured.match,bench:[...captured.match.bench,...Array.from({length:30},(_,i)=>'extra-'+i)]}};
await writeFile('outputs/match-sheet-qa/overflow.pdf',await createMatchSheetPdf(overflow,seed,players));
await writeFile('outputs/match-sheet-qa/legacy.pdf',await createMatchSheetPdf({...fixture,match:undefined,lineup:undefined},seed,[]));
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
const task=getDocument({data:normal,useSystemFonts:true});
const doc=await task.promise;
assert.equal(doc.numPages,1,'A standard 20-player match sheet fits on A4');
const page=await doc.getPage(1),text=(await page.getTextContent()).items.filter(i=>'str' in i).map(i=>i.str).join(' ');
for(const value of ['Example Player 1','001000M01','SUBSTITUTES','TEAM TACTICS','SIGNATURES','MATCH OFFICIAL REMARKS'])assert.ok(text.includes(value),value);
await task.destroy();
console.log('PASS: automatic team substitutes, replacement/removal, frozen live squads, MA IDs, public ages/privacy, historical snapshots, deletion, event timings and one-page PDF content.');
