import {teamBranding,teamKey} from '../../team-branding';
import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {readContent} from '../../storage';
import Header from '../../players/header';
import Photo from '../../photo';

export const dynamic = 'force-dynamic';
type Props = {params: Promise<{id: string}>};
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {id} = await params;
  const {content} = await readContent();
  const story = content.news.find(item=>item.id===id);
  if (!story) return {title:'Story not found', robots:{index:false}};
  return {
    title: `${story.title} | ${content.name}`,
    description: story.body.slice(0,160),
    openGraph: {type:'article', title:story.title, description:story.body.slice(0,160), images:[story.image || content.hero]},
    alternates: {canonical:`/news/${encodeURIComponent(id)}`},
  };
}
export default async function NewsStory({params}: Props) {
  const {id} = await params;
  const {content} = await readContent();
  const story = content.news.find(item=>item.id===id);
  if (!story) notFound();
  const date = new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeZone:'UTC'}).format(new Date(story.date+'T12:00:00Z'));
  return <><Header name={content.name} logo={teamBranding(content).logos[teamKey(content.name)]} sections={content.sections}/><main className="section news-article"><Link className="inline-link" href="/#news">← Back to club news</Link><article><p className="eyebrow dark">{story.category || 'Club news'} · <time dateTime={story.date}>{date}</time></p><h1>{story.title}</h1><Photo src={story.image || content.hero} alt="" sizes="(max-width: 900px) 100vw, 900px"/><div className="news-article-body">{story.body}</div></article></main></>;
}
