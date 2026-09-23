'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight} from 'lucide-react';
import type {Content} from './content';

export default function GalleryRow({category,photos,onSelect}:{category:string;photos:Content['photos'];onSelect:(photo:Content['photos'][number])=>void}){
 const track=useRef<HTMLDivElement>(null);
 const [edges,setEdges]=useState({start:true,end:false});
 useEffect(()=>{const el=track.current;if(!el)return;function measure(){if(el)setEdges({start:el.scrollLeft<6,end:el.scrollLeft+el.clientWidth>=el.scrollWidth-6})}measure();el.addEventListener('scroll',measure,{passive:true});const observer=new ResizeObserver(measure);observer.observe(el);return()=>{el.removeEventListener('scroll',measure);observer.disconnect()}},[photos]);
 function move(direction:number){const el=track.current;if(el)el.scrollBy({left:direction*el.clientWidth*.85,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 return <section className="gallery-category" aria-label={category}><div className="gallery-category-heading"><div><h3>{category}</h3><p>{photos.length} {photos.length===1?'photo':'photos'}</p></div><div className="gallery-arrows"><button aria-label={'Previous '+category+' photos'} disabled={edges.start} onClick={()=>move(-1)}><ArrowLeft size={20}/></button><button aria-label={'Next '+category+' photos'} disabled={edges.end} onClick={()=>move(1)}><ArrowRight size={20}/></button></div></div><div className="gallery-track" ref={track} tabIndex={0} role="region" aria-label={category+' photos; scroll horizontally'}>{photos.map(p=><button className="gallery-photo" key={p.id} onClick={()=>onSelect(p)}><img src={p.url} alt={p.caption} loading="lazy"/><span><b>{p.caption}</b><ArrowUpRight size={20}/></span></button>)}</div></section>;
}
