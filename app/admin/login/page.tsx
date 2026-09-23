import { safeReturnPath } from '../../auth';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin sign in | Eyes On The Ball Academy', robots: { index: false, follow: false } };
export default async function Login({ searchParams }: { searchParams: Promise<{error?: string; return_to?: string}> }) {
  const params = await searchParams;
  return <main className="section" style={{maxWidth: 480, margin: '60px auto'}}>
    <Link href="/">← Back to website</Link><h1>Club admin sign in</h1>
    <p>Sign in to update the website and manage player profiles.</p>
    {params.error && <p role="alert">{params.error === 'limit' ? 'Too many attempts. Please try again in 15 minutes.' : params.error === 'unavailable' ? 'Sign in is temporarily unavailable. Please try again later.' : 'The email or password was not recognised.'}</p>}
    <form action="/api/auth/login" method="post" style={{display: 'grid', gap: 16}}>
      <input type="hidden" name="return_to" value={safeReturnPath(params.return_to || '/admin')}/>
      <label>Email<input style={{display:'block',width:'100%',padding:12}} type="email" name="email" autoComplete="username" required maxLength={254}/></label>
      <label>Password<input style={{display:'block',width:'100%',padding:12}} type="password" name="password" autoComplete="current-password" required maxLength={256}/></label>
      <button className="button navy" type="submit">Sign in</button>
    </form>
  </main>;
}
