'use client';
import {useEffect} from 'react';

export default function ScrollEffects() {
 useEffect(()=>{
  const header=document.querySelector<HTMLElement>('.club-header');
  const hero=document.querySelector<HTMLElement>('.hero');
  const photo=document.querySelector<HTMLElement>('.hero-photo');
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const ribbon=document.querySelector<HTMLElement>('.club-mantra');
  const gallery=document.querySelector<HTMLElement>('#gallery');
  let frame=0,lastY=window.scrollY,direction=0,travel=0;
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target)}}),{threshold:0.08});
  const revealSelector='.section-heading,.about>div,.programme-card,.news-coming,.join>div,.gallery-category-heading,.gallery-track,.story-card,.fixtures-toolbar,.fixtures-scroll';
  function observeContent(){document.querySelectorAll<HTMLElement>(revealSelector).forEach((el,i)=>{if(el.classList.contains('scroll-reveal'))return;el.style.setProperty('--reveal-delay',`${i%3*70}ms`);el.classList.add('scroll-reveal');observer.observe(el)})}
  observeContent();
  const contentObserver=new MutationObserver(observeContent);
  const main=document.querySelector('main');
  if(main)contentObserver.observe(main,{childList:true,subtree:true});
  function update(){
   frame=0;
   const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
   const y=Math.max(0,Math.min(window.scrollY,max));
   const delta=y-lastY,nextDirection=Math.sign(delta);
   if(nextDirection&&nextDirection!==direction){travel=0;direction=nextDirection}
   travel+=Math.abs(delta);lastY=y;
   const keepVisible=y<(header?.offsetHeight||96)+80||!!header?.querySelector('.menu-toggle[aria-expanded="true"],:focus-visible');
   if(keepVisible){header?.classList.remove('nav-hidden');travel=0}
   else if(travel>12){header?.classList.toggle('nav-hidden',direction>0);travel=0}
   header?.classList.toggle('is-scrolled',y>35);
   header?.style.setProperty('--scroll-progress',String(max>0?y/max:0));
   if(photo&&hero)photo.style.transform=preference.matches?'none':`translate3d(0,${Math.min(y,hero.offsetHeight)*.17}px,0) scale(1.12)`;
   if(ribbon){const rect=ribbon.getBoundingClientRect();const progress=Math.max(-1,Math.min(1,(window.innerHeight/2-rect.top-rect.height/2)/window.innerHeight));ribbon.style.setProperty('--drift',preference.matches?'0px':`${progress*-85}px`)}
   if(gallery){const rect=gallery.getBoundingClientRect();gallery.style.setProperty('--gallery-drift',preference.matches?'0px':`${Math.max(-22,Math.min(22,(window.innerHeight/2-rect.top)*.025))}px`)}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update)}
  function closeMenu(e:KeyboardEvent){if(e.key==='Escape')document.querySelector<HTMLButtonElement>('.menu-toggle[aria-expanded="true"]')?.click()}
  function showNavigation(){header?.classList.remove('nav-hidden');travel=0}
  update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);preference.addEventListener('change',schedule);window.addEventListener('keydown',closeMenu);header?.addEventListener('focusin',showNavigation);
  return()=>{observer.disconnect();contentObserver.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);preference.removeEventListener('change',schedule);window.removeEventListener('keydown',closeMenu);header?.removeEventListener('focusin',showNavigation);header?.classList.remove('nav-hidden','is-scrolled');header?.style.removeProperty('--scroll-progress');document.querySelectorAll<HTMLElement>('.scroll-reveal').forEach(el=>{el.classList.remove('scroll-reveal','revealed');el.style.removeProperty('--reveal-delay')});photo?.style.removeProperty('transform');ribbon?.style.removeProperty('--drift');gallery?.style.removeProperty('--gallery-drift')};
 },[]);
 return null;
}
