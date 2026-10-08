import fs from 'node:fs';
import {seed} from '../app/content.ts';

// Preserve the original migration backup. Only the delivery copy receives demo content.
const bundle=JSON.parse(fs.readFileSync('outputs/content-migration.json','utf8'));
const original=bundle.site_content[0];
const content={...seed,...JSON.parse(original.body)};
Object.assign(content,{
  email:'info@eyesontheball.co.bw',
  additionalEmails:['shakes@eyesontheball.co.bw','gbranthoka@eyesontheball.co.bw'],
  phone:'+267 72 220 100',additionalPhones:['+267 73 888 909'],
  demoPlayerIds:['sample-1','sample-2','sample-3','sample-4','sample-5'],
});
const news=[
  {id:'demo-news-1',title:'Demo: a new season, one academy',date:'2026-10-05',category:'Demo · Academy news',image:'/academy/team-cover.jpg',body:'DEMO STORY — This is fictional content to demonstrate the website. It is not an announcement from the academy.\n\nA new season brings a fresh opportunity to build confidence, develop skills and strengthen the bonds between teammates. This example shows how a longer academy update will appear on the news page.\n\nUse this space for the club’s real plans, key dates and messages to families. Replace this demo by creating a new story in Club news, then remove this example.'},
  {id:'demo-news-2',title:'Demo: together on match day',date:'2026-10-03',category:'Demo · Match reports',image:'/academy/matchday-team.jpg',body:'DEMO MATCH REPORT — The events described here are fictional.\n\nIn this example report, the team builds on a positive week of training with an energetic performance. Passing combinations and committed defending create moments to celebrate.\n\nA real report could include the opponent, final score, player contributions and a comment from the coach. The photograph is an existing academy gallery image used to illustrate this page layout.'},
  {id:'demo-news-3',title:'Demo: building confidence at training',date:'2026-09-28',category:'Demo · Training',image:'/academy/team-spirit.jpg',body:'DEMO TRAINING UPDATE — This example is for presentation only.\n\nFirst touch, teamwork and decision-making are the focus of this fictional training update. A short story like this helps families follow the work behind each performance.\n\nThe club can replace this example with its own training photos, session highlights and practical information.'},
];
const fixture=(id,date,time,team,opponent,status,goalsFor=null,goalsAgainst=null)=>({id,date,time,season:'2026/27',team,opponent,competition:'Demo friendly — fictional',venue:'Demo ground — not a real booking',homeAway:'home',status,goalsFor,goalsAgainst});
const fixtures=[
  fixture('demo-fixture-1','2026-10-17','10:00','Under 13','Demo United','scheduled'),
  fixture('demo-fixture-2','2026-10-24','14:00','Under 17','Demo Rovers','scheduled'),
  fixture('demo-fixture-3','2026-10-31','15:30','Senior','Demo City','scheduled'),
  fixture('demo-fixture-4','2026-10-03','10:00','Under 13','Demo Athletic','played',3,1),
  fixture('demo-fixture-5','2026-09-26','14:00','Over 15','Demo Stars','played',2,2),
  fixture('demo-fixture-6','2026-10-10','11:00','Under 21','Demo Wanderers','postponed'),
];
const staff=[
  {id:'demo-staff-1',name:'Alex — Demo coach',role:'Demo · Head coach',team:'Academy',bio:'Fictional staff profile. Introduce the real coach here with their experience, approach to player development and role at the academy.',photo:''},
  {id:'demo-staff-2',name:'Jamie — Demo coach',role:'Demo · Goalkeeping coach',team:'Youth teams',bio:'Fictional staff profile demonstrating the coaching team layout. Add a real portrait and biography when the club is ready.',photo:''},
  {id:'demo-staff-3',name:'Taylor — Demo coordinator',role:'Demo · Team coordinator',team:'Academy',bio:'Fictional staff profile. This space can explain how the coordinator supports teams and keeps families informed.',photo:''},
];
const standings=[
  ['Demo United',1,5,4,1,0,12,3,13],
  ['Eyes On The Ball Academy',2,5,3,1,1,10,5,10],
  ['Demo Rovers',3,5,2,1,2,7,7,7],
  ['Demo City',4,5,0,1,4,2,12,1],
].map(([club,position,played,won,drawn,lost,goalsFor,goalsAgainst,points],i)=>({id:'demo-standing-'+i,season:'2026/27',competition:'Demo league — fictional standings',group:'Under 17 · Demo',club,position,played,won,drawn,lost,goalsFor,goalsAgainst,points}));
const honours=[
  {id:'demo-honour-1',season:'2025/26',title:'Demo: youth tournament',team:'Under 17',achievement:'Fictional example · Winners',photo:''},
  {id:'demo-honour-2',season:'2024/25',title:'Demo: development cup',team:'Under 13',achievement:'Fictional example · Runners-up',photo:''},
];
for(const [key,examples] of Object.entries({news,fixtures,staff,standings,honours}))content[key]=[...(content[key]||[]).filter(item=>!item.id.startsWith('demo-')),...examples];
content.sections={...content.sections,news:true,fixtures:true,squad:true,staff:true,standings:true,honours:true,join:true};
bundle.site_content=[{...original,body:JSON.stringify(content),version:original.version+1,updated_at:new Date().toISOString()}];
fs.writeFileSync('outputs/delivery-content.json',JSON.stringify(bundle));
console.log('Prepared demo delivery: 5 sample players, 3 stories, 6 fixtures, 3 staff, 4 standings and 2 honours. Original backup preserved.');
