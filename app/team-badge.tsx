'use client';
import {useState} from 'react';
import {Shield} from 'lucide-react';
import {teamKey,type TeamBranding} from './team-branding';

export default function TeamBadge({name,branding,logo,showName=true,className=''}:{name:string;branding?:TeamBranding;logo?:string;showName?:boolean;className?:string}){
 const source=branding?.logos[teamKey(name)]||logo;const [failed,setFailed]=useState('');
 return <span className={'team-identity '+className}>{source&&failed!==source?<img className="team-badge-image" src={source} alt={showName?'':name+' logo'} loading="lazy" onError={()=>setFailed(source)}/>:<span className="team-badge-image team-badge-placeholder" role={showName?undefined:'img'} aria-label={showName?undefined:name+' — logo not added'} aria-hidden={showName||undefined}><Shield size={24}/><b>{name.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()}</b></span>}{showName&&<span className="team-identity-name">{name}</span>}</span>;
}
