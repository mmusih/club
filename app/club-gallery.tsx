'use client';
import {useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Expand} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import Photo from './photo';
import type {Content} from './content';

const pageSize=6;
export default function ClubGallery({photos}:{photos:Content['photos']}) {
 const [category,setCategory]=useState<string|null>(null),[page,setPage]=useState(0),[selected,setSelected]=useState<string|null>(null);
 const touch=useRef<{x:number;y:number}|null>(null);
 const collection=category===null?photos:photos.filter(p=>p.category===category);
 const index=collection.findIndex(p=>p.id===selected),active=collection[index];
 const pages=Math.ceil(collection.length/pageSize),currentPage=Math.min(page,Math.max(0,pages-1));
 const visible=collection.slice(currentPage*pageSize,(currentPage+1)*pageSize);
 function move(direction:number){if(collection.length)setSelected(collection[(index+direction+collection.length)%collection.length].id)}
 function chooseCategory(value:string|null){setCategory(value);setPage(0);setSelected(null)}
 return <section id="gallery" className="section gallery club-gallery">
  <div className="section-heading"><div><p className="eyebrow">THE MOMENTS THAT MAKE US</p><h2>THIS IS <em>OUR CLUB.</em></h2></div><p>Muddy boots. New friendships. Little victories.<br/>A look at life on and off the pitch.</p></div>
  <div className="gallery-collection-bar"><div className="filters" aria-label="Filter gallery"><button aria-pressed={category===null} className={category===null?'selected':''} onClick={()=>chooseCategory(null)}>All moments</button>{[...new Set(photos.map(p=>p.category))].map(value=><button key={value} aria-pressed={category===value} className={category===value?'selected':''} onClick={()=>chooseCategory(value)}>{value}</button>)}</div><span className="gallery-total">{collection.length} {collection.length===1?'moment':'moments'}</span></div>
  {collection.length?<><div className="moment-grid">{visible.map(p=><button key={p.id} className="moment-tile" aria-label={'Enlarge photo: '+p.caption} onClick={()=>setSelected(p.id)}><Photo src={p.url} alt="" loading="lazy" sizes="(max-width: 640px) 50vw, 33vw"/><span className="moment-category">{p.category}</span><span className="moment-caption"><b>{p.caption}</b><Expand size={17}/></span></button>)}</div><div className="gallery-browse"><p>Open a photo to explore the collection.</p><div className="gallery-pages" aria-label="Gallery pages">{pages>1&&<button aria-label="Previous gallery page" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}><ArrowLeft size={19}/></button>}<span role="status">{currentPage*pageSize+1}–{Math.min((currentPage+1)*pageSize,collection.length)} of {collection.length}</span>{pages>1&&<button aria-label="Next gallery page" disabled={currentPage===pages-1} onClick={()=>setPage(currentPage+1)}><ArrowRight size={19}/></button>}</div></div></>:<p className="gallery-empty">Our next chapter in pictures is coming soon.</p>}
  <Dialog open={!!active} onOpenChange={open=>{if(!open)setSelected(null)}}><DialogContent className="gallery-viewer" onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1)}}}>
   <div className="viewer-heading"><DialogTitle>{active?.caption}</DialogTitle><DialogDescription>{active?.category} · {index+1} of {collection.length}</DialogDescription></div>
   {active&&<><div className="viewer-stage" onTouchStart={event=>{const point=event.touches[0];touch.current={x:point.clientX,y:point.clientY}}} onTouchEnd={event=>{const start=touch.current;touch.current=null;if(!start)return;const point=event.changedTouches[0],dx=point.clientX-start.x,dy=point.clientY-start.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1)}}>
    <Photo key={active.id} src={active.url} alt={active.caption} loading="eager" sizes="(max-width: 1000px) 95vw, 1000px"/>
    {collection.length>1&&<><button className="viewer-prev" aria-label="Previous photo" onClick={()=>move(-1)}><ArrowLeft/></button><button className="viewer-next" aria-label="Next photo" onClick={()=>move(1)}><ArrowRight/></button></>}
   </div><p className="viewer-caption" aria-live="polite">{active.caption} <span>{index+1} / {collection.length}</span></p>
   {collection.length>1&&<><div className="viewer-thumbnails" aria-label="Choose a photo">{collection.map((p,i)=><button key={p.id} aria-label={'Show photo '+(i+1)+': '+p.caption} aria-current={p.id===selected?'true':undefined} onClick={()=>setSelected(p.id)}><Photo src={p.url} alt="" sizes="72px"/></button>)}</div><p className="viewer-help">Swipe or use the arrows to browse. Press Esc to close.</p></>}</>}
  </DialogContent></Dialog>
 </section>;
}
