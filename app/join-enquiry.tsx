'use client';
import {useState, type FormEvent} from 'react';
import {ArrowUpRight} from 'lucide-react';
import type {Content} from './content';

export default function JoinEnquiry({content}: {content: Content}) {
  const [team, setTeam] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  function compose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = `Joining enquiry — ${team || 'Help choosing a team'}`;
    const body = `Hello ${content.name},\n\nI would like to enquire about ${team || 'joining the academy'}.\n\n${message.trim()}\n\nFrom: ${name.trim()}\n\nPlease let me know about training times, fees and the next steps.`;
    window.location.href = `mailto:${content.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  return <form className="join-enquiry" onSubmit={compose}>
    <label>Your name<input required maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Team<select value={team} onChange={e=>setTeam(e.target.value)}><option value="">Help me choose a team</option>{content.programmes.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select></label>
    <label>What would you like to know? <span>(optional)</span><textarea maxLength={1000} rows={3} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask about joining, training or a trial session."/></label>
    <button className="button navy" type="submit">Continue to email <ArrowUpRight size={20}/></button>
    <p className="enquiry-note">This opens your email app. Review and send your message there. No enquiry is submitted or saved by this form. Please leave private player documents out of your message.</p>
  </form>;
}
