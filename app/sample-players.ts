import type {PublicPlayer} from './player-model';

// Fictional preview content only. Never stored as players or permission records.
export const samplePlayers: PublicPlayer[] = [
  {name:'Alex — Sample', ageGroup:'Under 13', position:'Forward', foot:'Right', number:9, bio:'A lively forward who enjoys finding space and bringing teammates into the game. Alex is working on first-touch control, finishing with both feet and making confident runs behind the defence.'},
  {name:'Jamie — Sample', ageGroup:'Under 17', position:'Goalkeeper', foot:'Right', number:1, bio:'A calm goalkeeper with quick reactions and a strong voice behind the defence. Jamie enjoys organising the back line, starting attacks with accurate distribution and practising one-on-one saves.'},
  {name:'Sam — Sample', ageGroup:'Under 21', position:'Midfielder', foot:'Both', number:8, bio:'A creative midfielder who connects defence and attack with simple, thoughtful passing. Sam is developing awareness before receiving the ball and the confidence to dictate the tempo of a match.'},
  {name:'Jordan — Sample', ageGroup:'Under 13', position:'Defender', foot:'Left', number:4, bio:'A composed defender who reads the game and supports teammates on and off the pitch. Jordan focuses on well-timed tackles, aerial challenges and building possession from the back.'},
  {name:'Taylor — Sample', ageGroup:'Under 13', position:'Forward', foot:'Left', number:11, bio:'An energetic wide forward who likes taking on defenders and creating chances. Taylor is developing movement into the penalty area, accurate crossing and the ability to press as part of a team.'},
].map((p,index)=>({
  ...p, position:p.position as PublicPlayer['position'], foot:p.foot as PublicPlayer['foot'],
  id:'sample-'+(index+1), photo:'/images/players/demo-'+['alex','jamie','sam','jordan','taylor'][index]+'.png', updatedAt:'2026-10-05',
  bio:'Fictional sample profile for the website preview. '+p.bio,
  videos:[],
  matches:[
    {id:'sample-match-1',date:'2026-09-19',season:'2026/27',opponent:'Sample United',minutes:70,goals:p.position==='Forward'?2:0,assists:p.position==='Midfielder'?2:1,saves:p.position==='Goalkeeper'?6:0,contributions:[...(p.position==='Forward'?[{id:'sample-goal',kind:'goal' as const,minute:24,partner:'Sam — Sample'}]:[]),{id:'sample-assist',kind:'assist' as const,minute:61,partner:index===0?'Taylor — Sample':'Alex — Sample'}]},
    {id:'sample-match-2',date:'2026-09-12',season:'2026/27',opponent:'Demo Rovers',minutes:65,goals:p.position==='Forward'?1:0,assists:p.position==='Midfielder'?1:0,saves:p.position==='Goalkeeper'?4:0},
    {id:'sample-match-3',date:'2025-11-22',season:'2025/26',opponent:'Example City',minutes:60,goals:p.position==='Midfielder'?1:0,assists:p.position==='Forward'?1:0,saves:p.position==='Goalkeeper'?5:0},
  ],
}));
