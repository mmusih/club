import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Exercise only the PDF files in Next's deployment manifest, outside the checkout
// so the test cannot accidentally use missing dependencies from node_modules.
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=path.join(root,'.next/server/app/api/admin/fixtures/import/route.js.nft.json');
const files=JSON.parse(readFileSync(manifest,'utf8')).files.map(f=>path.resolve(path.dirname(manifest),f));
const relative=files.map(f=>path.relative(root,f).replaceAll('\\','/'));
for(const required of ['node_modules/pdfjs-dist/legacy/build/pdf.mjs','node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs','node_modules/pdfjs-dist/package.json','node_modules/@napi-rs/canvas/index.js'])assert.ok(relative.includes(required),'Missing deployment dependency: '+required);
assert.ok(relative.some(f=>f.startsWith('node_modules/@napi-rs/canvas-')&&f.endsWith('.node')),'Include the build platform’s native canvas binary');
const temp=mkdtempSync(path.join(tmpdir(),'club-pdf-deployment-'));
try{
 for(let i=0;i<files.length;i++)if(/^node_modules\/(pdfjs-dist|@napi-rs\/canvas)/.test(relative[i])){
  const target=path.join(temp,relative[i]);mkdirSync(path.dirname(target),{recursive:true});copyFileSync(files[i],target);
 }
 const entry=pathToFileURL(path.join(temp,'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href;
 const code=`
  import {readFileSync} from 'node:fs';
  const {getDocument}=await import(${JSON.stringify(entry)});
  const task=getDocument({data:new Uint8Array(readFileSync(process.argv[1])),useSystemFonts:true});
  try {
   const pdf=await task.promise;let fixtureRows=0;
   for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n),text=await page.getTextContent();
    fixtureRows+=text.items.filter(t=>'str' in t&&/^\\d{2}\\/\\d{2}\\/\\d{4}$/.test(t.str.trim())).length;
   }
   if(pdf.numPages!==5||fixtureRows!==132)throw new Error('Expected all 132 fixtures on five pages');
   console.log('PASS: isolated deployment files load the PDF worker and read all 132 fixtures.');
  }finally{await task.destroy()}
 `;
 assert.ok(process.argv[2],'Pass the supplied fixture PDF path');
 const result=spawnSync(process.execPath,['--input-type=module','-e',code,path.resolve(process.argv[2])],{cwd:temp,encoding:'utf8',windowsHide:true,env:{...process.env,NODE_PATH:''}});
 assert.equal(result.status,0,[result.stdout,result.stderr,result.error?.message].filter(Boolean).join('\n'));
 console.log(result.stdout.trim());
}finally{
 assert.equal(path.dirname(path.resolve(temp)),path.resolve(tmpdir()));
 assert.ok(path.basename(temp).startsWith('club-pdf-deployment-'));
 rmSync(temp,{recursive:true,force:true});
}
