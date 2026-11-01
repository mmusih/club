import {canEdit,readContent,database,sameOrigin} from '../../../../../storage';
import type {Content,Fixture} from '../../../../../content';
import type {Player} from '../../../../../player-model';
import {createMatchSheetPdf} from '../../../../../match-sheet-pdf';
import {matchSheetFixtureSchema} from '../../../../../validation';
import {snapshotMatchPlayers} from '../../../../../match-sheet';

export const dynamic='force-dynamic';
export const runtime='nodejs';
async function playersForSheet(){
 const rows=await database().prepare('SELECT id,body FROM players').all<{id:string;body:string}>();
 return rows.results.map(row=>({...JSON.parse(row.body),id:row.id} as Player));
}
async function pdfResponse(fixture:Fixture,content:Content,players:Player[],editorCopy=false){
 const pdf=await createMatchSheetPdf(fixture,content,players,{editorCopy});
 const filename=`match-sheet-${fixture.date}-${fixture.opponent.replace(/[^a-z0-9-]/gi,'-')}.pdf`;
 return new Response(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(!await canEdit())return Response.json({error:'Sign in as a club administrator to download match sheets.'},{status:401});
  const {id}=await params,{content}=await readContent(true),fixture=content.fixtures.find(f=>f.id===id);
  if(!fixture)return Response.json({error:'Match not found. Publish the fixture first.'},{status:404});
  return await pdfResponse(fixture,content,await playersForSheet());
 }catch(e){console.error(e);return Response.json({error:'Could not create the match sheet. Please try again.'},{status:503})}
}

/** Render current editor values without saving, publishing, or starting the match. */
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(!await canEdit())return Response.json({error:'Sign in as a club administrator to preview match sheets.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  if(Number(request.headers.get('content-length')||0)>500000)return Response.json({error:'The match sheet is too large.'},{status:413});
  const raw=await request.text();
  if(raw.length>500000)return Response.json({error:'The match sheet is too large.'},{status:413});
  let body:unknown;
  try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid match sheet request.'},{status:400})}
  const parsed=matchSheetFixtureSchema.safeParse(body);
  if(!parsed.success)return Response.json({error:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')},{status:400});
  const {id}=await params;
  if(parsed.data.id!==id)return Response.json({error:'The match sheet does not match this fixture.'},{status:400});
  const {content}=await readContent(true),players=await playersForSheet();
  const fixture=snapshotMatchPlayers({...content,fixtures:[parsed.data]},content,players).fixtures[0];
  return await pdfResponse(fixture,content,players,true);
 }catch(e){console.error(e);return Response.json({error:'Could not create the match sheet. Please try again.'},{status:503})}
}
