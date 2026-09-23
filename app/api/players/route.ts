import {publicPlayers} from '../../player-storage';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json({players:await publicPlayers()},{headers:{'Cache-Control':'no-store'}})}catch(e){console.error(e);return Response.json({error:'Player profiles are temporarily unavailable.'},{status:503})}}
