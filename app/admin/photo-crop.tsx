'use client';
import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {cropGeometry} from '../photo-geometry';

export default function PhotoCrop({file,src,aspect=1,onCancel,onApply}:{file?:File;src?:string;aspect?:number;onCancel:()=>void;onApply:(file:File)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),image=useRef<HTMLImageElement|null>(null);
 const drag=useRef<{x:number;y:number;horizontal:number;vertical:number}|null>(null);
 const [zoom,setZoom]=useState(1),[x,setX]=useState(50),[y,setY]=useState(50),[rotation,setRotation]=useState(0),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const photo=new Image();let disposed=false;let objectUrl:string|undefined;
  photo.onload=()=>{if(!disposed){image.current=photo;setReady(true)}};
  photo.onerror=()=>{if(!disposed)setError('This photo could not be previewed. Choose a JPG, PNG or WebP image, or retry loading the saved photo.')};
  async function load(){
   try{
    let source=file;
    if(!source){
     if(!src)throw Error('Choose a photo first.');
     const url=new URL(src,window.location.origin);
     if(url.origin!==window.location.origin)throw Error('To edit an external photo, download it and choose Replace photo.');
     const response=await fetch(url,{credentials:'same-origin'});
     if(!response.ok)throw Error('Could not load the saved photo. Please retry.');
     source=new File([await response.blob()],'saved-photo');
    }
    if(!source.size||source.size>32*1024*1024)throw Error('Choose a non-empty photo smaller than 32 MB.');
    if(disposed)return;
    objectUrl=URL.createObjectURL(source);photo.src=objectUrl;
   }catch(e){if(!disposed)setError(e instanceof Error?e.message:'Could not load this photo.')}
  }
  void load();
  return()=>{disposed=true;photo.onload=null;photo.onerror=null;if(objectUrl)URL.revokeObjectURL(objectUrl);image.current=null};
 },[file,src]);
 useEffect(()=>{
  const target=canvas.current,photo=image.current;if(!ready||!target||!photo)return;
  const ctx=target.getContext('2d');if(!ctx)return;
  const g=cropGeometry(photo.naturalWidth,photo.naturalHeight,aspect,zoom,rotation,x,y);
  ctx.resetTransform();ctx.clearRect(0,0,target.width,target.height);
  ctx.translate(target.width/2,target.height/2);ctx.rotate(g.radians);ctx.scale(g.scale,g.scale);
  ctx.drawImage(photo,-photo.naturalWidth/2+g.offsetX,-photo.naturalHeight/2+g.offsetY);
  ctx.resetTransform();
 },[ready,zoom,x,y,rotation,aspect]);
 async function apply(){
  setBusy(true);setError('');
  try{const blob=await new Promise<Blob|null>(resolve=>canvas.current!.toBlob(resolve,'image/webp',0.9));if(!blob)throw Error('Could not crop this photo.');onApply(new File([blob],'cropped-portrait.webp',{type:blob.type}))}
  catch(e){setError(e instanceof Error?e.message:'Could not crop this photo.')}
  finally{setBusy(false)}
 }
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onCancel()}}><DialogContent className="photo-crop-dialog"><DialogTitle>Edit photo</DialogTitle><DialogDescription>Drag the photo or use the controls. The frame shows exactly what will be saved. Apply the photo, then save your changes to update the website.</DialogDescription>{error&&<p role="alert">{error}</p>}{!ready&&!error&&<p role="status">Loading photo…</p>}<figure className="crop-frame"><canvas ref={canvas} width={800} height={Math.round(800/aspect)} aria-label="Live cropped photo preview" style={{aspectRatio:aspect}} onPointerDown={e=>{if(!ready||busy)return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,horizontal:x,vertical:y}}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onPointerMove={e=>{
   const start=drag.current,photo=image.current;if(!start||!photo)return;
   const g=cropGeometry(photo.naturalWidth,photo.naturalHeight,aspect,zoom,rotation,x,y);
   const factor=800/e.currentTarget.getBoundingClientRect().width/g.scale,dx=(e.clientX-start.x)*factor,dy=(e.clientY-start.y)*factor;
   const clamp=(n:number)=>Math.min(100,Math.max(0,n));
   setX(g.maxX?clamp(start.horizontal+(dx*Math.cos(g.radians)+dy*Math.sin(g.radians))/g.maxX*50):50);
   setY(g.maxY?clamp(start.vertical+(-dx*Math.sin(g.radians)+dy*Math.cos(g.radians))/g.maxY*50):50);
  }}/><figcaption>{aspect===0.8?'Public portrait · 4:5 frame':'Square photo · 1:1 frame'} · live preview</figcaption></figure>{ready&&<fieldset disabled={busy} className="crop-controls"><label>Zoom<input type="range" min="1" max="4" step="0.01" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><label>Rotate ({rotation}°)<input type="range" min="-180" max="180" step="1" value={rotation} onChange={e=>setRotation(Number(e.target.value))}/></label><label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={e=>setX(Number(e.target.value))}/></label><label>Vertical position<input type="range" min="0" max="100" value={y} onChange={e=>setY(Number(e.target.value))}/></label><button type="button" className="button outline" onClick={()=>{setZoom(1);setX(50);setY(50);setRotation(0)}}>Reset crop</button></fieldset>}<div className="dialog-actions"><button type="button" className="button outline" disabled={busy} onClick={onCancel}>Cancel</button>{!ready&&error&&file&&file.size>0&&file.size<=32*1024*1024&&<button type="button" className="button outline" onClick={()=>onApply(file)}>Upload original</button>}<button type="button" className="button navy" disabled={!ready||busy} onClick={()=>void apply()}>Use edited photo</button></div></DialogContent></Dialog>;
}
