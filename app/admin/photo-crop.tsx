'use client';
import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';

export default function PhotoCrop({file,aspect=1,onCancel,onApply}:{file:File;aspect?:number;onCancel:()=>void;onApply:(file:File)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),image=useRef<HTMLImageElement|null>(null);
 const [zoom,setZoom]=useState(1),[x,setX]=useState(50),[y,setY]=useState(50),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!file.size||file.size>32*1024*1024)return;
  const url=URL.createObjectURL(file),photo=new Image();
  photo.onload=()=>{image.current=photo;setReady(true)};
  photo.onerror=()=>setError('This browser cannot preview this format. Choose JPG, PNG or WebP to crop, or upload the original.');
  photo.src=url;
  return()=>{photo.onload=null;photo.onerror=null;URL.revokeObjectURL(url);image.current=null};
 },[file]);
 useEffect(()=>{
  const target=canvas.current,photo=image.current;if(!ready||!target||!photo)return;
  const ctx=target.getContext('2d');if(!ctx)return;
  const width=Math.min(photo.naturalWidth,photo.naturalHeight*aspect)/zoom,height=width/aspect;
  ctx.clearRect(0,0,target.width,target.height);
  ctx.drawImage(photo,(photo.naturalWidth-width)*x/100,(photo.naturalHeight-height)*y/100,width,height,0,0,target.width,target.height);
 },[ready,zoom,x,y,aspect]);
 async function apply(){
  setBusy(true);
  try{const blob=await new Promise<Blob|null>(resolve=>canvas.current!.toBlob(resolve,'image/webp',0.9));if(!blob)throw Error('Could not crop this photo.');onApply(new File([blob],'cropped-portrait.webp',{type:blob.type}))}
  catch(e){setError(e instanceof Error?e.message:'Could not crop this photo.')}
  finally{setBusy(false)}
 }
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onCancel()}}><DialogContent className="photo-crop-dialog"><DialogTitle>Crop profile photo</DialogTitle><DialogDescription>Zoom and adjust the position to choose what appears in the profile.</DialogDescription>{(!file.size||file.size>32*1024*1024)&&<p role="alert">Choose a non-empty photo smaller than 32 MB.</p>}{error&&<p role="alert">{error}</p>}<canvas ref={canvas} width={800} height={Math.round(800/aspect)} aria-label="Cropped photo preview" style={{width:'100%',maxHeight:'42vh',objectFit:'contain',background:'#eef0f3'}}/>{ready&&<div className="crop-controls"><label>Zoom<input type="range" min="1" max="4" step="0.01" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={e=>setX(Number(e.target.value))}/></label><label>Vertical position<input type="range" min="0" max="100" value={y} onChange={e=>setY(Number(e.target.value))}/></label></div>}<div className="dialog-actions"><button type="button" className="button outline" disabled={busy} onClick={onCancel}>Cancel</button>{!ready&&error&&<button type="button" className="button outline" onClick={()=>onApply(file)}>Upload original</button>}<button type="button" className="button navy" disabled={!ready||busy} onClick={()=>void apply()}>Use cropped photo</button></div></DialogContent></Dialog>;
}
