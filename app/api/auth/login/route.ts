import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { database, sameOrigin } from '../../../storage';
import { sessionCookie, tokenHash, credentialVersion, safeReturnPath } from '../../../auth';
import { verifyPassword } from '../../../../lib/password.mjs';
import {adminAccounts} from '../../../admin-accounts';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response('Invalid request origin.', {status: 403});
  const origin = new URL(process.env.APP_URL || request.url).origin;
  let returnTo = '/admin';
  const failure = (error: string) => NextResponse.redirect(new URL('/admin/login?error=' + error + '&return_to=' + encodeURIComponent(returnTo), origin), 303);
  try {
    if (Number(request.headers.get('content-length') || 0) > 4096) return new Response('Request too large', {status: 413});
    const raw = await request.text();
    if (raw.length > 4096) return new Response('Request too large', {status: 413});
    const form = new URLSearchParams(raw);
    returnTo = safeReturnPath(form.get('return_to') || '/admin');
    const accounts=adminAccounts();
    if (!accounts.length) return failure('unavailable');
    const email=(form.get('email')||'').trim().toLowerCase();
    const account=accounts.find(account=>account.email===email);
    // Preserve the primary account's existing throttle. Other accounts are independent.
    const attemptId=account&&email!==process.env.ADMIN_EMAIL?.trim().toLowerCase()?tokenHash(email):account?'admin':'admin:unknown';
    const now = new Date().toISOString();
    const reset = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    // Count attempts in MySQL so restarts and multiple instances cannot bypass the limit.
    await database().prepare('INSERT INTO login_attempts (id,attempts,reset_at) VALUES (?,1,?) ON DUPLICATE KEY UPDATE attempts = IF(reset_at <= ?,1,attempts+1), reset_at = IF(reset_at <= ?,?,reset_at)')
      .bind(attemptId, reset, now, now, reset).run();
    const attempt = await database().prepare('SELECT attempts FROM login_attempts WHERE id = ?').bind(attemptId).first<{attempts:number}>();
    if (!attempt || attempt.attempts > 10) return failure('limit');
    const validPassword = await verifyPassword(form.get('password') || '', account?.passwordHash||accounts[0].passwordHash);
    if (!account || !validPassword) return failure('invalid');
    const token = randomBytes(32).toString('hex');
    await database().prepare('INSERT INTO admin_sessions (token_hash,email,credential_version,expires_at) VALUES (?,?,?,?)')
      .bind(tokenHash(token), email, credentialVersion(account.passwordHash), new Date(Date.now() + 8 * 3600 * 1000).toISOString()).run();
    await database().prepare('DELETE FROM login_attempts WHERE id = ?').bind(attemptId).run();
    await database().prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now).run();
    const response = NextResponse.redirect(new URL(returnTo, origin), 303);
    response.cookies.set(sessionCookie, token, {httpOnly:true, secure: origin.startsWith('https://'), sameSite:'lax', path:'/', maxAge: 8 * 3600});
    return response;
  } catch { return failure('unavailable'); }
}
