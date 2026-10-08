import Link from 'next/link';
export default function NotFound() {
  return <main className="section service-message"><p className="eyebrow dark">404 · PAGE NOT FOUND</p><h1>This page is off the pitch.</h1><p>The link may have changed. Head back to the club to find teams, news and contact details.</p><Link className="button navy" href="/">Back to the club</Link></main>;
}
