import { hashPassword } from '../lib/password.mjs';
import readline from 'node:readline';
if(!process.stdin.isTTY) throw new Error('Run this command in an interactive terminal.');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdout.write('New admin password (14+ characters; hidden): ');
let password='';
process.stdin.on('keypress',async (text,key)=>{
  if(key.ctrl && key.name==='c'){process.stdin.setRawMode(false);process.exit(1);}
  if(key.name==='return') {
    process.stdin.setRawMode(false);process.stdin.pause();
    try { console.log('\nADMIN_PASSWORD_HASH='+await hashPassword(password)); } catch(e){console.error('\n'+e.message);process.exitCode=1;}
  } else if(key.name==='backspace'){password=password.slice(0,-1);} else if(text && !key.ctrl && !key.meta){password+=text;}
});
