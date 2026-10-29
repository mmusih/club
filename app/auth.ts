import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash } from 'node:crypto';
import { database } from '../db/mysql';
import {adminAccounts} from './admin-accounts';
export const sessionCookie = 'club_session';
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');
export function credentialVersion(passwordHash=process.env.ADMIN_PASSWORD_HASH || '') { return tokenHash(passwordHash); }
export function safeReturnPath(value: string) {
  return (value === '/admin' || value.startsWith('/admin/')) && !value.includes('\\') ? value : '/admin';
}
export async function getAdminUser() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await database().prepare('SELECT email, credential_version FROM admin_sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(tokenHash(token), new Date().toISOString()).first<{email: string; credential_version: string}>();
  const account=row&&adminAccounts().find(account=>account.email===row.email);
  if (!row || !account || row.credential_version !== credentialVersion(account.passwordHash)) return null;
  return { email:account.email, displayName:account.email };
}
export async function requireAdminUser(returnTo: string) {
  const user = await getAdminUser();
  if (user) return user;
  redirect('/admin/login?return_to=' + encodeURIComponent(safeReturnPath(returnTo)));
}
