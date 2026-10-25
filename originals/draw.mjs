/** Procedural original 2D art: fixed camera with moving robot joints, mouth, eyes and flower. */
import {poseAtFrame,stageAtFrame} from './pilot.mjs';
const FONT={
 A:['010','101','111','101','101'],B:['110','101','110','101','110'],
 C:['011','100','100','100','011'],D:['110','101','101','101','110'],
 E:['111','100','110','100','111'],F:['111','100','110','100','100'],
 G:['011','100','101','101','011'],H:['101','101','111','101','101'],
 I:['111','010','010','010','111'],J:['001','001','001','101','010'],
 K:['101','101','110','101','101'],L:['100','100','100','100','111'],
 M:['101','111','111','101','101'],N:['101','111','111','111','101'],
 O:['010','101','101','101','010'],P:['110','101','110','100','100'],
 Q:['010','101','101','111','011'],R:['110','101','110','101','101'],
 S:['011','100','010','001','110'],T:['111','010','010','010','010'],
 U:['101','101','101','101','111'],V:['101','101','101','101','010'],
 W:['101','101','111','111','101'],X:['101','101','010','101','101'],
 Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],
 ' ':['000','000','000','000','000'],
 '.':['000','000','000','000','010'],
 '!':['010','010','010','000','010'],
 '1':['010','110','010','010','111'],
 '2':['110','001','010','100','111'],
 '3':['110','001','010','001','110'],
 '4':['101','101','111','001','001'],
 '5':['111','100','110','001','110'],
 '6':['011','100','110','101','010'],
 '7':['111','001','010','010','010'],
 '8':['010','101','010','101','010'],
 '9':['010','101','011','001','110'],
 '0':['111','101','101','101','111']
};
const C={lilac:[126,116,230],shadow:[69,58,130],steel:[217,224,249],
 white:[250,247,255],ink:[25,32,62],gold:[254,226,133],
 orange:[251,164,72],green:[39,138,105],star:[255,242,179],dark:[24,25,49]};
