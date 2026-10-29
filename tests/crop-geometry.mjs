import assert from 'node:assert/strict';
import {cropGeometry} from '../app/photo-geometry.ts';
for(const [w,h] of [[1200,800],[800,1200],[100,2000]])for(const aspect of [.8,1])for(const rotation of [-180,-90,-45,0,23,90,180])for(const zoom of [1,2,4])for(const x of [0,50,100])for(const y of [0,50,100]){
 const g=cropGeometry(w,h,aspect,zoom,rotation,x,y);
 for(const cx of [-400,400])for(const cy of [-400/aspect,400/aspect]){
  const px=(cx*Math.cos(g.radians)+cy*Math.sin(g.radians))/g.scale-g.offsetX;
  const py=(-cx*Math.sin(g.radians)+cy*Math.cos(g.radians))/g.scale-g.offsetY;
  assert.ok(Math.abs(px)<=w/2+1e-8,`Horizontal crop boundary at ${rotation} degrees`);
  assert.ok(Math.abs(py)<=h/2+1e-8,`Vertical crop boundary at ${rotation} degrees`);
 }
}
console.log('PASS: rotated crop corners stay inside landscape, portrait and narrow images at all zoom and position extremes.');
