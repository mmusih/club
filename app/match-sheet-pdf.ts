import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import type {Content,Fixture} from './content';
import type {Player} from './player-model';
import {matchSheetRows,type SheetRow} from './match-sheet';
import {formationSlots} from './match-record';
import {seasonForDate} from './seasons';
import {matchLimits} from './lineup';
import {bfaBadge} from './bfa-template';

/** A4 association-style sheet. Long squads, names and remarks continue onto extra pages. */
export async function createMatchSheetPdf(f:Fixture,content:Content,players:Player[],options:{editorCopy?:boolean}={}){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 pdf.setTitle(`Match sheet - ${f.team} vs ${f.opponent} - ${f.date}`);
 pdf.setAuthor(content.name);
 const badge=await pdf.embedJpg(bfaBadge);
 const width=535,left=30,pageHeight=841.89,ink=rgb(0,0,0),line=rgb(.15,.15,.15),shade=rgb(.7,.7,.7);
 let page=pdf.addPage([595.28,pageHeight]),y=30;
 const status=f.status==='cancelled'?'CANCELLED':f.status==='postponed'?'POSTPONED':f.status==='played'||f.match?.phase==='finished'?'FULL TIME':f.status==='live'||f.match?.phase==='live'?'IN PROGRESS':'PRE-MATCH';
 // The association form uses Latin text; normalize punctuation unsupported by the PDF base font.
 const clean=(value:unknown)=>String(value??'').replace(/[\r\n\t]+/g,' ').replace(/[′’‘]/g,"'").replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/…/g,'...').split('').map(c=>{try{font.encodeText(c);return c}catch{return '?'}}).join('');
 function text(value:unknown,x:number,top:number,size=8,strong=false){page.drawText(clean(value),{x,y:pageHeight-top-size,size,font:strong?bold:font,color:ink})}
 function rect(x:number,top:number,w:number,h:number,fill=false){page.drawRectangle({x,y:pageHeight-top-h,width:w,height:h,borderWidth:.5,borderColor:line,...(fill?{color:shade}:{})})}
 function wrap(value:unknown,w:number,size=8,strong=false){
  const face=strong?bold:font;
  const lines:string[]=[];let current='';
  for(const word of clean(value).split(/\s+/)){
   const next=current?current+' '+word:word;
   if(face.widthOfTextAtSize(next,size)<=w){current=next;continue}
   if(current)lines.push(current);current='';
   for(const char of word){if(face.widthOfTextAtSize(current+char,size)>w){lines.push(current);current=''}current+=char}
  }
  if(current||!lines.length)lines.push(current);return lines;
 }
 function header(continued=false){
  page.drawImage(badge,{x:left,y:pageHeight-y-44,width:44,height:44});
  text('MATCH SHEET'+(continued?' - CONTINUED':''),left+195,y+12,12,true);
  const association=wrap(f.sheet?.association||f.competition||'',170,7);
  association.forEach((row,i)=>text(row,left+365,y+i*9,7));
  y+=49;
  for(const row of wrap(`${f.season||(f.date?seasonForDate(f.date):'')} | ${status} | ${content.name} (${f.team})`,width,8)){text(row,left,y,8);y+=10}y+=6;
 }
 function ensure(height:number){if(y+height>802){page=pdf.addPage([595.28,pageHeight]);y=30;header(true)}}
 function section(title:string){ensure(25);rect(left,y,width,16,true);text(title,left+5,y+3,8,true);y+=16}
 function cells(values:string[],widths:number[],options:{strong?:boolean;fill?:boolean;min?:number}={}){
  const rows=values.map((v,i)=>wrap(v,widths[i]-8,7.5,options.strong)),h=Math.max(options.min||14,...rows.map(r=>r.length*9+4));
  ensure(h);let x=left;
  values.forEach((_,i)=>{rect(x,y,widths[i],h,options.fill);rows[i].forEach((v,j)=>text(v,x+4,y+3+j*9,7.5,options.strong));x+=widths[i]});y+=h;
 }
 function paragraph(value:string){for(const row of wrap(value,width-10)){ensure(12);text(row,left+5,y+2);y+=12}}
 header();
 const sheet=f.sheet||{},blank=(v:unknown)=>v===undefined||v===null?'':String(v);
 cells([`Date: ${f.date}`,`Venue: ${f.venue}`,`Start time: ${f.time?f.time+' CAT':''}`,`Half time: ${sheet.halfTime||''}`,`Full time: ${sheet.fullTime||''}`],[85,170,100,90,90]);
 cells([`Competition / round: ${f.competition} ${f.round||''}${sheet.secondHalfStart?' | Second half: '+sheet.secondHalfStart:''}`],[width]);
 const away=f.homeAway==='away';
 cells(['Teams','Colours','HT',status==='IN PROGRESS'?'Score':'FT','Penalties','Overall'],[225,100,40,40,65,65],{strong:true,fill:true});
 const trackedGoals=f.match?.events.filter(e=>e.kind==='goal');
 const trackedHalfTime=f.match&&(f.match.phase==='finished'||f.match.period==='interval'||f.match.period==='second')&&f.scoreMode!=='manual'&&trackedGoals?.length===f.goalsFor
  ?trackedGoals.filter(e=>e.period?e.period==='first':e.minute<=matchLimits(f.match!).halfEnd).length:null;
 const academy=[content.name,sheet.teamColors||'',blank(sheet.halfTimeFor??trackedHalfTime),blank(f.goalsFor),blank(sheet.penaltiesFor),blank(sheet.overallFor)];
 const opponent=[f.opponent,sheet.opponentColors||'',blank(sheet.halfTimeAgainst),blank(f.goalsAgainst),blank(sheet.penaltiesAgainst),blank(sheet.overallAgainst)];
 cells(['Team A: '+(away?opponent[0]:academy[0]),...(away?opponent:academy).slice(1)],[225,100,40,40,65,65]);
 cells(['Team B: '+(away?academy[0]:opponent[0]),...(away?academy:opponent).slice(1)],[225,100,40,40,65,65]);
 const rows=matchSheetRows(f,players),columns=[22,30,144,77,27,47,47,45,47,49];
 function tableHead(){cells(['No.','Jersey No','Players First Name and Surname','MA ID No','AGE','Subs In','Subs Out','YC Time','RC Time','GOALS Time'],columns,{strong:true,fill:true})}
 let number=0;
 function squad(title:string,entries:SheetRow[],minimum:number){
  ensure(44);section(title);
  const padded=[...entries,...Array.from({length:Math.max(0,minimum-entries.length)},()=>null)];
  for(const p of padded){
   const values=[String(++number),p?blank(p.number):'',p?.name||'',p?.maId||'',blank(p?.age),p?.in||'',p?.out||'',p?.yellow||'',p?.red||'',p?.goals||''];
   const height=Math.max(13,...values.map((v,i)=>wrap(v,columns[i]-8,7.5).length*9+4));
   if(y+height>802){ensure(height);section(title+' - CONTINUED');tableHead()}
   cells(values,columns,{min:13});
  }
 }
 tableHead();
 squad('STARTING TEAM',rows.starters,Math.max(rows.starters.length,11));
 squad('SUBSTITUTES',rows.substitutes,Math.max(rows.substitutes.length,9));
 ensure(90);section('PLEASE INDICATE TEAM TACTICS BELOW');
 const tacticsTop=y;
 const tactics=wrap(`Formation: ${f.lineup?.formation||''} ${sheet.tactics||''}`,245,8);
 tactics.slice(0,6).forEach((row,i)=>text(row,left+5,y+7+i*11));
 const px=left+270,py=y+6,pw=255,ph=70;
 rect(px,py,pw,ph);page.drawLine({start:{x:px+pw/2,y:pageHeight-py},end:{x:px+pw/2,y:pageHeight-py-ph},color:line,thickness:.6});
 page.drawCircle({x:px+pw/2,y:pageHeight-py-ph/2,size:15,borderColor:line,borderWidth:.6});
 rect(px,py+(ph-44)/2,28,44);rect(px+pw-28,py+(ph-44)/2,28,44);
 if(f.lineup)formationSlots(f.lineup.formation).forEach((pos,i)=>{
  if(!rows.starters[i]?.id)return;
  const x=px+(100-pos.y)/100*pw,top=py+pos.x/100*ph;
  page.drawCircle({x,y:pageHeight-top,size:7,color:shade,borderColor:ink,borderWidth:.5});
  const label=String(rows.starters[i]?.number||'?');text(label,x-font.widthOfTextAtSize(label,7)/2,top-4,7,true);
 });
 y=tacticsTop+82;
 if(tactics.length>6)paragraph(tactics.slice(6).join(' '));
 ensure(135);section('MATCH OFFICIALS');
 cells([`Referee: ${f.referee||''}`,`Assistant referee 1: ${sheet.assistantReferee1||''}`,`Assistant referee 2: ${sheet.assistantReferee2||''}`],[178,179,178]);
 cells([`4th official: ${sheet.fourthOfficial||''}`,`Referee assessor: ${sheet.refereeAssessor||''}`],[357,178]);
 section('TEAM OFFICIALS');
 cells([`Head coach: ${sheet.headCoach||''}`,`Assistant coach: ${sheet.assistantCoach||''}`,`Goalkeeper coach: ${sheet.goalkeeperCoach||''}`],[178,179,178]);
 cells([`Team medic: ${sheet.medic||''}`,`Official 1: ${sheet.official1||sheet.teamManager||''}`,`Official 2: ${sheet.official2||''}`],[178,179,178]);
 cells([`Official 3: ${sheet.official3||''}`,`Official 4: ${sheet.official4||''}`,`Official 5: ${sheet.official5||''}`],[178,179,178]);
 const captain=[...rows.starters,...rows.substitutes].find(p=>p.id===sheet.captainId);
 ensure(40);
 cells(['REFEREE SIGNATURE:',`TEAM A CAPTAIN NAME / SIGNATURE: ${away?sheet.opponentCaptain||'':captain?.name||''}`,`TEAM B CAPTAIN NAME / SIGNATURE: ${away?captain?.name||'':sheet.opponentCaptain||''}`],[178,179,178],{strong:true,min:34});
 if(sheet.remarks){ensure(30);section('MATCH OFFICIAL REMARKS');paragraph(sheet.remarks)}
 paragraph('Captain signatures: before kick-off. Referee signature: after the match. Blank fields indicate information not yet recorded.');
 for(const [i,p] of pdf.getPages().entries()){
  p.drawText(clean(`${f.date} | ${f.team} | ${options.editorCopy?'EDITOR COPY | ':''}${i+1} / ${pdf.getPageCount()}`),{x:left,y:16,size:7,font,color:ink});
 }
 return pdf.save();
}
