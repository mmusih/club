'use client';
import {useEffect,useState} from 'react';

export default function AdminSession(){
 const [notice,setNotice]=useState(''),[expired,setExpired]=useState(false);
 useEffect(()=>{
  let active=Date.now(),pending=false;
  const activity=()=>{active=Date.now()};
  async function check(){
   if(pending||document.visibilityState!=='visible'||Date.now()-active>10*60*1000)return;
   pending=true;
   try{
    const response=await fetch('/api/auth/session',{method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(15000)});
    setExpired(response.status===401);
    setNotice(response.ok?'':response.status===401?'Your session has expired. Sign in in another tab, then return here and retry. Your unsaved edits are still here.':response.status===403?'This website address is not authorised. Ask the administrator to check the allowed website addresses.':'The server is temporarily unavailable. Keep this page open; your edits are still here.');
   }catch{setExpired(false);setNotice('Connection interrupted. Keep this page open; your edits are still here. Reconnection will be checked automatically.')}
   finally{pending=false}
  }
  const resume=()=>{activity();void check()};
  window.addEventListener('pointerdown',activity);window.addEventListener('keydown',activity);window.addEventListener('online',resume);window.addEventListener('focus',resume);
  void check();const timer=setInterval(()=>void check(),60000);
  return()=>{clearInterval(timer);window.removeEventListener('pointerdown',activity);window.removeEventListener('keydown',activity);window.removeEventListener('online',resume);window.removeEventListener('focus',resume)};
 },[]);
 return notice?<div className="notice" role="status">{notice} {expired&&<a href="/admin/login" target="_blank" rel="noreferrer">Sign in</a>}</div>:null;
}
