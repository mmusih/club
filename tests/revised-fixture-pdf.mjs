import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}}});
const {parseFixturePages,prepareFixtureImport,trfaCompetition}=await import('../app/fixture-import.ts');
const {seed}=await import('../app/content.ts');
const {contentSchema}=await import('../app/validation.ts');
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
if(!process.argv[2])throw new Error('Pass the revised TRFA WEST STREAM FIXTURES.pdf path.');
const task=getDocument({data:new Uint8Array(readFileSync(process.argv[2])),useSystemFonts:true,isEvalSupported:false});
let rows;
try{
 const pdf=await task.promise,pages=[];
 for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);pages.push({width:page.getViewport({scale:1}).width,items:(await page.getTextContent()).items.filter(t=>'str' in t)})}
 rows=parseFixturePages(pages);
}finally{await task.destroy()}
assert.equal(rows.length,132);
assert.equal(rows[0].date,'2026-10-31');
assert.equal(rows.at(-1).date,'2027-04-10');
assert.ok(rows.every(r=>r.time==='16:00'&&!/HRS/.test(r.venue)));
assert.equal(rows[4].venue,'LAMASIA GROUND');
assert.equal(rows[53].venue,'T.B.C');
const content={...seed,competitions:[{id:'trfa',name:trfaCompetition,kind:'league'}]};
const result=prepareFixtureImport(rows,content,seed.name,'Boys’ Senior Team','trfa');
assert.equal(result.fixtures.length,22);
assert.equal(result.fixtures.filter(f=>f.homeAway==='home').length,11);
assert.equal(result.fixtures.filter(f=>f.homeAway==='away').length,11);
assert.equal(contentSchema.safeParse({...content,fixtures:result.fixtures,leagueSchedules:result.leagueSchedules}).success,true);
const changedTime=prepareFixtureImport([{...rows[4],time:'15:30'}],content,seed.name,'Boys’ Senior Team','trfa');
assert.equal(changedTime.fixtures[0].time,'15:30');
assert.equal(changedTime.leagueSchedules[0].fixtures[0].time,'15:30');
// Preserve source inconsistencies for review; do not invent corrected dates.
assert.equal(rows[108].date,rows[96].date);
assert.equal(rows[114].date,rows[102].date);
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify({source:'TRFA WEST STREAM FIXTURES.pdf',warnings:['Weeks 17 and 19 both use 2027-03-13.','Weeks 18 and 20 both use 2027-03-21.'],fixtures:rows},null,2)+'\n');
console.log('PASS: 132 revised fixtures, 22 academy matches, dates, venues, kick-off times and schema.');
