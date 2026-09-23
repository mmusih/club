import {requireAdminUser} from '../../auth';
import {readContent} from '../../storage';
import {listPlayers} from '../../player-storage';
import PlayerManager from './manager';
export const dynamic='force-dynamic';
export const metadata={title:'Manage players | Club dashboard',robots:{index:false,follow:false}};
export default async function AdminPlayers(){
 await requireAdminUser('/admin/players');
 let data;try{data=await Promise.all([readContent(),listPlayers(true)]);}catch{return <main className="section"><h1>Players could not be loaded.</h1><p>Please try again. Existing profiles have not been changed.</p><a className="button navy" href="/admin/players">Try again</a></main>;}
 const [{content},players]=data;return <PlayerManager initial={players} club={content.name}/>;
}
