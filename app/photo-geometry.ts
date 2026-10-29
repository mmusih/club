/** Cover the frame even after rotation; offsets are in the image's own axes. */
export function cropGeometry(width:number,height:number,aspect:number,zoom:number,rotation:number,x:number,y:number){
 const outputWidth=800,outputHeight=800/aspect,radians=rotation*Math.PI/180;
 const cos=Math.abs(Math.cos(radians)),sin=Math.abs(Math.sin(radians));
 const scale=Math.max((outputWidth*cos+outputHeight*sin)/width,(outputWidth*sin+outputHeight*cos)/height)*zoom;
 const maxX=Math.max(0,(width-(outputWidth*cos+outputHeight*sin)/scale)/2);
 const maxY=Math.max(0,(height-(outputWidth*sin+outputHeight*cos)/scale)/2);
 return {scale,radians,maxX,maxY,offsetX:(x-50)/50*maxX,offsetY:(y-50)/50*maxY};
}
