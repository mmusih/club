import { z } from 'zod';
import { imageUrl } from './validation';
export const positions=['Goalkeeper','Defender','Midfielder','Forward'] as const;
export function videoSource(value:string):{kind:'youtube'|'vimeo'|'file';src:string}|null {
 try {const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;
 const host=u.hostname.toLowerCase();
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(host)){
 const id=host==='youtu.be'?u.pathname.slice(1):u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1];
 return id&&/^[a-zA-Z0-9_-]{11}$/.test(id)?{kind:'youtube',src:'https://www.youtube-nocookie.com/embed/'+id}:null;
 }
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){const id=u.pathname.match(/^\/(?:video\/)?(\d+)$/)?.[1];return id?{kind:'vimeo',src:'https://player.vimeo.com/video/'+id}:null;}
 if(/\.(mp4|webm)$/i.test(u.pathname))return {kind:'file',src:u.href};return null;
 }catch{return null;}
}
const date=z.string().refine(s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s,'Enter a valid date.');
const recordId=z.string().uuid();
export const playerSchema=z.object({
 name:z.string().trim().min(1,'Enter a player display name.').max(100),ageGroup:z.string().trim().min(1,'Enter an age group.').max(40),position:z.enum(positions),foot:z.enum(['Right','Left','Both','Not specified']),number:z.union([z.literal(''),z.number().int().min(1).max(99)]),bio:z.string().trim().max(3000),photo:z.union([z.literal(''),imageUrl]),status:z.enum(['draft','published']),consent:z.boolean(),
 videos:z.array(z.object({id:recordId,title:z.string().trim().min(1,'Enter a video title, or remove this video entry.').max(120),url:z.string().max(2000).refine(s=>!!videoSource(s),'Use a YouTube, Vimeo, or HTTPS MP4/WebM link.')})).max(30),
 matches:z.array(z.object({id:recordId,date,season:z.string().trim().min(1,'Enter the season for this match.').max(30),opponent:z.string().trim().min(1,'Enter the opponent, or remove this match entry.').max(100),minutes:z.number().int().min(0).max(150),goals:z.number().int().min(0).max(50),assists:z.number().int().min(0).max(50),saves:z.number().int().min(0).max(100)})).max(300)
}).superRefine((p,ctx)=>{if(p.status==='published'&&!p.consent)ctx.addIssue({code:'custom',path:['consent'],message:'Record guardian permission before making a youth profile public.'});for(const k of ['matches','videos'] as const){if(new Set(p[k].map(x=>x.id)).size!==p[k].length)ctx.addIssue({code:'custom',path:[k],message:'Duplicate record IDs are not allowed.'});}});
export type PlayerData=z.infer<typeof playerSchema>;
export type Player=PlayerData & {id:string;version:number;updatedAt:string};
export type PublicPlayer=Omit<Player,'consent'|'status'|'version'>;
export function publicPlayer(p:Player):PublicPlayer{const {consent,status,version,...visible}=p;return visible;}
export function newPlayer():Player{return {id:crypto.randomUUID(),version:0,updatedAt:'',name:'',ageGroup:'',position:'Midfielder',foot:'Not specified',number:'',bio:'',photo:'',status:'draft',consent:false,videos:[],matches:[]};}
export function totals(matches:PlayerData['matches']){return matches.reduce((s,m)=>({appearances:s.appearances+1,minutes:s.minutes+m.minutes,goals:s.goals+m.goals,assists:s.assists+m.assists,saves:s.saves+m.saves}),{appearances:0,minutes:0,goals:0,assists:0,saves:0});}
export function formatDate(value:string){return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value));}

export function playerIssueMessage(issue: {path: (string|number)[]; message:string}) {
 const path=issue.path[0]==='player'?issue.path.slice(1):issue.path;
 const section=path[0]==='matches'?'Match':path[0]==='videos'?'Video':'';
 return section && typeof path[1]==='number' ? section+' '+(path[1]+1)+': '+issue.message : issue.message;
}
