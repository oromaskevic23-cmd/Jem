#!/usr/bin/env node
import {renderFilm} from './render.mjs';
const HELP='Jem🌼 local animation lab\nUsage: node src/cli.mjs --prompt "A brave explorer discovers..." --photo ./reference.png --output ./renders [--duration 60] [--fps 12] [--width 640 --height 360]\nOnly local JPG/PNG reference images, silent MP4 camera-motion animation. No online AI model or character articulation.';
function argumentsFrom(argv){
 const allowed=new Set(['--prompt','--photo','--output','--duration','--fps','--width','--height']);
 if(argv.includes('--help')&&argv.length===1)return null;
 const obj={};
 for(let i=0;i<argv.length;i+=2){
  if(!allowed.has(argv[i])||i+1>=argv.length||argv[i+1].startsWith('--')||
   Object.hasOwn(obj,argv[i]))throw Error('ARGUMENTS_INVALID');
  obj[argv[i].slice(2)]=argv[i+1];
 }
 if(!obj.prompt||!obj.photo||!obj.output)throw Error('PROMPT_PHOTO_OUTPUT_REQUIRED');
 for(const k of ['duration','fps','width','height']){
  if(obj[k]!==undefined){
   if(!/^[0-9]+$/.test(obj[k]))throw Error('NUMERIC_ARGUMENT_INVALID');
   obj[k]=Number(obj[k]);
  }
 }
 return {prompt:obj.prompt,photoPath:obj.photo,outputRoot:obj.output,
  durationSec:obj.duration??60,fps:obj.fps??12,width:obj.width??640,height:obj.height??360};
}
try{
 const args=argumentsFrom(process.argv.slice(2));
 if(args===null){process.stdout.write(HELP+'\n');process.exitCode=0}
 else{
  const result=await renderFilm(args);
  process.stdout.write(JSON.stringify({video:result.video,report:result.report},null,2)+'\n');
 }
}catch(e){
 console.error('JEM_RENDER_FAILED:',e.code||e.message);
 process.exitCode=1;
}