function canvas(width,height){
 const pixels=Buffer.alloc(width*height*3);
 const rect=(x,y,w,h,c)=>{
  const x0=Math.max(0,Math.floor(x)),x1=Math.min(width,Math.ceil(x+w));
  const y0=Math.max(0,Math.floor(y)),y1=Math.min(height,Math.ceil(y+h));
  if(x1<=x0||y1<=y0)return;
  const row=Buffer.alloc((x1-x0)*3);
  for(let k=0;k<row.length;k+=3){row[k]=c[0];row[k+1]=c[1];row[k+2]=c[2]}
  for(let yy=y0;yy<y1;yy++)row.copy(pixels,(yy*width+x0)*3);
 };
 const circle=(cx,cy,r,c)=>{
  for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(height-1,Math.ceil(cy+r));y++){
   const span=Math.sqrt(Math.max(0,r*r-(y-cy)**2));rect(cx-span,y,2*span+1,1,c);
  }
 };
 const line=(x1,y1,x2,y2,thickness,c)=>{
  const steps=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)*1.6));
  for(let n=0;n<=steps;n++){const t=n/steps;
   circle(x1+(x2-x1)*t,y1+(y2-y1)*t,thickness/2,c)}
 };
 const text=(label,x,y,c,scale=2)=>{
  for(const char of label.toUpperCase()){
   const glyph=FONT[char]??FONT[' '];
   for(let ry=0;ry<glyph.length;ry++)for(let rx=0;rx<3;rx++)
    if(glyph[ry][rx]==='1')rect(x+rx*scale,y+ry*scale,scale,scale,c);
   x+=4*scale;
  }
 };
 return {pixels,rect,circle,line,text};
}
function landscape(g,act){
 const palettes=[
  [[18,32,74],[46,72,115],[46,129,116],[31,101,102]],
  [[37,65,123],[66,112,153],[65,140,122],[48,114,100]],
  [[19,30,64],[37,48,75],[37,88,92],[27,70,78]],
  [[26,67,105],[73,112,134],[52,134,127],[35,104,120]],
  [[42,60,111],[119,92,160],[70,144,116],[44,108,104]],
  [[68,48,112],[155,99,152],[79,142,132],[55,100,115]]
 ][act];
 g.rect(0,0,320,180,palettes[0]);g.rect(0,52,320,68,palettes[1]);
 for(let i=0;i<6;i++){const x=22+i*57,y=21+(i%3)*9;
  g.circle(x,y,i%2?2:1,C.star)}
 g.circle(act===2?265:285,25,act===2?10:14,
  act===2?[104,118,146]:[252,217,137]);
 g.circle(65,150,66,palettes[2]);g.circle(163,150,81,palettes[2]);
 g.circle(280,153,74,palettes[2]);g.rect(0,130,320,50,palettes[3]);
 for(let i=0;i<7;i++){const x=16+i*50;g.line(x,132,x-3,145,2,[30,95,81]);
  g.line(x-2,141,x-7,136,1,[51,138,104])}
 if(act===3){g.rect(174,126,146,16,[48,116,177]);
  g.rect(180,127,140,3,[104,171,216])}
 if(act===5)for(let j=0;j<9;j++){const x=11+j*38,y=135+(j%3)*7;
  g.circle(x,y,4,[255,214,112]);g.circle(x,y,2,[250,155,104])}
 if(act===2)for(let j=0;j<7;j++)
  g.line(j*52+4,39,j*52+16,55,1,[110,129,166]);
}
function robot(g,p){
 const {x,y}=p;
 g.circle(x,y+14,15,[20,35,64]);
 g.line(x-7,y+12,x-9+p.legLeft,y+33,6,C.steel);
 g.line(x+7,y+12,x+9+p.legRight,y+33,6,C.steel);
 g.circle(x-9+p.legLeft,y+33,5,C.shadow);
 g.circle(x+9+p.legRight,y+33,5,C.shadow);
 g.line(x-15,y-3,x-22+10*Math.sin(p.armLeftAngle),
  y+11+12*p.armLeftAngle,6,C.lilac);
 g.line(x+15,y-3,x+22+10*Math.sin(p.armRightAngle),
  y+11+12*p.armRightAngle,6,C.lilac);
 g.circle(x-22+10*Math.sin(p.armLeftAngle),
  y+11+12*p.armLeftAngle,4,C.steel);
 g.circle(x+22+10*Math.sin(p.armRightAngle),
  y+11+12*p.armRightAngle,4,C.steel);
 g.circle(x,y,15,C.shadow);g.circle(x,y-3,14,C.lilac);
 g.circle(x,y-14,23,C.shadow);g.circle(x,y-17,21,C.lilac);
 g.rect(x-16,y-26,32,19,C.steel);
 if(p.blink){g.line(x-11,y-19,x-5,y-19,2,C.ink);
  g.line(x+5,y-19,x+11,y-19,2,C.ink)}
 else{g.circle(x-8,y-19,4,C.ink);g.circle(x+8,y-19,4,C.ink);
  g.circle(x-7,y-20,1,C.white);g.circle(x+9,y-20,1,C.white)}
 if(p.mouthOpen)g.circle(x,y-10,3,C.ink);
 else g.line(x-3,y-10,x+3,y-10,1,C.ink);
 g.line(x,y-36,x,y-42,2,C.steel);g.circle(x,y-44,4,C.gold);
 g.circle(x-8,y+5,3,C.gold);
}
function flower(g,p){
 const {flowerX:x,flowerY:y,flowerGlow:glow}=p;
 g.line(x,y+7,x,y+21,3,C.green);
 g.line(x,y+15,x-8,y+9,3,C.green);
 g.line(x,y+17,x+8,y+11,3,C.green);
 const r=4+2*glow;
 g.circle(x,y,12+r,[95+Math.round(glow*55),
  101+Math.round(glow*45),85]);
 for(let j=0;j<8;j++){const a=j/8*Math.PI*2;
  g.circle(x+Math.cos(a)*12,y+Math.sin(a)*12,8,C.gold)}
 g.circle(x,y,9,C.orange);
 g.circle(x-3,y-2,1.6,C.ink);g.circle(x+3,y-2,1.6,C.ink);
 if(p.act===2)g.line(x-3,y+3,x+3,y+3,1,C.ink);
 else g.circle(x,y+3,2.2,C.ink);
}
export function drawFrame(manifest,frame){
 const {act}=stageAtFrame(manifest,frame),pose=poseAtFrame(manifest,frame);
 const g=canvas(manifest.width,manifest.height);
 landscape(g,pose.act);flower(g,pose);robot(g,pose);
 g.rect(0,0,320,14,C.dark);
 g.text('JEM ORIGINALS  -  PIP AND THE STARFLOWER',8,2,C.gold,2);
 g.rect(0,154,320,26,C.dark);
 g.text(act.caption,Math.max(3,Math.floor((320-act.caption.length*8)/2)),161,C.white,2);
 return g.pixels;
}
