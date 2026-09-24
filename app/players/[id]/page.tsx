import {notFound} from 'next/navigation';
import {findPublicPlayer,publicPlayers} from '../../player-storage';
import {readContent} from '../../storage';
import Header from '../header';
import Profile from '../profile';
import {samplePlayers} from '../../sample-players';
async function visiblePlayer(id:string){if(id.startsWith('sample-'))return (await publicPlayers()).length?null:samplePlayers.find(p=>p.id===id)??null;return findPublicPlayer(id);}
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;try{const p=await visiblePlayer(id);return {title:p?p.name+' | Player profile':'Player not found',robots:p?undefined:{index:false,follow:false}}}catch{return {title:'Player profile'}}}
export default async function PlayerPage({params}:{params:Promise<{id:string}>}){const {id}=await params;let data;try{const [player,{content}]=await Promise.all([visiblePlayer(id),readContent()]);data={player,content}}catch{return <main className="section"><h1>Profile temporarily unavailable.</h1><a className="button navy" href={'/players/'+encodeURIComponent(id)}>Try again</a></main>}if(!data.player)notFound();return <><Header name={data.content.name} logo={data.content.logo}/><Profile player={data.player} club={data.content.name} email={data.content.email} phone={data.content.phone}/></>}
