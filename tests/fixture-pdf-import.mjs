import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}}});
const {parseFixturePages,prepareFixtureImport,trfaCompetition}=await import('../app/fixture-import.ts');
const {seed}=await import('../app/content.ts');
const {contentSchema}=await import('../app/validation.ts');
const item=(str,x,y,width=30)=>({str,transform:[10,0,0,10,x,y],width});
const page={width:792,items:[item('HOME',303,550),item('AWAY',470,550),item('VENUE',626,550),item('WEEK 1',77,530),item('1',80,510,5),item('17/10/2026',106,510,49),item('SATURDAY',175,510,45),item(seed.name,260,510,120),item('LETS FC',465,510,40),item('LAMASIA GROUND',605,510,80)]};
const sample=parseFixturePages([page]);assert.equal(sample[0].home,seed.name);assert.equal(sample[0].venue,'LAMASIA GROUND');
assert.throws(()=>parseFixturePages([{...page,items:page.items.filter(t=>t.str!=='HOME')}]),/columns/);
assert.throws(()=>parseFixturePages([{...page,items:page.items.map(t=>t.str==='17/10/2026'?{...t,str:'31/02/2026'}:t)}]),/Could not read fixture/);
const content={...seed,competitions:[{id:'trfa',name:trfaCompetition,kind:'league'}]};
let rows=sample;
if(process.argv[2]){
 const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
 const task=getDocument({data:new Uint8Array(readFileSync(process.argv[2])),useSystemFonts:true,isEvalSupported:false});
 try{const pdf=await task.promise,pages=[];for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);pages.push({width:page.getViewport({scale:1}).width,items:(await page.getTextContent()).items.filter(t=>'str' in t)})}rows=parseFixturePages(pages)}finally{await task.destroy()}
 assert.equal(rows.length,132);assert.equal(rows.at(-1).number,132);assert.equal(rows.at(-1).date,'2027-04-04');
 assert.equal(rows[89].venue,'MOTLAKA','Preserve source wording rather than invent a venue');
}
const first=prepareFixtureImport(rows,content,seed.name,'Boys’ Senior Team','trfa');
assert.equal(first.fixtures.length,process.argv[2]?22:1);assert.ok(first.fixtures.every(f=>f.time==='16:00'&&f.goalsFor===null));
if(process.argv[2]){assert.equal(first.fixtures.filter(f=>f.homeAway==='home').length,11);assert.equal(first.fixtures.filter(f=>f.homeAway==='away').length,11);assert.equal(first.fixtures.at(-1).date,'2027-04-04')}
const updated={...content,fixtures:first.fixtures,leagueSchedules:first.leagueSchedules};assert.equal(contentSchema.safeParse(updated).success,true);
assert.equal(first.leagueSchedules.length,1);
assert.equal(first.leagueSchedules[0].fixtures.length,rows.length,'Retain every league match, not only the academy matches');
assert.ok(first.leagueSchedules[0].fixtures.every(f=>f.time==='16:00'));
const {publicContent}=await import('../app/lineup.ts');
assert.deepEqual(publicContent(contentSchema.parse(updated)).leagueSchedules,first.leagueSchedules,'Full schedule survives validation and public read-back');
const second=prepareFixtureImport(rows,updated,seed.name,'Boys’ Senior Team','trfa');assert.equal(second.fixtures.length,0);assert.equal(second.skipped,first.fixtures.length);
assert.equal(second.leagueSchedules.length,1,'Re-import replaces the schedule instead of appending a duplicate');
assert.equal(second.leagueSchedules[0].fixtures.length,rows.length);
const revised=prepareFixtureImport(rows.map((r,i)=>i===0?{...r,venue:'Updated ground'}:r),updated,seed.name,'Boys’ Senior Team','trfa');
assert.equal(revised.leagueSchedules[0].fixtures[0].venue,'Updated ground');
const historical={...first.leagueSchedules[0],season:'2025/26'};
const otherLeague={...first.leagueSchedules[0],competitionId:'other',competition:'Other league'};
assert.equal(prepareFixtureImport(rows,{...updated,leagueSchedules:[historical,otherLeague,...first.leagueSchedules]},seed.name,'Boys’ Senior Team','trfa').leagueSchedules.length,3,'Keep other seasons and competitions');
assert.equal(contentSchema.safeParse({...updated,leagueSchedules:[{...first.leagueSchedules[0],fixtures:[{...rows[0],time:'25:00'}]}]}).success,false);
assert.equal(contentSchema.safeParse({...updated,leagueSchedules:[first.leagueSchedules[0],first.leagueSchedules[0]]}).success,false);
const existing={...first.fixtures[0],status:'played',goalsFor:3,goalsAgainst:1};
const preserved=prepareFixtureImport(rows,{...content,fixtures:[existing]},seed.name,'Boys’ Senior Team','trfa');assert.equal(preserved.skipped,1);assert.equal(existing.goalsFor,3);
assert.throws(()=>prepareFixtureImport(rows,content,seed.name,'Boys’ Senior Team','missing'),/Choose/);
console.log('PASS: PDF columns, invalid dates, all supplied pages, academy filtering, home/away, 16:00 default kick-off, schema validation and duplicate protection.');
