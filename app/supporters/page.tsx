import {readContent} from '../storage';
import Supporters from './supporters';
export const dynamic='force-dynamic';
export const metadata={title:'Supporters · Eyes On The Ball Academy'};
export default async function SupportersPage(){const {content}=await readContent();return <Supporters name={content.name} items={content.supporters||[]}/>}
