/**
 * Jem🌼 — deterministic storyboard and character identity contract.
 * Engineering-grade edit decision list, not generative AI or identity biometrics.
 */
import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
export const STORYBOARD_SCHEMA='jem_storyboard_v1';
const sha256=x=>createHash('sha256').update(x).digest('hex');
const MOTIONS=['slow_push_in','pan_left','gentle_pull_back','pan_right','slow_push_in','gentle_pull_back'];
const STAGES=['opening','establishing','discovery','challenge','turning_point','finale'];
const clean=x=>typeof x==='string'&&x===x.trim()&&x.length>=12&&x.length<=1000&&
 !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/u.test(x);
export function validateImageBytes(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<32||bytes.length>12*1024*1024)
  throw Error('REFERENCE_IMAGE_SIZE_DENIED');
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217;
 if(!png&&!jpg)throw Error('REFERENCE_IMAGE_FORMAT_DENIED');
 return {format:png?'png':'jpeg',sha256:sha256(bytes),bytes:bytes.length};
}
export function inspectImage(path){
 if(typeof path!=='string'||!path)throw Error('IMAGE_PATH_REQUIRED');
 const st=statSync(path);
 if(!st.isFile()||st.size>12*1024*1024||st.size<32)throw Error('REFERENCE_IMAGE_SIZE_DENIED');
 return validateImageBytes(readFileSync(path));
}
export function makeStoryboard({prompt,reference,durationSec=60,fps=12,width=640,height=360}={}){
 if(!clean(prompt))throw Error('PROMPT_INVALID');
 if(!reference||!['png','jpeg'].includes(reference.format)||!/^[a-f0-9]{64}$/.test(reference.sha256))
  throw Error('REFERENCE_NOT_LOCKED');
 if(!Number.isInteger(durationSec)||durationSec<2||durationSec>60)throw Error('DURATION_OUT_OF_RANGE');
 if(![8,12,24].includes(fps))throw Error('FPS_NOT_SUPPORTED');
 if(![[320,180],[640,360],[1280,720]].some(([w,h])=>w===width&&h===height))
  throw Error('RESOLUTION_NOT_SUPPORTED');
 const totalFrames=durationSec*fps,sceneCount=Math.min(6,Math.floor(durationSec/2));
 const texts=prompt.split(/[.!?;\n]+/u).map(x=>x.trim()).filter(Boolean);
 const seeds=texts.length?texts:[prompt];
 const framesPerScene=Math.floor(totalFrames/sceneCount),remainder=totalFrames%sceneCount;
 let start=0;
 const scenes=Array.from({length:sceneCount},(_,i)=>{
  const frames=framesPerScene+(i<remainder?1:0),startFrame=start;
  start+=frames;
  return Object.freeze({
   id:'SC'+String(i+1).padStart(2,'0'),
   stage:STAGES[i===sceneCount-1?5:i],
   text:seeds[i%seeds.length].slice(0,180),
   motion:MOTIONS[i],
   startFrame,frames,durationSec:frames/fps,
   characterRefSha256:reference.sha256
  });
 });
 const core={schema:STORYBOARD_SCHEMA,prompt,reference:{
  sha256:reference.sha256,format:reference.format},durationSec,fps,width,height,scenes};
 return Object.freeze({...core,storyboardSha256:sha256(JSON.stringify(core)),
  identityPolicy:'PIN_ORIGINAL_REFERENCE_BYTES',
  animationMode:'CAMERA_MOTION_ONLY_NOT_GENERATIVE_CHARACTER_ANIMATION',
  audio:'NOT_GENERATED',release:'NON_PRODUCTION_LAB'});
}
