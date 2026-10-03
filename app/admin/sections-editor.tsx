'use client';
import {homepageSections,sectionVisible} from '../sections';
import type {Content} from '../content';
export default function SectionsEditor({content,onChange}:{content:Content;onChange:(content:Content)=>void}){
 return <section className="edit-panel"><h2>Choose what fans see</h2><p className="hint">Show or hide homepage sections, then publish your changes. Hidden sections keep their content and can be shown again. Their homepage navigation links are hidden too. Player profile pages remain available through their direct links.</p><div className="section-visibility-list">{homepageSections.map(s=><label className="section-visibility-row" key={s.id}><span><strong>{s.name}</strong><small>{sectionVisible(content,s.id)?'Shown on the homepage':'Hidden from the homepage'}</small></span><input type="checkbox" role="switch" aria-label={'Show '+s.name} checked={sectionVisible(content,s.id)} onChange={e=>onChange({...content,sections:{...content.sections,[s.id]:e.target.checked}})}/></label>)}</div></section>;
}
