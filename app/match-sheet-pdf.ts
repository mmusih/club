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
 const page=pdf.addPage([595.28,841.89]),H=841.89,left=26,width=543,ink=rgb(0,0,0),grey=rgb(.65,.65,.65),green=rgb(0,.69,.31),red=rgb(1,0,0),white=rgb(1,1,1);
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
  let lines=wrap(v,w-6,size,strong);while(lines.length*size*1.12>h-3&&size>1){size-=.25;lines=wrap(v,w-6,size,strong)}
  lines.forEach((line,i)=>text(line,center?x+(w-(strong?bold:font).widthOfTextAtSize(line,size))/2:x+3,y+Math.max(1,(h-lines.length*size*1.12)/2)+i*size*1.12,size,strong,color));
 }
 function cells(values:unknown[],widths:number[],y:number,h:number,strong=false,colors:Record<number,RGB>={}){let x=left;values.forEach((v,i)=>{rect(x,y,widths[i],h,colors[i]);box(v,x,y,widths[i],h,7,strong);x+=widths[i]})}
 function section(v:string,y:number){rect(left,y,width,12,grey);box(v,left,y,width,12,7,true)}
 const badge=await pdf.embedJpg(bfaBadge),regional=await pdf.embedJpg(trfaBadge);
 page.drawImage(badge,{x:left+5,y:H-75,width:55,height:55});page.drawImage(regional,{x:left+width-64,y:H-75,width:58,height:58});
 const sheet=f.sheet||{},status=f.status==='cancelled'?'CANCELLED':f.status==='postponed'?'POSTPONED':f.status==='played'||f.match?.phase==='finished'?'FULL TIME':f.status==='live'||f.match?.phase==='live'?'IN PROGRESS':'PRE-MATCH';
 box(sheet.association||'TSWAPONG REGIONAL FOOTBALL ASSOCIATION',left+65,20,width-130,22,10,true,true);
 box(f.season||(f.date?seasonForDate(f.date):''),left+65,42,width-130,13,9,true,true);box('MATCHSHEET',left+65,55,width-130,17,12,true,true);
 box(`${f.competition} ${f.round||''} | ${f.team} | ${status}`,left,77,width,12,6.5,false,true);
 cells([`Date: ${f.date}`,`Start Time: ${f.time}`,`Half Time: ${sheet.halfTime||''}`],[250,155,138],90,14);
 cells([`Venue: ${f.venue}`,`Second half: ${sheet.secondHalfStart||''}`,`Full Time: ${sheet.fullTime||''}`],[250,155,138],104,14);
 const scores=[240,102,40,40,62,59];cells(['','Colors','HT','FT','PENALTIES','OVERALL'],scores,118,14,true);
 const goals=f.match?.events.filter(e=>e.kind==='goal');
 const ht=f.match&&(f.match.phase==='finished'||f.match.period==='interval'||f.match.period==='second')&&f.scoreMode!=='manual'&&goals?.length===f.goalsFor?goals.filter(e=>e.period?e.period==='first':e.minute<=matchLimits(f.match!).halfEnd).length:null;
 const academy=[content.name,sheet.teamColors,sheet.halfTimeFor??ht,f.goalsFor,sheet.penaltiesFor,sheet.overallFor],opponent=[f.opponent,sheet.opponentColors,sheet.halfTimeAgainst,f.goalsAgainst,sheet.penaltiesAgainst,sheet.overallAgainst],away=f.homeAway==='away';
 const a=away?opponent:academy,b=away?academy:opponent;
 cells(['Team A: '+a[0],...a.slice(1)],scores,132,14);cells(['Team B: '+b[0],...b.slice(1)],scores,146,14);
 const portraits=new Map<string,PDFImage>();
 const sources=players.filter(p=>[...(f.match?.slots||[]),...(f.match?.bench||[])].includes(p.id)).map(p=>p.headshot||'').concat([...(f.lineup?.starters||[]),...(f.lineup?.substitutes||[])].map(name=>f.lineup?.portraits?.[name]||'')).filter(Boolean);
 await Promise.all([...new Set(sources)].map(async source=>{const bytes=await matchSheetPhoto(source);if(bytes)portraits.set(source,await pdf.embedPng(bytes))}));
 const rows=matchSheetRows(f,players),columns=[22,30,175,83,37,37,46,51,62];
 if(rows.starters.length>11||rows.substitutes.length>9)throw Error('This one-page form supports 11 starters and 9 substitutes. Update the selected squad before downloading.');
 cells(['No','Jersey No','Players Name and Surname','MA ID','SUBS In','SUBS Out','YC Time','RC Time','GOALS Time'],columns,160,25,true,{6:green,7:red});
 section('Starting Team',185);
 function row(p:typeof rows.starters[number]|undefined,n:number,y:number){
  const profile=players.find(player=>player.id===p?.id),photo=profile?.headshot?portraits.get(profile.headshot):undefined;
  cells([n,p?.number,photo?'':p?.name,p?.maId,p?.in,p?.out,p?.yellow,p?.red,p?.goals],columns,y,13);
  if(photo){page.drawImage(photo,{x:left+54,y:H-y-12,width:11,height:11});box(p?.name,left+66,y,161,13,7)}
 }
 for(let i=0;i<11;i++)row(rows.starters[i],i+1,197+i*13);
 section('Substitutes',340);for(let i=0;i<9;i++)row(rows.substitutes[i],i+12,352+i*13);
 section('PLEASE INDICATE TEAM TACTICS BELOW',469);
 rect(left,481,220,169);box(`Formation: ${f.lineup?.formation||''}`,left,484,220,16,8,true);box(sheet.tactics||'',left,503,220,58,8);
 if(sheet.remarks){box('MATCH OFFICIAL REMARKS',left,565,220,13,7,true);box(sheet.remarks,left,579,220,68,7)}
 const px=left+220,py=481,pw=323,ph=169;
 rect(px,py,pw,ph,rgb(.08,.42,.22));
 for(let i=0;i<8;i++)if(i%2===0)page.drawRectangle({x:px+2,y:H-py-(i+1)*(ph-4)/8-2,width:pw-4,height:(ph-4)/8,color:rgb(.09,.46,.24)});
 function pitchRect(x:number,y:number,w:number,h:number){page.drawRectangle({x,y:H-y-h,width:w,height:h,borderWidth:.5,borderColor:white})}
 pitchRect(px+5,py+5,pw-10,ph-10);pitchRect(px+pw*.31,py+5,pw*.38,22);pitchRect(px+pw*.31,py+ph-27,pw*.38,22);
 page.drawLine({start:{x:px+5,y:H-py-ph/2},end:{x:px+pw-5,y:H-py-ph/2},color:white,thickness:.5});page.drawEllipse({x:px+pw/2,y:H-py-ph/2,xScale:25,yScale:15,borderColor:white,borderWidth:.5});
 const ids=f.match?(f.match.phase==='pre'?f.match.slots:replayMatch(f.match).slots):[];
 const labels=formationSlots(f.lineup?.formation||'4-3-3').map((pos,i)=>{
  const id=ids[i],p=players.find(p=>p.id===id),deleted=id&&isDeletedPlayer(id),legacy=f.lineup?.starters[i]||'';
  const name=deleted?'Deleted player':p?`${p.number||''} ${p.name}`.trim():id?f.match?.roster?.[id]?.name||'Unavailable player':f.match?'':legacy;
  return {...pos,id,name,photo:deleted?'':p?.headshot||f.lineup?.portraits?.[name]||'',number:p?.number||''};
 });
 for(const p of labels){
  if(!p.name)continue;
  const x=px+p.x/100*pw,top=py+p.y/100*(ph-18)+2,photo=portraits.get(p.photo);
  if(photo)page.drawImage(photo,{x:x-9,y:H-top-9,width:18,height:18});else{page.drawCircle({x,y:H-top,size:9,color:grey,borderColor:white,borderWidth:.6});box(p.number||'+',x-9,top-9,18,18,8,true,true)}
  const labelWidth=Math.min(76,pw/(Math.max(formationSlots(f.lineup?.formation||'4-3-3').filter(s=>s.y===p.y).length,1)+1));
  box(p.name,x-labelWidth/2,top+9,labelWidth,15,5.5,true,true,white);
 }
 cells([`Referee: ${f.referee||''}`,`Assistant Referee 1: ${sheet.assistantReferee1||''}`,`Assistant Referee 2: ${sheet.assistantReferee2||''}`],[181,181,181],650,19);
 cells([`4th Official: ${sheet.fourthOfficial||''}`,`Referee assessor: ${sheet.refereeAssessor||''}`],[272,271],669,16);
 section('TEAM OFFICIALS',685);
 cells([`Head Coach: ${sheet.headCoach||''}`,`Assistant Coach: ${sheet.assistantCoach||''}`,`Goalkeeper coach: ${sheet.goalkeeperCoach||''}`],[181,181,181],697,19);
 cells([`Team Medic: ${sheet.medic||''}`,`Official 1: ${sheet.official1||sheet.teamManager||''}`,`Official 2: ${sheet.official2||''}`],[181,181,181],716,16);
 cells([`Official 3: ${sheet.official3||''}`,`Official 4: ${sheet.official4||''}`,`Official 5: ${sheet.official5||''}`],[181,181,181],732,16);
 const captain=[...rows.starters,...rows.substitutes].find(p=>p.id===sheet.captainId)?.name||'';
 cells(['REFEREE SIGNATURE:',`Team A Captain Name / Signature: ${away?sheet.opponentCaptain||'':captain}`,`Team B Captain Name / Signature: ${away?captain:sheet.opponentCaptain||''}`],[181,181,181],748,24,true);
 box(trfaNotes.join('\n'),left,774,width,48,5.5);
 text(`${f.date} | ${f.team} | ${options.editorCopy?'EDITOR COPY | ':''}1 / 1`,left,826,6);
 return pdf.save();
}
