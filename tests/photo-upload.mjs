import assert from 'node:assert/strict';
import sharp from 'sharp';
import bmp from 'bmp-js';
import {preparePhoto} from '../lib/photo-upload.ts';
const base=sharp({create:{width:8,height:6,channels:4,background:'#64ac3a'}});
for(const format of ['jpeg','png','webp','gif','avif','tiff']){
 const source=await base.clone().toFormat(format).toBuffer();const output=await preparePhoto(source);const meta=await sharp(output).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,8);assert.equal(meta.height,6);
}
const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="red"/></svg>');
assert.equal((await sharp(await preparePhoto(svg)).metadata()).format,'webp');
const bitmap=bmp.encode({width:2,height:2,data:Buffer.from([255,0,0,255,255,0,0,255,255,0,0,255,255,0,0,255])}).data;
const output=await preparePhoto(bitmap);assert.equal((await sharp(output).metadata()).width,2);
await assert.rejects(preparePhoto(Buffer.from('not a photo')));
const oversized=Buffer.alloc(54);oversized.write('BM');oversized.writeInt32LE(100000,18);oversized.writeInt32LE(100000,22);await assert.rejects(preparePhoto(oversized));
console.log('PASS: JPEG, PNG, WebP, GIF, AVIF, TIFF, SVG and BMP decoding, browser-ready conversion and invalid-image rejection.');
