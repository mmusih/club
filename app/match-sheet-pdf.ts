import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import type {Content,Fixture} from './content';
import type {Player} from './player-model';
import {matchSheetRows,type SheetRow} from './match-sheet';
import {formationSlots} from './match-record';
import {seasonForDate} from './seasons';
import {matchLimits} from './lineup';

/** A4 association-style sheet. Long squads, names and remarks continue onto extra pages. */
export async function createMatchSheetPdf(f:Fixture,content:Content,players:Player[]){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 pdf.setTitle(`Match sheet - ${f.team} vs ${f.opponent} - ${f.date}`);
 pdf.setAuthor(content.name);
 const width=535,left=30,pageHeight=841.89,ink=rgb(.12,.17,.2),line=rgb(.55,.6,.62),shade=rgb(.92,.95,.95);
 let page=pdf.addPage([595.28,pageHeight]),y=30;
 // The association form uses Latin text; normalize punctuation unsupported by the PDF base font.
 const clean=(value:unknown)=>String(value??'').replace(/[\r\n\t]+/g,' ').replace(/[′’‘]/g,"'").replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/…/g,'...').split('').map(c=>{try{font.encodeText(c);return c}catch{return '?'}}).join('');
 function text(value:unknown,x:number,top:number,size=8,strong=false){page.drawText(clean(value),{x,y:pageHeight-top-size,size,font:strong?bold:font,color:ink})}
 function rect(x:number,top:number,w:number,h:number,fill=false){page.drawRectangle({x,y:pageHeight-top-h,width:w,height:h,borderWidth:.5,borderColor:line,...(fill?{color:shade}:{})})}
 function wrap(value:unknown,w:number,size=8){
  const lines:string[]=[];let current='';
  for(const word of clean(value).split(/\s+/)){
   const next=current?current+' '+word:word;
   if(font.widthOfTextAtSize(next,size)<=w){current=next;continue}
   if(current)lines.push(current);current='';
   for(const char of word){if(font.widthOfTextAtSize(current+char,size)>w){lines.push(current);current=''}current+=char}
  }
  if(current||!lines.length)lines.push(current);return lines;
 }
 function header(continued=false){
  for(const row of wrap(f.sheet?.association||f.competition||'FOOTBALL MATCH RECORD',width,12)){text(row,left,y,12,true);y+=18}
  text(`${f.season||seasonForDate(f.date)}  |  MATCH SHEET${continued?' - CONTINUED':''}`,left,y,10,true);y+=17;
  for(const row of wrap(`${content.name} - ${f.team} vs ${f.opponent}`,width,9)){text(row,left,y,9);y+=12}
  y+=8;
 }
 function ensure(height:number){if(y+height>802){page=pdf.addPage([595.28,pageHeight]);y=30;header(true)}}
 function section(title:string){ensure(25);rect(left,y,width,16,true);text(title,left+5,y+3,8,true);y+=16}
 function cells(values:string[],widths:number[],options:{strong?:boolean;fill?:boolean;min?:number}={}){
  const rows=values.map((v,i)=>wrap(v,widths[i]-8,7.5)),h=Math.max(options.min||14,...rows.map(r=>r.length*9+4));
  ensure(h);let x=left;
  values.forEach((_,i)=>{rect(x,y,widths[i],h,options.fill);rows[i].forEach((v,j)=>text(v,x+4,y+3+j*9,7.5,options.strong));x+=widths[i]});y+=h;
 }
 function paragraph(value:string){for(const row of wrap(value,width-10)){ensure(12);text(row,left+5,y+2);y+=12}}
 header();
 const sheet=f.sheet||{},blank=(v:unknown)=>v===undefined||v===null?'':String(v);
 cells([`TEAM: ${content.name} (${f.team})`],[width]);
 cells([`Date: ${f.date}`,`Start time: ${f.time} CAT`,`Second half: ${sheet.secondHalfStart||''}`,`Full time: ${sheet.fullTime||''}`],[135,135,135,130]);
 cells([`Venue: ${f.venue}`,`Competition / round: ${f.competition} ${f.round||''}`],[267.5,267.5]);
 const away=f.homeAway==='away';
 cells(['Teams','Colours','HT','FT','Penalties'],[240,115,60,60,60],{strong:true,fill:true});
 const trackedGoals=f.match?.events.filter(e=>e.kind==='goal');
 const trackedHalfTime=f.match&&f.match.phase!=='pre'&&f.scoreMode!=='manual'&&trackedGoals?.length===f.goalsFor
  ?trackedGoals.filter(e=>e.period?e.period==='first':e.minute<=matchLimits(f.match!).halfEnd).length:null;
 const academy=[content.name,sheet.teamColors||'',blank(sheet.halfTimeFor??trackedHalfTime),blank(f.goalsFor),blank(sheet.penaltiesFor)];
 const opponent=[f.opponent,sheet.opponentColors||'',blank(sheet.halfTimeAgainst),blank(f.goalsAgainst),blank(sheet.penaltiesAgainst)];
 cells(['Team A: '+(away?opponent[0]:academy[0]),...(away?opponent:academy).slice(1)],[240,115,60,60,60]);
 cells(['Team B: '+(away?academy[0]:opponent[0]),...(away?academy:opponent).slice(1)],[240,115,60,60,60]);
 const rows=matchSheetRows(f,players),columns=[22,30,174,77,49,49,42,43,49];
 function tableHead(){cells(['No.','Jersey','Player name and surname','MA ID','Sub in','Sub out','YC time','RC time','Goals'],columns,{strong:true,fill:true})}
 let number=0;
 function squad(title:string,entries:SheetRow[],minimum:number){
  ensure(55);section(title);tableHead();
  const padded=[...entries,...Array.from({length:Math.max(0,minimum-entries.length)},()=>null)];
  for(const p of padded){
   const values=[String(++number),p?String(p.number):'',p?.name||'',p?.maId||'',p?.in||'',p?.out||'',p?.yellow||'',p?.red||'',p?.goals||''];
   const height=Math.max(13,...values.map((v,i)=>wrap(v,columns[i]-8,7.5).length*9+4));
   if(y+height>802){ensure(height);section(title+' - CONTINUED');tableHead()}
   cells(values,columns,{min:13});
  }
 }
 squad('STARTING TEAM',rows.starters,Math.max(rows.starters.length, f.lineup?0:11));
 squad('SUBSTITUTES',rows.substitutes,Math.max(rows.substitutes.length, f.lineup?0:9));
 ensure(112);section('TEAM TACTICS');
 const tacticsTop=y;
 const tactics=wrap(`Formation: ${f.lineup?.formation||'Not recorded'}. ${sheet.tactics||''}`,245,8);
 tactics.slice(0,7).forEach((row,i)=>text(row,left+5,y+7+i*11));
 const px=left+270,py=y+6,pw=255,ph=84;
 rect(px,py,pw,ph);page.drawLine({start:{x:px+pw/2,y:pageHeight-py},end:{x:px+pw/2,y:pageHeight-py-ph},color:line,thickness:.6});
 page.drawCircle({x:px+pw/2,y:pageHeight-py-ph/2,size:15,borderColor:line,borderWidth:.6});
 rect(px,py+20,28,44);rect(px+pw-28,py+20,28,44);
 if(f.lineup)formationSlots(f.lineup.formation).forEach((pos,i)=>{
  const x=px+(100-pos.y)/100*pw,top=py+pos.x/100*ph;
  page.drawCircle({x,y:pageHeight-top,size:7,color:shade,borderColor:ink,borderWidth:.5});
  const label=String(rows.starters[i]?.number||i+1);text(label,x-font.widthOfTextAtSize(label,7)/2,top-4,7,true);
 });
 y=tacticsTop+96;
 if(tactics.length>7)paragraph(tactics.slice(7).join(' '));
 ensure(90);section('MATCH & TEAM OFFICIALS');
 cells([`Referee: ${f.referee||''}`,`Assistant referee 1: ${sheet.assistantReferee1||''}`],[267.5,267.5]);
 cells([`Assistant referee 2: ${sheet.assistantReferee2||''}`,`Fourth official: ${sheet.fourthOfficial||''}`],[267.5,267.5]);
 cells([`Head coach: ${sheet.headCoach||''}`,`Assistant coach: ${sheet.assistantCoach||''}`],[267.5,267.5]);
 cells([`Team manager: ${sheet.teamManager||''}`,`Team medic: ${sheet.medic||''}`],[267.5,267.5]);
 const captain=[...rows.starters,...rows.substitutes].find(p=>p.id===sheet.captainId);
 ensure(60);section('SIGNATURES');
 cells(['Referee signature:',`Captain: ${captain?.name||''}${captain?.number?'   Jersey: '+captain.number:''}`],[267.5,267.5]);
 cells(['','Captain signature:'],[267.5,267.5],{min:26});
 ensure(48);section('MATCH OFFICIAL REMARKS');
 if(sheet.remarks)paragraph(sheet.remarks);else{rect(left,y,width,30);y+=30}
 if(!f.match)paragraph('No linked match events were recorded. Blank event fields do not confirm that no events occurred.');
 for(const [i,p] of pdf.getPages().entries()){
  p.drawText(clean(`${f.date} | ${f.team} | ${i+1} / ${pdf.getPageCount()}`),{x:left,y:16,size:7,font,color:ink});
 }
 return pdf.save();
}
