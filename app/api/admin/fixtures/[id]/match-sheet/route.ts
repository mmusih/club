import {canEdit,readContent,database} from '../../../../../storage';
import type {Player} from '../../../../../player-model';
import {createMatchSheetPdf} from '../../../../../match-sheet-pdf';

export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(!await canEdit())return Response.json({error:'Sign in as a club administrator to download match sheets.'},{status:401});
  const {id}=await params,{content}=await readContent(true),fixture=content.fixtures.find(f=>f.id===id);
  if(!fixture)return Response.json({error:'Match not found. Publish the fixture first.'},{status:404});
  if(fixture.status!=='played')return Response.json({error:'Mark this match Played and publish changes before downloading its sheet.'},{status:409});
  const rows=await database().prepare('SELECT id,body FROM players').all<{id:string;body:string}>();
  const players=rows.results.map(row=>({...JSON.parse(row.body),id:row.id} as Player));
  const pdf=await createMatchSheetPdf(fixture,content,players);
  const filename=`match-sheet-${fixture.date}-${fixture.opponent.replace(/[^a-z0-9-]/gi,'-')}.pdf`;
  return new Response(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){console.error(e);return Response.json({error:'Could not create the match sheet. Please try again.'},{status:503})}
}
