import {canEdit,sameOrigin} from '../../../../storage';
import {parseFixturePages,type PdfText} from '../../../../fixture-import';

export const runtime='nodejs';
export async function POST(request:Request){
 if(!sameOrigin(request)||!await canEdit())return Response.json({error:'Editor access required.'},{status:403});
 const max=10*1024*1024;
 if(Number(request.headers.get('content-length')||0)>max+65536)return Response.json({error:'Choose a PDF smaller than 10 MB.'},{status:413});
 try{
  const form=await request.formData(),file=form.get('file');
  if(!(file instanceof File)||file.size>max)return Response.json({error:'Choose a PDF smaller than 10 MB.'},{status:400});
  const data=new Uint8Array(await file.arrayBuffer());
  if(new TextDecoder().decode(data.slice(0,5))!=='%PDF-')return Response.json({error:'This file is not a PDF.'},{status:400});
  const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task=getDocument({data,useSystemFonts:true});
  try{
   const pdf=await task.promise;if(pdf.numPages>30)throw new Error('Choose a fixture PDF with no more than 30 pages.');
   const pages=[];
   for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n),text=await page.getTextContent();
    pages.push({width:page.getViewport({scale:1}).width,items:text.items.filter((t):t is typeof t & PdfText=>'str' in t)});
   }
   return Response.json({fixtures:parseFixturePages(pages)},{headers:{'Cache-Control':'no-store'}});
  }finally{await task.destroy()}
 }catch(e){console.error(e);return Response.json({error:e instanceof Error&&/Page |fixture|PDF|password/i.test(e.message)?e.message:'Could not read this PDF. Use an unprotected, text-based TRFA schedule.'},{status:400})}
}
