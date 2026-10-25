/** Jem🌼 Originals: independent original 2D film pilot. Not generative AI. */
import {createHash} from 'node:crypto';
export const ORIGINALS_SCHEMA='jem_originals_episode_v1';
export const EPISODE_ID='JEM-PILOT-001';
export const DESIGN=Object.freeze({
 protagonist:Object.freeze({id:'PIP-001',name:'Pip',species:'fictional lilac robot',body:'#8177e5',eyes:'#1b2141',antenna:'#ffdb83'}),
 companion:Object.freeze({id:'STARFLOWER-001',name:'Starflower',species:'fictional glowing flower',petals:'#ffe188',core:'#f4a94a'})
});
const scenes=[
 ['DAWN','PIP FINDS A LOST STARFLOWER','Pip hears a weak light in the meadow.','DISCOVER'],
 ['THE SEARCH','ITS LIGHT IS FADING','The flower needs a safe home before sundown.','WALK'],
 ['THE STORM','A STORM SWEEPS OVER THE HILLS','Wind separates Pip and the flower.','CHASE'],
 ['THE RESCUE','PIP PROTECTS THE FLOWER','Pip reaches across the river to save a friend.','RESCUE'],
 ['THE RETURN','THE LIGHT RETURNS','Together they carry a tiny spark across the valley.','CELEBRATE'],
 ['THE FINALE','TOGETHER THEY LIGHT THE VALLEY','The valley blooms with kindness.','FINALE']
];
const hash=x=>createHash('sha256').update(x).digest('hex');
export function createPilot({seconds=60,fps=8,width=320,height=180}={}){
 if(!Number.isInteger(seconds)||seconds<6||seconds>60||seconds%6!==0)throw Error('DURATION_DENIED');
 if(![8,12].includes(fps))throw Error('FPS_DENIED');
 if(width!==320||height!==180)throw Error('RESOLUTION_DENIED');
 const frames=seconds*fps,framesPerScene=frames/6;
 const acts=scenes.map(([title,caption,action,stage],index)=>({
  id:'ACT'+(index+1),title,caption,action,stage,
  startFrame:index*framesPerScene,frames:framesPerScene,
  characterIds:[DESIGN.protagonist.id,DESIGN.companion.id]
 }));
 const manifest={schema:ORIGINALS_SCHEMA,episodeId:EPISODE_ID,
  series:'Jem🌼 Originals',title:'Pip and the Starflower',season:1,episode:1,
  genre:'original family-friendly 2D animated short',
  creator:'IMPERIAL Core — Jem🌼 Originals',language:'en',
  seconds,fps,width,height,characterBible:DESIGN,acts,
  sourcePolicy:'ALL_CHARACTERS_AND_MUSIC_PROCEDURALLY_ORIGINAL',
  audioPolicy:'ORIGINAL_SYNTH_INSTRUMENTAL_NO_NARRATION',
  animationPolicy:'ACTUAL_RIGGED_2D_LIMB_AND_EXPRESSION_MOTION_NO_AI_INFERENCE',
  externalModelCalls:0,thirdPartyAssets:0,distribution:'OWNER_REVIEW_REQUIRED',
  contentRating:'FAMILY_REVIEW_NOT_COMPLETED'};
 return Object.freeze({...manifest,manifestSha256:hash(JSON.stringify(manifest))});
}
export function stageAtFrame(manifest,frame){
 if(!Number.isInteger(frame)||frame<0||frame>=manifest.seconds*manifest.fps)throw Error('FRAME_DENIED');
 const index=Math.floor(frame/(manifest.seconds*manifest.fps/6));
 const act=manifest.acts[index],progress=(frame-act.startFrame)/act.frames;
 return {act,index,progress,time:frame/manifest.fps};
}
export function poseAtFrame(manifest,frame){
 const {act,index,progress,time}=stageAtFrame(manifest,frame);
 const gait=Math.sin(2*Math.PI*(time*1.75));
 let x=70,y=111,flowerX=180,flowerY=110;
 if(index===0){x=60+60*progress;flowerX=190;flowerY=113}
 if(index===1){x=40+140*progress;flowerX=210-12*progress;flowerY=112}
 if(index===2){x=80+110*progress;flowerX=220-95*progress;flowerY=68+23*Math.sin(6*Math.PI*progress)}
 if(index===3){x=80+55*progress;flowerX=200-75*progress;flowerY=101}
 if(index===4){x=100+110*progress;flowerX=x+31;flowerY=88}
 if(index===5){x=160+15*Math.sin(progress*Math.PI);flowerX=x+36;flowerY=84}
 return Object.freeze({x,y:y+Math.sin(time*10)*(index===1||index===2?3:1),
  flowerX,flowerY,
  armLeftAngle:index===3?(-0.2-1.4*progress):gait*.55,
  armRightAngle:index===3?(-1.4+0.7*progress):(-gait*.48-0.15),
  legLeft:gait*7,legRight:-gait*7,blink:Math.floor(time*3)%17===0,
  mouthOpen:Math.floor(time*5)%3===0,
  flowerGlow:index===2?0.25:index===5?1:0.45+0.3*Math.sin(time*2),
  emotion:index===2?'worried':index>=4?'joyful':'hopeful',
  stage:act.stage,act:index,
  referenceId:DESIGN.protagonist.id,companionId:DESIGN.companion.id});
}
export function toSrt(manifest){
 const stamp=secs=>{
  const h=Math.floor(secs/3600),m=Math.floor(secs/60)%60,s=Math.floor(secs)%60,ms=Math.round(secs%1*1000);
  return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+
   String(s).padStart(2,'0')+','+String(ms).padStart(3,'0');
 };
 return manifest.acts.map((act,i)=>(i+1)+'\n'+
  stamp(act.startFrame/manifest.fps)+' --> '+stamp((act.startFrame+act.frames)/manifest.fps)+'\n'+act.caption+'\n').join('\n');
}
