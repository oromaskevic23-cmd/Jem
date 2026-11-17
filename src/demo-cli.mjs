#!/usr/bin/env node
import {readFileSync,lstatSync} from 'node:fs';
import {assembleDemo} from './demo-video.mjs';

const help='Usage: npm run demo:assemble -- --manifest /absolute/demo.json --output /absolute/output-directory';
try{
 const args=process.argv.slice(2);
 if(args.length===1&&args[0]==='--help')console.log(help);
 else{
  if(args.length!==4||args[0]!=='--manifest'||args[2]!=='--output')throw Error('INVALID_ARGUMENTS');
  const stat=lstatSync(args[1]);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>32768)throw Error('INVALID_MANIFEST');
  const manifest=JSON.parse(readFileSync(args[1],'utf8'));
  if(!manifest||Object.keys(manifest).some(k=>!['clips','captions','narrationPath','rightsDeclaration','width','height','fps'].includes(k)))
   throw Error('INVALID_MANIFEST');
  const result=await assembleDemo({...manifest,outputRoot:args[3]});
  console.log(JSON.stringify(result,null,2));
 }
}catch(error){console.error('JEM_DEMO_FAILED:',error.code||error.message);process.exitCode=1;}
