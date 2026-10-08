'use client';
import Link from 'next/link';
export default function ErrorPage({reset}: {reset:()=>void}) {
  return <main className="section service-message"><h1>We couldn’t load this page.</h1><p>Please try again in a moment.</p><button className="button navy" onClick={reset}>Try again</button><Link className="inline-link" href="/">Back to the club</Link></main>;
}
