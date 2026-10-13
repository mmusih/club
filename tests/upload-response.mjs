import assert from 'node:assert/strict';
import {readUploadResponse,preparePortrait,uploadPortrait} from '../app/upload-photo.ts';
const url='/media/1234-abcd.webp';
assert.deepEqual(await readUploadResponse(Response.json({url})),{url});
for(const [status,pattern] of [[413,/too large/],[403,/blocked/],[404,/missing/],[405,/missing/],[500,/unavailable/],[502,/unavailable/],[200,/unavailable/],[401,/session/]]){
 await assert.rejects(readUploadResponse(new Response('<!DOCTYPE html><h1>Host error</h1>',{status,headers:{'content-type':'text/html'}})),pattern);
}
await assert.rejects(readUploadResponse(Response.json({error:'Unsupported image'},{status:400})),/Unsupported image/);
for(const body of [null,{},[],{url:'https://example.com/photo.jpg'},{url:42}])await assert.rejects(readUploadResponse(Response.json(body)));
const redirect=new Response('<html>Sign in</html>');Object.defineProperty(redirect,'redirected',{value:true});await assert.rejects(readUploadResponse(redirect),/session/);
await assert.rejects(readUploadResponse(new Response('{broken',{headers:{'content-type':'application/json'}})),/unavailable/);
const file=new File([Buffer.alloc(2000)],'large.jpg',{type:'image/jpeg'});
let closed=0,canvas;
globalThis.createImageBitmap=async()=>({width:4000,height:3000,close(){closed++}});
globalThis.document={createElement(){canvas={width:0,height:0,getContext(){return {drawImage(){}}},toBlob(resolve,type){resolve(new Blob([Buffer.alloc(100)],{type}))}};return canvas}};
const reduced=await preparePortrait(file,1024);assert.equal(canvas.width,1024);assert.equal(canvas.height,768);assert.equal(reduced.type,'image/webp');assert.equal(closed,1);
let sent;
globalThis.fetch=async(_url,options)=>{sent=options.body.get('file');return Response.json({url})};
assert.deepEqual(await uploadPortrait(file,'headshot'),{url});assert.equal(sent.size,100);assert.equal(canvas.width,1024);
await uploadPortrait(file,'photo');assert.equal(canvas.width,2048);
globalThis.createImageBitmap=async()=>{throw Error('HEIC not supported by browser')};assert.equal(await preparePortrait(file,1024),file);
globalThis.fetch=async()=>{throw Error('network')};await assert.rejects(uploadPortrait(file,'photo'),/connection/);
await assert.rejects(preparePortrait(new File([],'empty.jpg'),1024),/empty/);
console.log('PASS: HTML hosting errors, redirects, malformed responses, valid uploads, portrait resizing, decoder fallback and network failures.');
