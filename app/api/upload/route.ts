import {saveMedia} from '../../../lib/media';
import {canEdit,sameOrigin} from '../../storage';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return Response.json({error:'This website address is not authorised for uploads. Ask the administrator to check APP_URL and ADMIN_ALLOWED_ORIGINS.'},{status:403});
  if(!await canEdit())return Response.json({error:'Your session has expired. Sign in again in another tab, then retry. Your edits are still here.'},{status:401});
  if(Number(request.headers.get('content-length')||0)>8500000)return Response.json({error:'Please choose a photo smaller than 8 MB.'},{status:413});
  const data=await request.formData(),file=data.get('file'),aspect=data.get('portraitAspect');
  if(aspect!==null&&aspect!=='4:5'&&aspect!=='1:1')return Response.json({error:'Invalid portrait frame.'},{status:400});
  if(!(file instanceof File)||!file.size||file.size>8*1024*1024)return Response.json({error:'Please choose a photo smaller than 8 MB.'},{status:400});
  // Load decoders inside the handler so a missing host dependency returns JSON.
  let preparePhoto:typeof import('../../../lib/photo-upload')['preparePhoto'];
  try{({preparePhoto}=await import('../../../lib/photo-upload'))}catch(e){console.error('Photo decoder could not load',e);return Response.json({error:'Photo processing is unavailable on this server. Ask the site administrator to reinstall dependencies and redeploy.'},{status:503})}
  let photo:Buffer;
  try{photo=await preparePhoto(Buffer.from(await file.arrayBuffer()),aspect==='4:5'?0.8:aspect==='1:1'?1:undefined)}catch{return Response.json({error:'This image could not be read. Use JPG, PNG, WebP, GIF, AVIF, HEIC/HEIF, TIFF, BMP or SVG.'},{status:400})}
  const key=crypto.randomUUID()+'.webp';await saveMedia(key,photo,'image/webp');
  return Response.json({url:'/media/'+key});
 }catch(e){console.error(e);return Response.json({error:'The upload failed. Please try again.'},{status:503})}
}
