#!/usr/bin/env node
/** Jem🌼 FilmFactory one-command local production (no internet/credentials/payments). */
import {runFilmFactory} from './pipeline.mjs';
const accepted=new Set(['--idea','--output','--theme','--seconds','--photo','--confirm-photo-rights','--ollama-model']);
const args=process.argv.slice(2),cfg={photoPaths:[]},seen=new Set();
if(args.length===1&&args[0]==='--help'){
 process.stdout.write('Jem🌼 FilmFactory: --idea "A friendship rescue in a forest" --output ./films [--theme forest] [--seconds 60] [--photo ./reference.jpg --confirm-photo-rights yes]\nFor optional locally hosted AI drafting add --ollama-model qwen2.5:3b. Photo mode creates only a screenplay and shot plan until genuine image-to-video is connected. No paid API, release or publication.\n');
}else{
 try{
  for(let i=0;i<args.length;i+=2){
   const flag=args[i],value=args[i+1];
   if(!accepted.has(flag)||typeof value!=='string'||value.length===0||
    flag!=='--photo'&&seen.has(flag))throw Error('ARGUMENTS_DENIED');
   seen.add(flag);
   if(flag==='--idea')cfg.idea=value;
   if(flag==='--output')cfg.outputRoot=value;
   if(flag==='--ollama-model')cfg.ollamaModel=value;
   if(flag==='--theme')cfg.theme=value;
   if(flag==='--seconds'){
    if(!/^(6|12|18|24|30|36|42|48|54|60)$/.test(value))throw Error('DURATION_DENIED');
    cfg.durationSec=Number(value);
   }
   if(flag==='--photo')cfg.photoPaths.push(value);
   if(flag==='--confirm-photo-rights'){
    if(value!=='yes')throw Error('PHOTO_RIGHTS_NOT_CONFIRMED');
    cfg.ownerConfirmsPhotoRights=true;
   }
  }
  const result=await runFilmFactory(cfg);
  process.stdout.write(JSON.stringify({productionDirectory:result.directory,
   film:result.film,status:result.result.status,report:result.result},null,2)+'\n');
  if(!result.film)process.exitCode=2;
 }catch(e){console.error('JEM_FACTORY_FAILED:',e.message);process.exitCode=1}
}
