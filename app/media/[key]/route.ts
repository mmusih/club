import { readMedia } from '../../../lib/media';
export const dynamic = 'force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{key:string}>}) {
  const {key}=await params;
  if(!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(key)) return new Response('Not found',{status:404});
  try {
    const file=await readMedia(key);
    if(!file) return new Response('Not found',{status:404});
    return new Response(new Uint8Array(file.body),{headers:{'Content-Type':file.contentType,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
  } catch { return new Response('Image temporarily unavailable',{status:503}); }
}
