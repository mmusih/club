export type AdminAccount = {email:string;passwordHash:string};

/** Keep the original account authoritative; extra accounts cannot override it. */
export function adminAccounts(env:NodeJS.ProcessEnv=process.env):AdminAccount[] {
 const accounts:AdminAccount[]=[];
 const primary=env.ADMIN_EMAIL?.trim().toLowerCase();
 if(primary&&env.ADMIN_PASSWORD_HASH)accounts.push({email:primary,passwordHash:env.ADMIN_PASSWORD_HASH});
 let extra:unknown;
 try{extra=JSON.parse(env.ADMIN_ADDITIONAL_ACCOUNTS||'[]')}catch{return accounts}
 if(!Array.isArray(extra))return accounts;
 for(const entry of extra){
  if(!entry||typeof entry.email!=='string'||typeof entry.passwordHash!=='string')continue;
  const email=entry.email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(entry.passwordHash))continue;
  if(!accounts.some(account=>account.email===email))accounts.push({email,passwordHash:entry.passwordHash});
 }
 return accounts;
}
