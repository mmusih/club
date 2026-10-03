import type {SectionVisibility} from '../sections';
import Link from 'next/link';
import {Shield,ArrowLeft} from 'lucide-react';
export default function PlayerHeader({name,logo,sections}:{name:string;logo?:string;sections?:SectionVisibility}){return <header className="site-header player-site-header"><Link className="brand" href="/">{logo?<img className="club-logo" src={logo} alt=""/>:<Shield size={32}/>}<span>{name}<small>PLAYER DEVELOPMENT</small></span></Link><nav aria-label="Player navigation"><Link href="/">Our club</Link><Link href="/players">Squad</Link>{sections?.join!==false&&<Link href="/#join">Contact the club</Link>}</nav><Link href="/" className="text-link"><ArrowLeft size={17}/> Back to club</Link></header>}
