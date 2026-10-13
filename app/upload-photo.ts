/** Hosting errors and expired sessions can return HTML, even for an API request. */
export async function readUploadResponse(response:Response):Promise<{url:string}>{
 if(response.redirected||response.status===401)throw new Error('Your session may have expired. Sign in again in another tab, then retry the upload. Your unsaved edits are still here.');
 const fallback=response.status===413?'The server rejected the photo because it is too large. Choose a smaller image and try again.':response.status===403?'The hosting server blocked the upload. This does not necessarily mean you are signed out. Retry with a smaller photo; if it continues, ask the administrator to check the hosting firewall and allowed website addresses.':response.status===404||response.status===405?'The photo upload service is missing from this deployment. Ask the site administrator to redeploy the latest website.':`The photo upload service is unavailable (HTTP ${response.status}). Please try again; if it continues, ask the site administrator to check the server logs.`;
 let body:unknown;
 try{body=JSON.parse(await response.text())}catch{throw new Error(fallback)}
 if(!body||typeof body!=='object')throw new Error(fallback);
 const data=body as {url?:unknown;error?:unknown};
 if(!response.ok)throw new Error(typeof data.error==='string'&&data.error.trim()?data.error:fallback);
 if(typeof data.url!=='string'||!/^\/media\/[a-f0-9-]+\.(jpg|png|webp)$/.test(data.url))throw new Error('The server did not confirm a saved photo. Please retry the upload.');
 return {url:data.url};
}

/** Keep portraits comfortably below common hosting request limits. */
export async function preparePortrait(file:File,maxDimension:number):Promise<File>{
 if(!file.size)throw new Error('This photo is empty. Choose another image.');
 if(file.size>32*1024*1024)throw new Error('Choose a photo smaller than 32 MB.');
 let bitmap:ImageBitmap|undefined;
 try{
  bitmap=await createImageBitmap(file);
  const ratio=Math.min(1,maxDimension/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  const context=canvas.getContext('2d');if(!context)return file;
  context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',0.88));
  if(!blob||blob.size>=file.size&&ratio===1)return file;
  return new File([blob],'portrait.'+(blob.type==='image/webp'?'webp':'png'),{type:blob.type});
 }catch{
  // HEIC and TIFF may need the server decoder rather than the browser decoder.
  return file;
 }finally{bitmap?.close()}
}

export async function uploadPortrait(file:File,field:'photo'|'headshot'){
 const prepared=await preparePortrait(file,field==='headshot'?1024:2048);
 if(prepared.size>8*1024*1024)throw new Error('This photo could not be reduced below 8 MB. Choose a smaller image.');
 const form=new FormData();form.append('file',prepared);
 let response:Response;
 try{response=await fetch('/api/upload',{method:'POST',body:form,headers:{Accept:'application/json'},credentials:'same-origin'})}catch{throw new Error('The upload could not reach the server. Check your connection and try again.')}
 return readUploadResponse(response);
}
