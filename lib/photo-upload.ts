import sharp from 'sharp';

const limitInputPixels=60_000_000;
/** Decode actual image bytes and store one browser-compatible, orientation-correct photo. */
export async function preparePhoto(bytes:Buffer,aspect?:number):Promise<Buffer>{
 let input:Buffer=bytes;
 if(bytes.subarray(0,2).toString()==='BM'){
  if(bytes.length<54)throw Error('Invalid bitmap');
  const width=bytes.readInt32LE(18),height=Math.abs(bytes.readInt32LE(22));
  if(width<=0||height<=0||width*height>limitInputPixels)throw Error('Image is too large');
  const {default:bmp}=await import('bmp-js');
  const decoded=bmp.decode(bytes),rgba=Buffer.alloc(decoded.width*decoded.height*4);
  for(let i=0;i<rgba.length;i+=4){rgba[i]=decoded.data[i+3];rgba[i+1]=decoded.data[i+2];rgba[i+2]=decoded.data[i+1];rgba[i+3]=255;}
  input=await sharp(rgba,{raw:{width:decoded.width,height:decoded.height,channels:4}}).png().toBuffer();
 }
 const encode=(buffer:Buffer)=>sharp(buffer,{limitInputPixels}).rotate().resize(aspect?{width:800,height:Math.round(800/aspect),fit:'cover'}:{width:4096,height:4096,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toBuffer();
 try{return await encode(input)}catch(error){
  const brands=bytes.subarray(8,64).toString('ascii');
  if(bytes.subarray(4,8).toString()!=='ftyp'||!/(heic|heix|hevc|hevx|mif1|msf1)/.test(brands))throw error;
  const {default:convertHeic}=await import('heic-convert');
  input=Buffer.from(await convertHeic({buffer:bytes,format:'PNG'}));
  return encode(input);
 }
}
