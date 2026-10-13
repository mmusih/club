'use client';
import {removeDemoContent,demoContentCount} from '../demo-content';
import type {Content} from '../content';
import {samplePlayers} from '../sample-players';

export default function DemoEditor({content, onChange}: {content:Content;onChange:(content:Content)=>void}) {
  const ids=content.demoPlayerIds||[];
  const count=demoContentCount(content);
  function removeAll(){onChange(removeDemoContent(content))}
  return <section className="edit-panel"><h2>Demo content</h2><p>The delivery includes fictional examples to show the completed design. They are labelled Demo or Sample publicly. Demo players are separate from real player records and do not represent guardian permission.</p><p>Remove all demo content clears labelled examples, demo competitions, schedules, logos, photos and supporters too. Untick a demo player below to remove its public card and profile.</p>{samplePlayers.map(player=><label className="section-visibility-row" key={player.id}><span><strong>{player.name}</strong><small>{player.ageGroup} · {player.position}</small></span><input type="checkbox" checked={ids.includes(player.id)} onChange={e=>onChange({...content,demoPlayerIds:e.target.checked?[...ids,player.id]:ids.filter(id=>id!==player.id)})}/></label>)}<button type="button" className="button outline" disabled={!count} onClick={removeAll}>Remove all demo content ({count})</button><p className="hint">Review, then Publish changes. Discard changes can undo removal before publishing. Remove a demo entry before creating a real replacement so the cleanup button never removes your real records. Real players, contacts and unlabelled academy content are kept.</p></section>;
}
