import { seed, type Content } from './content';
import { getAdminUser } from './auth';
import { database } from '../db/mysql';
export { database };
export async function readContent() {
  const row = await database().prepare('SELECT body, version FROM site_content WHERE id = 1').first<{body: string; version: number}>();
  return row ? { content: { ...seed, ...JSON.parse(row.body) } as Content, version: row.version } : { content: seed, version: 0 };
}
export async function canEdit() { return !!await getAdminUser(); }
export function sameOrigin(request: Request) {
  const expected = process.env.APP_URL || (process.env.NODE_ENV !== 'production' ? new URL(request.url).origin : '');
  return !!expected && request.headers.get('origin') === new URL(expected).origin;
}
