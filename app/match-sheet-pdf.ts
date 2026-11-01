import {PDFDocument,StandardFonts,rgb,type RGB,type PDFImage} from 'pdf-lib';
import type {Content,Fixture} from './content';
import type {Player} from './player-model';
import {matchSheetRows} from './match-sheet';
import {formationSlots,replayMatch} from './match-record';
import {seasonForDate} from './seasons';
import {matchLimits} from './lineup';
import {bfaBadge} from './bfa-template';
import {trfaBadge,trfaNotes} from './trfa-template';
import {matchSheetPhoto} from './match-sheet-photo';
import {isDeletedPlayer} from './player-deletion';

/** Fixed A4 TRFA form: original starting team in the register, current lineup on the pitch. */
export async function createMatchSheetPdf(f:Fixture,content:Content,players:Player[],options:{editorCopy?:boolean}={}){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 pdf.setTitle(`Match sheet - ${f.team} vs ${f.opponent} - ${f.date}`);pdf.setAuthor(content.name);
 const page=pdf.addPage([595.28,841.89]),H=841.89,left=26,width=543,ink=rgb(0,0,0),grey=rgb(.65,.65,.65),yellow=rgb(1,1,0),red=rgb(1,0,0),white=rgb(1,1,1);
 const clean=(v:unknown)=>String(v??'').replace(/[\r\n\t]+/g,' ').replace(/[′’‘]/g,"'").replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/…/g,'...').split('').map(c=>{try{font.encodeText(c);return c}catch{return '?'}}).join('');
 function text(v:unknown,x:number,y:number,size=7,strong=false,color=ink){page.drawText(clean(v),{x,y:H-y-size,size,font:strong?bold:font,color})}
 function rect(x:number,y:number,w:number,h:number,color?:RGB){page.drawRectangle({x,y:H-y-h,width:w,height:h,borderWidth:.4,borderColor:ink,...(color?{color}:{})})}
 function wrap(v:unknown,w:number,size:number,strong=false){
  const face=strong?bold:font,lines:string[]=[];let current='';
  for(const word of clean(v).split(/\s+/)){const next=current?current+' '+word:word;if(face.widthOfTextAtSize(next,size)<=w){current=next;continue}if(current)lines.push(current);current='';for(const ch of word){if(face.widthOfTextAtSize(current+ch,size)>w){lines.push(current);current=''}current+=ch}}
  if(current)lines.push(current);return lines;
 }
 // Fit all recorded text inside its cell; never spill onto a second sheet or silently truncate.
 function box(v:unknown,x:number,y:number,w:number,h:number,size=7,strong=false,center=false,color=ink){
  const padding=Math.min(1.5,h*.1);
  let lines=wrap(v,w-6,size,strong);while(lines.length*size*1.12>h-padding*2&&size>.25){size=Math.max(.25,size-.25);lines=wrap(v,w-6,size,strong)}
  lines.forEach((line,i)=>text(line,center?x+(w-(strong?bold:font).widthOfTextAtSize(line,size))/2:x+3,y+Math.max(padding,(h-lines.length*size*1.12)/2)+i*size*1.12,size,strong,color));
 }
 function cells(values:unknown[],widths:number[],y:number,h:number,strong=false,colors:Record<number,RGB>={}){let x=left;values.forEach((v,i)=>{rect(x,y,widths[i],h,colors[i]);box(v,x,y,widths[i],h,7,strong);x+=widths[i]})}
 function section(v:string,y:number){rect(left,y,width,12,grey);box(v,left,y,width,12,7,true)}
 const badge=await pdf.embedJpg(bfaBadge),regional=await pdf.embedJpg(trfaBadge);
 page.drawImage(badge,{x:left+5,y:H-75,width:55,height:55});page.drawImage(regional,{x:left+width-64,y:H-75,width:58,height:58});
 const sheet=f.sheet||{};
 box(sheet.association||'TSWAPONG REGIONAL FOOTBALL ASSOCIATION',left+65,20,width-130,22,10,true,true);
 box(f.season||(f.date?seasonForDate(f.date):''),left+65,42,width-130,13,9,true,true);box('MATCHSHEET',left+65,55,width-130,17,12,true,true);
 // Excel columns B:J, with Age inserted after the player-name column.
 const columns=[22,30,175,26,77,40,30,38,50,55];
 const edges=columns.reduce<number[]>((positions,w)=>[...positions,positions[positions.length-1]+w],[left]);
 function cell(value:unknown,column:number,y:number,span=1,h=14,strong=false,fill?:RGB){
  const x=edges[column],w=edges[column+span]-x;rect(x,y,w,h,fill);box(value,x,y,w,h,7,strong);
 }
 cell('',0,90,1,42);
 for(const [y,label,value,startLabel,startValue,endLabel,endValue] of [
  [90,'Date:',f.date,'Start Time:',f.time,'Half Time:',sheet.halfTime||''],
  [104,'Venue:',f.venue,'Second half:',sheet.secondHalfStart||'','Full Time:',sheet.fullTime||''],
 ] as const){
  cell(label,1,y);cell(value,2,y,2);cell(startLabel,4,y);cell(startValue,5,y,3);cell(endLabel,8,y);cell(endValue,9,y);
 }
 cell('',1,118);cell('',2,118,2);cell('Colors',4,118,1,14,true);
 // F9:F11 is a continuous Scores block; the workbook shades its middle cell.
 cell('',5,118,1,42);page.drawRectangle({x:edges[5]+.2,y:H-146,width:columns[5]-.4,height:14,color:grey});box('SCORES',edges[5],132,columns[5],14,6.5,true);
 ['HT','FT','PENALTIES','OVERALL'].forEach((label,i)=>cell(label,i+6,118,1,14,true));
 const goals=f.match?.events.filter(e=>e.kind==='goal');
 const ht=f.match&&(f.match.phase==='finished'||f.match.period==='interval'||f.match.period==='second')&&f.scoreMode!=='manual'&&goals?.length===f.goalsFor?goals.filter(e=>e.period?e.period==='first':e.minute<=matchLimits(f.match!).halfEnd).length:null;
 const academy=[content.name,sheet.teamColors,sheet.halfTimeFor??ht,f.goalsFor,sheet.penaltiesFor,sheet.overallFor],opponent=[f.opponent,sheet.opponentColors,sheet.halfTimeAgainst,f.goalsAgainst,sheet.penaltiesAgainst,sheet.overallAgainst],away=f.homeAway==='away';
 const a=away?opponent:academy,b=away?academy:opponent;
 for(const [values,y,label] of [[a,132,'Team A:'],[b,146,'Team B:']] as const){cell(label,0,y,2);cell(values[0],2,y,2);cell(values[1],4,y);values.slice(2).forEach((value,i)=>cell(value,i+6,y));}
 const portraits=new Map<string,PDFImage>();
 const sources=players.filter(p=>[...(f.match?.slots||[]),...(f.match?.bench||[])].includes(p.id)).map(p=>p.headshot||'').concat([...(f.lineup?.starters||[]),...(f.lineup?.substitutes||[])].map(name=>f.lineup?.portraits?.[name]||'')).filter(Boolean);
 await Promise.all([...new Set(sources)].map(async source=>{const bytes=await matchSheetPhoto(source);if(bytes)portraits.set(source,await pdf.embedPng(bytes))}));
 const rows=matchSheetRows(f,players);
 if(rows.starters.length>11)throw Error('Choose at most 11 starters.');
 // Keep the original form for up to nine reserves; fit every additional selected reserve on the same page.
 const reserveRows=Math.max(9,rows.substitutes.length),rowHeight=260/(11+reserveRows),benchTop=197+11*rowHeight;
 ['No','Jersey No','Players Name and Surname','AGE','MA ID'].forEach((label,i)=>cell(label,i,160,1,25,true));
 cell('SUBS',5,160,2,12.5,true);cell('YC',7,160,1,12.5,true,yellow);cell('RC',8,160,1,12.5,true,red);cell('GOALS',9,160,1,12.5,true);
 ['In','Out','Time','Time','Time'].forEach((label,i)=>cell(label,i+5,172.5,1,12.5));
 cell('Starting Team',0,185,6,12,true,grey);cell('',6,185,4,12,false,grey);
 function row(p:typeof rows.starters[number]|undefined,n:number,y:number){
  const profile=players.find(player=>player.id===p?.id),photo=profile?.headshot?portraits.get(profile.headshot):undefined;
  cells([n,p?.number,photo?'':p?.name,p?.age,p?.maId,p?.in,p?.out,p?.yellow,p?.red,p?.goals],columns,y,rowHeight);
  if(photo){const size=Math.min(11,rowHeight*.85);page.drawImage(photo,{x:left+54,y:H-y-(rowHeight+size)/2,width:size,height:size});box(p?.name,left+55+size,y,172-size,rowHeight,7)}
 }
 for(let i=0;i<11;i++)row(rows.starters[i],i+1,197+i*rowHeight);
 section('Substitutes',benchTop);for(let i=0;i<reserveRows;i++)row(rows.substitutes[i],i+12,benchTop+12+i*rowHeight);
 section('PLEASE INDICATE TEAM TACTICS BELOW',469);
 rect(left,481,253,169);box(`Formation: ${f.lineup?.formation||''}`,left,484,253,16,8,true);box(sheet.tactics||'',left,503,253,58,8);
 if(sheet.remarks){box('MATCH OFFICIAL REMARKS',left,565,253,13,7,true);box(sheet.remarks,left,579,253,68,7)}
 const px=left+253,py=481,pw=290,ph=169;
 rect(px,py,pw,ph,rgb(.08,.42,.22));
 for(let i=0;i<8;i++)if(i%2===0)page.drawRectangle({x:px+2+i*(pw-4)/8,y:H-py-ph+2,width:(pw-4)/8,height:ph-4,color:rgb(.09,.46,.24)});
 function pitchRect(x:number,y:number,w:number,h:number){page.drawRectangle({x,y:H-y-h,width:w,height:h,borderWidth:.5,borderColor:white})}
 pitchRect(px+5,py+5,pw-10,ph-10);
 pitchRect(px+5,py+ph*.2,32,ph*.6);pitchRect(px+pw-37,py+ph*.2,32,ph*.6);
 pitchRect(px+5,py+ph*.35,12,ph*.3);pitchRect(px+pw-17,py+ph*.35,12,ph*.3);
 page.drawLine({start:{x:px+pw/2,y:H-py-5},end:{x:px+pw/2,y:H-py-ph+5},color:white,thickness:.5});
 page.drawCircle({x:px+pw/2,y:H-py-ph/2,size:22,borderColor:white,borderWidth:.5});
 const ids=f.match?(f.match.phase==='pre'?f.match.slots:replayMatch(f.match).slots):[];
 const labels=formationSlots(f.lineup?.formation||'4-3-3').map((pos,i)=>{
  const id=ids[i],p=players.find(p=>p.id===id),deleted=id&&isDeletedPlayer(id),legacy=f.lineup?.starters[i]||'';
  const name=deleted?'Deleted player':p?`${p.number||''} ${p.name}`.trim():id?f.match?.roster?.[id]?.name||'Unavailable player':f.match?'':legacy;
  return {...pos,id,name,photo:deleted?'':p?.headshot||f.lineup?.portraits?.[name]||'',number:p?.number||''};
 });
 for(const p of labels){
  if(!p.name)continue;
  const x=px+15+(100-p.y)/100*(pw-30),top=py+8+p.x/100*(ph-32),photo=portraits.get(p.photo);
  if(photo)page.drawImage(photo,{x:x-7,y:H-top-7,width:14,height:14});else{page.drawCircle({x,y:H-top,size:7,color:grey,borderColor:white,borderWidth:.6});box(p.number||'+',x-7,top-7,14,14,7,true,true)}
  const labelWidth=Math.min(62,(pw-30)/Math.max(2,(f.lineup?.formation||'4-3-3').split('-').length));
  box(p.name,x-labelWidth/2,top+7,labelWidth,11,4.75,true,true,white);
 }
 cells([`Referee: ${f.referee||''}`,`Assistant Referee 1: ${sheet.assistantReferee1||''}`,`Assistant Referee 2: ${sheet.assistantReferee2||''}`],[253,147,143],650,19);
 cells([`4th Official: ${sheet.fourthOfficial||''}`,`Referee assessor: ${sheet.refereeAssessor||''}`],[253,290],669,16);
 section('TEAM OFFICIALS',685);
 cells([`Head Coach: ${sheet.headCoach||''}`,`Assistant Coach: ${sheet.assistantCoach||''}`,`Goalkeeper coach: ${sheet.goalkeeperCoach||''}`],[253,117,173],697,19);
 cells([`Team Medic: ${sheet.medic||''}`,`Official 1: ${sheet.official1||sheet.teamManager||''}`,`Official 2: ${sheet.official2||''}`],[253,147,143],716,16);
 cells([`Official 3: ${sheet.official3||''}`,`Official 4: ${sheet.official4||''}`,`Official 5: ${sheet.official5||''}`],[253,147,143],732,16);
 const captain=[...rows.starters,...rows.substitutes].find(p=>p.id===sheet.captainId)?.name||'';
 cells(['REFEREE SIGNATURE:',`Team A Captain Name / Signature: ${away?sheet.opponentCaptain||'':captain}`,`Team B Captain Name / Signature: ${away?captain:sheet.opponentCaptain||''}`],[253,147,143],748,24,true);
 box(trfaNotes.join('\n'),left,774,width,48,5.5);
 text(`${f.date} | ${f.team} | ${options.editorCopy?'EDITOR COPY | ':''}1 / 1`,left,826,6);
 return pdf.save();
}
