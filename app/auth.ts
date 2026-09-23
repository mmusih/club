import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash } from 'node:crypto';
import { database } from '../db/mysql';
export const sessionCookie = 'club_session';
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');
export function credentialVersion() { return tokenHash(process.env.ADMIN_PASSWORD_HASH || ''); }
export function safeReturnPath(value: string) {
  return (value === '/admin' || value.startsWith('/admin/')) && !value.includes('\\') ? value : '/admin';
}
export async function getAdminUser() {
  const token = (await cookies()).get(sessionCookie)?.value;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!token || !/^[a-f0-9]{64}$/.test(token) || !email || !process.env.ADMIN_PASSWORD_HASH) return null;
  const row = await database().prepare('SELECT email, credential_version FROM admin_sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(tokenHash(token), new Date().toISOString()).first<{email: string; credential_version: string}>();
  if (!row || row.email !== email || row.credential_version !== credentialVersion()) return null;
  return { email, displayName: email };
}
export async function requireAdminUser(returnTo: string) {
  const user = await getAdminUser();
  if (user) return user;
  redirect('/admin/login?return_to=' + encodeURIComponent(safeReturnPath(returnTo)));
}
