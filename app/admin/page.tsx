import {requireAdminUser} from '../auth';
import {readContent} from '../storage';
import Dashboard from './dashboard';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function Admin(){
 const user=await requireAdminUser('/admin');
 let data;try{data=await readContent(true);}catch{return <main className="section"><h1>Your dashboard is temporarily unavailable.</h1><p>Please refresh to try again. Your published content has not been changed.</p><a href="/admin" className="button navy">Try again</a></main>;}
 return <Dashboard initial={data.content} initialVersion={data.version} editor={user.displayName} allowed={true}/>;
}
