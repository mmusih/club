import Link from 'next/link';
import Club from './club';
import {readContent} from './storage';
export const dynamic='force-dynamic';
export async function generateMetadata(){try{const {content}=await readContent();return {title:content.name+' | Youth Football Club',description:content.intro}}catch{return {title:'Youth Football Club'}}}
export default async function Home(){
 let data;try{data=await readContent();}catch{return <main className="section"><h1>We’ll be back on the pitch soon.</h1><p>Club information is temporarily unavailable. Please refresh in a moment.</p><Link className="button navy" href="/">Try again</Link></main>;}
 return <Club initial={data.content}/>;
}
