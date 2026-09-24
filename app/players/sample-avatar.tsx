'use client';
import {useState, type CSSProperties} from 'react';

const characters = [
  {skin:'#a96946',hair:'#20252d',kit:'#d5f36a',accent:'#173143',back:'#dce8bf',style:0},
  {skin:'#edba8f',hair:'#8d422d',kit:'#f4a46b',accent:'#512d40',back:'#f1d6c4',style:1},
  {skin:'#744831',hair:'#1c2330',kit:'#89c8d2',accent:'#153647',back:'#cee7e8',style:2},
  {skin:'#c6875d',hair:'#342923',kit:'#b5a5df',accent:'#362f55',back:'#e1dbee',style:3},
  {skin:'#895337',hair:'#251f2b',kit:'#f3c658',accent:'#2d3d39',back:'#f2e8bf',style:4},
];

export default function SampleAvatar({id,name,number}:{id:string;name:string;number:number|''}) {
  const c=characters[Math.max(0,(Number(id.split('-')[1])||1)-1)%characters.length];
  const [paused,setPaused]=useState(false);
  return <div className={'sample-avatar'+(paused?' is-paused':'')} style={{'--avatar-bg':c.back} as CSSProperties}>
    <svg viewBox="0 0 360 400" role="img" aria-label={'Animated fictional football character for '+name}>
      <circle cx="180" cy="184" r="142" fill="white" opacity=".36"/>
      <path d="M20 328H340M65 346H295" stroke="white" strokeWidth="2" opacity=".5"/>
      <text x="285" y="114" fill={c.accent} opacity=".1" fontSize="90" fontWeight="900" textAnchor="middle">{number}</text>
      <ellipse cx="179" cy="370" rx="86" ry="12" fill={c.accent} opacity=".12"/>
      <g className="avatar-body" stroke={c.accent} strokeWidth="3" strokeLinejoin="round">
        {c.style===4&&<path d="M212 89Q288 72 269 160L233 186 219 132" fill={c.hair}/>}
        <path d="M140 306L143 350 163 350 170 309M190 309L197 350 218 350 221 306" fill={c.skin}/>
        <path d="M141 333H165V356H139ZM195 333H219L221 356H197Z" fill="white"/>
        <path d="M139 350Q120 357 128 366H168L165 351ZM197 351L221 350Q240 357 235 366H195Z" fill={c.accent}/>
        <path d="M130 271H231L223 319H189L180 290 170 319H136Z" fill={c.accent}/>
        <path d="M127 193Q108 211 100 259Q99 276 113 279Q127 278 129 264L148 215" fill={c.skin}/>
        <g className="avatar-wave">
          <path d="M220 198L251 220 270 183Q275 174 283 180Q291 185 286 199L265 243Q259 256 245 248L214 230" fill={c.skin}/>
          <path d="M270 186L268 170Q268 164 273 164L279 177 283 160Q286 155 289 160L288 179Q300 174 300 181L284 199" fill={c.skin}/>
          {c.style===1&&<path d="M268 190L268 169 276 163 281 173 285 157 294 162 292 177 304 177 304 188 286 205Z" fill="#f9f9e9"/>}
        </g>
        <path d="M151 181L126 190 112 218 136 233 130 278Q180 292 231 278L223 233 243 223 231 195 208 182Z" fill={c.kit}/>
        <path d="M151 181L178 219 208 182M136 233L141 265M223 233L218 265" fill="none"/>
        <path d="M160 161V190Q179 208 198 190V160" fill={c.skin}/>
        <path d="M160 181Q179 193 198 181V166H160Z" fill={c.accent} opacity=".14" stroke="none"/>
        <circle cx="140" cy="126" r="13" fill={c.skin}/><circle cx="217" cy="126" r="13" fill={c.skin}/>
        <rect x="139" y="68" width="80" height="109" rx="37" fill={c.skin}/>
        <path d={c.style===1?'M136 112Q119 78 144 61Q173 33 203 62Q233 58 222 111L202 84 175 98 150 87Z':c.style===3?'M136 109Q126 59 167 57L199 56Q229 64 220 111L205 84 146 90Z':'M136 112Q124 93 132 78Q127 62 145 61Q150 41 168 53Q186 37 200 53Q224 48 226 72Q239 90 220 115L207 90Q177 104 149 89Z'} fill={c.hair}/>
        {c.style===2&&<path d="M143 84L151 60M161 88L169 58M180 88L186 57M201 85L202 63" stroke="#4b4551" strokeWidth="5"/>}
        <path d="M151 116L163 113M193 113L205 116" fill="none" strokeLinecap="round"/>
        <g className="avatar-eyes" fill={c.accent} stroke="none"><ellipse cx="158" cy="125" rx="3.5" ry="5"/><ellipse cx="198" cy="125" rx="3.5" ry="5"/></g>
        <path d="M177 124L174 139H180" fill="none" opacity=".4" strokeLinecap="round"/>
        <path d="M163 148Q178 166 195 148Z" fill="white" strokeWidth="2"/>
        <circle cx="151" cy="141" r="7" fill="#e98d7e" opacity=".4" stroke="none"/><circle cx="206" cy="141" r="7" fill="#e98d7e" opacity=".4" stroke="none"/>
        <text x="180" y="259" textAnchor="middle" fill={c.accent} stroke="none" fontFamily="Arial,sans-serif" fontSize="34" fontWeight="900">{number}</text>
        <path d="M207 210L216 213V223L211 228 206 223Z" fill="white" strokeWidth="1.5"/>
      </g>
      <g className="avatar-ball" stroke={c.accent} strokeWidth="2">
        <circle cx="277" cy="337" r="27" fill="#fffef5"/>
        <path d="M277 323L289 332 284 345H270L265 332Z" fill={c.accent}/>
        <path d="M277 323V310M289 332L302 328M284 345L291 359M270 345L261 358M265 332L252 329" fill="none"/>
      </g>
    </svg>
    <button className="avatar-motion" type="button" aria-label={(paused?'Play':'Pause')+' character animation for '+name} aria-pressed={paused} onClick={e=>{e.preventDefault();e.stopPropagation();setPaused(!paused)}}>{paused?'▶':'Ⅱ'}</button>
  </div>;
}
