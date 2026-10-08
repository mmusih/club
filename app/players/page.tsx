import Link from 'next/link';
import {readContent} from '../storage';
import {publicPlayers} from '../player-storage';
import Directory from './directory';
import Header from './header';

export const dynamic='force-dynamic';
export const metadata={title:'Our players | Football Academy'};
export default async function Players(){
 let data;try{data=await Promise.all([readContent(),publicPlayers()]);}catch{return <main className="section"><h1>Players are temporarily unavailable.</h1><p>Please try again in a moment.</p><Link className="button navy" href="/players">Try again</Link></main>;}
 const [{content},players]=data;return <><Header name={content.name} logo={content.logo} sections={content.sections}/><Directory players={players} cover={content.hero} club={content.name}/></>;
}
