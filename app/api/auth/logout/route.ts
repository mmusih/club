import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { database, sameOrigin } from '../../../storage';
import { sessionCookie, tokenHash } from '../../../auth';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response('Invalid request origin.', {status:403});
  const token = (await cookies()).get(sessionCookie)?.value;
  if (token) await database().prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(tokenHash(token)).run();
  const response = NextResponse.redirect(new URL('/', process.env.APP_URL || request.url), 303);
  response.cookies.set(sessionCookie, '', {httpOnly:true, path:'/', maxAge:0, sameSite:'lax', secure: new URL(process.env.APP_URL || request.url).protocol === 'https:'});
  return response;
}
