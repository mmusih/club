'use client';
export default function ExtraContacts({label,type,values,onChange}:{label:string;type:'email'|'tel';values:string[];onChange:(values:string[])=>void}) {
  return <div className="extra-contacts"><strong>{label}</strong>{values.map((value,index)=><div key={index}><input aria-label={`${label} ${index+1}`} type={type} value={value} onChange={e=>onChange(values.map((v,i)=>i===index?e.target.value:v))}/><button type="button" className="plain-danger" aria-label={`Remove ${label.toLowerCase()} ${index+1}`} onClick={()=>onChange(values.filter((_,i)=>i!==index))}>Remove</button></div>)}<button type="button" className="button outline" disabled={values.length>=5} onClick={()=>onChange([...values,''])}>Add {type==='email'?'email':'phone number'}</button></div>;
}
