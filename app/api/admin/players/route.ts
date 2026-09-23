import {listPlayers} from '../../../player-storage';
import {canEdit} from '../../../storage';
export const dynamic='force-dynamic';
export async function GET(){try{if(!await canEdit())return Response.json({error:'Editor access required.'},{status:403});return Response.json({players:await listPlayers(true)},{headers:{'Cache-Control':'no-store'}})}catch(e){console.error(e);return Response.json({error:'Could not load players. Please try again.'},{status:503})}}
