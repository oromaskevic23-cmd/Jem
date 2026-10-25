/**
 * Jem🌼 Portable storyboard domain core.
 * Zero imports: same deterministic scene contract in Node, iOS Safari,
 * Android Chrome, iPadOS, macOS, Windows and Linux browsers.
 * NO video inference / media rendering / network / persistent image storage.
 */
export const PORTABLE_SCHEMA='jem_storyboard_v1';
const motions=['slow_push_in','pan_left','gentle_pull_back','pan_right','slow_push_in','gentle_pull_back'];
const stages=['opening','establishing','discovery','challenge','turning_point','finale'];
const hex=/^[a-f0-9]{64}$/;
const properPrompt=x=>typeof x==='string'&&x===x.trim()&&x.length>=12&&x.length<=1000&&
 !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/u.test(x);
export function planStoryCore({prompt,reference,durationSec=60,fps=12,width=640,height=360}={}){
 if(!properPrompt(prompt))throw Error('PROMPT_INVALID');
 if(!reference||!['png','jpeg'].includes(reference.format)||!hex.test(reference.sha256??''))
  throw Error('REFERENCE_NOT_LOCKED');
 if(!Number.isInteger(durationSec)||durationSec<2||durationSec>60)throw Error('DURATION_OUT_OF_RANGE');
 if(![8,12,24].includes(fps))throw Error('FPS_NOT_SUPPORTED');
 if(![[320,180],[640,360],[1280,720]].some(([w,h])=>w===width&&h===height))
  throw Error('RESOLUTION_NOT_SUPPORTED');
 const totalFrames=durationSec*fps,sceneCount=Math.min(6,Math.floor(durationSec/2));
 const texts=prompt.split(/[.!?;\n]+/u).map(x=>x.trim()).filter(Boolean);
 const seeds=texts.length?texts:[prompt],base=Math.floor(totalFrames/sceneCount);
 const extra=totalFrames%sceneCount;
 let cursor=0;
 const scenes=Array.from({length:sceneCount},(_,i)=>{
  const frames=base+(i<extra?1:0),startFrame=cursor;cursor+=frames;
  return {id:'SC'+String(i+1).padStart(2,'0'),
   stage:stages[i===sceneCount-1?5:i],
   text:seeds[i%seeds.length].slice(0,180),motion:motions[i],
   startFrame,frames,durationSec:frames/fps,characterRefSha256:reference.sha256};
 });
 return {schema:PORTABLE_SCHEMA,prompt,reference:{
  sha256:reference.sha256,format:reference.format},durationSec,fps,width,height,scenes};
}
export function validatePortableImage(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.byteLength<32||bytes.byteLength>12*1024*1024)
  throw Error('REFERENCE_IMAGE_SIZE_DENIED');
 const png=[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 const jpeg=bytes[0]===255&&bytes[1]===216&&
  bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217;
 if(!png&&!jpeg)throw Error('REFERENCE_IMAGE_FORMAT_DENIED');
 return png?'png':'jpeg';
}
export async function portableSha256(input){
 if(!globalThis.crypto?.subtle)throw Error('SECURE_CONTEXT_REQUIRED_FOR_CRYPTO');
 const digest=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',input));
 return Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('');
}
export async function createPortableStoryboard({prompt,imageBytes,durationSec=60,fps=12,width=640,height=360}={}){
 const bytes=imageBytes instanceof Uint8Array?imageBytes:new Uint8Array(imageBytes||0);
 const format=validatePortableImage(bytes);
 const reference={format,sha256:await portableSha256(bytes)};
 const core=planStoryCore({prompt,reference,durationSec,fps,width,height});
 const storyboardSha256=await portableSha256(new TextEncoder().encode(JSON.stringify(core)));
 return {...core,storyboardSha256,identityPolicy:'PIN_ORIGINAL_REFERENCE_BYTES',
  animationMode:'CAMERA_MOTION_ONLY_NOT_GENERATIVE_CHARACTER_ANIMATION',
  audio:'NOT_GENERATED',release:'NON_PRODUCTION_LAB'};
}
