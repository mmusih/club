import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import sharp from 'sharp';
globalThis.uploadTest={authorised:true,sameOrigin:true,stored:null,storageFails:false};
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.ts',context);throw error}},load(url,context,next){
 if(url.endsWith('/app/storage.ts'))return {format:'module',shortCircuit:true,source:'export const canEdit=async()=>globalThis.uploadTest.authorised;export const sameOrigin=()=>globalThis.uploadTest.sameOrigin;'};
 if(url.endsWith('/lib/media.ts'))return {format:'module',shortCircuit:true,source:'export async function saveMedia(id,bytes,type){if(globalThis.uploadTest.storageFails)throw Error("Storage unavailable");globalThis.uploadTest.stored={id,bytes,type}}'};
 if(process.argv.includes('--missing-decoder')&&url.endsWith('/lib/photo-upload.ts'))throw Error('Simulated missing server decoder');
 return next(url,context);
}});
const {POST}=await import('../app/api/upload/route.ts');
const source=await sharp({create:{width:8,height:6,channels:3,background:'red'}}).jpeg().toBuffer();
function request(bytes=source){const body=new FormData();body.append('file',new File([bytes],'portrait.jpeg',{type:'image/jpeg'}));return new Request('http://localhost/api/upload',{method:'POST',body})}
const originalError=console.error;console.error=()=>{};
try{
 if(process.argv.includes('--missing-decoder')){const response=await POST(request());assert.equal(response.status,503);assert.match((await response.json()).error,/reinstall dependencies/);console.log('PASS: missing photo decoder returns JSON instead of an HTML crash page.');}
 else{
  globalThis.uploadTest.authorised=false;assert.equal((await POST(request())).status,401);globalThis.uploadTest.authorised=true;
  globalThis.uploadTest.sameOrigin=false;assert.equal((await POST(request())).status,403);globalThis.uploadTest.sameOrigin=true;
  assert.equal((await POST(request(Buffer.from('invalid')))).status,400);
  assert.equal((await POST(request(Buffer.alloc(0)))).status,400);
  const response=await POST(request());assert.equal(response.status,200);const {url}=await response.json();assert.match(url,/^\/media\/.*\.webp$/);assert.equal(globalThis.uploadTest.stored.type,'image/webp');assert.equal((await sharp(globalThis.uploadTest.stored.bytes).metadata()).width,8);
  globalThis.uploadTest.storageFails=true;const failure=await POST(request());assert.equal(failure.status,503);assert.match((await failure.json()).error,/upload failed/);
  console.log('PASS: upload route authorisation, image validation, conversion, storage handoff and JSON storage errors.');
 }
}finally{console.error=originalError}
