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
