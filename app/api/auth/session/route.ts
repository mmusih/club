import {cookies} from 'next/headers';
import {getAdminUser,sessionCookie,tokenHash} from '../../../auth';
import {database,sameOrigin} from '../../../storage';

export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  if(!await getAdminUser())return Response.json({error:'Session expired.'},{status:401});
  const jar=await cookies(),token=jar.get(sessionCookie)!.value;
  const now=new Date().toISOString();
  const result=await database().prepare('UPDATE admin_sessions SET expires_at = ? WHERE token_hash = ? AND expires_at > ?').bind(new Date(Date.now()+8*3600*1000).toISOString(),tokenHash(token),now).run();
  if(!result.meta.changes)return Response.json({error:'Session expired.'},{status:401});
  jar.set(sessionCookie,token,{httpOnly:true,secure:new URL(process.env.APP_URL||request.url).protocol==='https:',sameSite:'lax',path:'/',maxAge:8*3600});
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Session check temporarily unavailable.'},{status:503})}
}
