import {readFile} from 'node:fs/promises';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {get} from 'node:https';
import sharp from 'sharp';

/** Read uploaded photos directly; external portraits use public HTTPS addresses only. */
export async function matchSheetPhoto(source:string):Promise<Buffer|null>{
 try{
  let bytes:Buffer;
  if(/^\/media\/[a-f0-9-]+\.(jpg|png|webp)$/.test(source)){
   const {readMedia}=await import('../lib/media');
   const file=await readMedia(source.slice(7));if(!file)return null;bytes=file.body;
  }else if(/^\/academy\/[a-z0-9-]+\.(jpg|png|webp)$/.test(source))bytes=await readFile(process.cwd()+'/public'+source);
  else{
   const url=new URL(source);
   if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443')return null;
   const addresses=await lookup(url.hostname,{all:true});
   // Pin DNS to a public IPv4 address. No redirects or private-network requests.
   const address=addresses.find(a=>isIP(a.address)===4&&!/^(0|10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01])|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])|198\.(18|19))\./.test(a.address)&&Number(a.address.split('.')[0])<224);
   if(!address)return null;
   bytes=await new Promise<Buffer>((resolve,reject)=>{
    const request=get(url,{lookup:(_host,_options,callback)=>callback(null,[{address:address.address,family:4}])},response=>{
     if(response.statusCode!==200){response.resume();reject(Error('Photo unavailable'));return}
     const chunks:Buffer[]=[];let size=0;
     response.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>8*1024*1024)request.destroy(Error('Photo too large'));else chunks.push(chunk)});
     response.on('end',()=>resolve(Buffer.concat(chunks)));response.on('error',reject);
    });
    const timeout=setTimeout(()=>request.destroy(Error('Photo timeout')),5000);
    request.on('close',()=>clearTimeout(timeout));request.on('error',reject);
   });
  }
  return await sharp(bytes,{limitInputPixels:60_000_000}).rotate().resize(96,96,{fit:'cover',position:'north'}).png().toBuffer();
 }catch{return null}
}
