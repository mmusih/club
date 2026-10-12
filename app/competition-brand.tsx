import Image from 'next/image';
export default function CompetitionBrand({name}:{name:string}){
 return <span className="competition-brand">{/\bTRFA\b|TSWAPONG REGIONAL/i.test(name)&&<><Image src="/competitions/trfa.jpg" width={44} height={48} alt="TRFA"/><Image src="/competitions/bfa.jpg" width={44} height={48} alt="Botswana Football Association"/></>}<span>{name}</span></span>;
}
