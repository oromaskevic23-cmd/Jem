#!/usr/bin/env node
/** Owner-run local-only lab. Never publishes output, charges money or installs models. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {prepareLtxExecution} from './ltx-offline-worker.mjs';
import {runCinemaLabScene} from './cinema-session.mjs';
const usage=[
 'Jem🌼 Cinema Lab — reference-locked scene admission',
 'node video/cinema-cli.mjs --request ./private/request.json --bible ./private/bible.json --out ./private/cinema-output',
 'OPTIONAL real local LTX (only after permission and all pins independently validated):',
 '    --config ./private/ltx-runtime.json --execute-local-inference yes',
 'Requires manually installed Python/LTX checkpoint, license approvals and source SHA pins.',
 'Never publishes an artifact; signed independent visual QA remains required.'
].join('\n');
const flags=new Set(['--request','--bible','--out','--config','--execute-local-inference']);
if(process.argv.length===3&&process.argv[2]==='--help'){
 process.stdout.write(usage+'\n');
}else{
 try{
  const argv=process.argv.slice(2),args={};
  if(argv.length%2!==0)throw Error('CLI_ARGUMENTS_DENIED');
  for(let i=0;i<argv.length;i+=2){
   if(!flags.has(argv[i])||typeof argv[i+1]!=='string'||!argv[i+1]||
    Object.hasOwn(args,argv[i]))throw Error('CLI_ARGUMENTS_DENIED');
   args[argv[i]]=argv[i+1];
  }
  if(!args['--request']||!args['--bible']||!args['--out'])
   throw Error('CLI_REQUEST_BIBLE_OUT_REQUIRED');
  if(Boolean(args['--config'])!==Boolean(args['--execute-local-inference']))
   throw Error('LOCAL_INFERENCE_EXPLICIT_OPT_IN_REQUIRED');
  if(args['--execute-local-inference']&&args['--execute-local-inference']!=='yes')
   throw Error('LOCAL_INFERENCE_NOT_AUTHORIZED');
  const request=JSON.parse(readFileSync(resolve(args['--request']),'utf8'));
  const characterBible=JSON.parse(readFileSync(resolve(args['--bible']),'utf8'));
  let modelManifest=null,worker=null;
  if(args['--config']){
   const c=JSON.parse(readFileSync(resolve(args['--config']),'utf8'));
   if(c.operatorApproved!==true)throw Error('RUNTIME_OPERATOR_APPROVAL_REQUIRED');
   worker=prepareLtxExecution(c);
   modelManifest=c.modelManifest;
  }
  const result=await runCinemaLabScene({
   request,characterBible,localRoot:args['--out'],modelManifest,worker
  });
  process.stdout.write(JSON.stringify({proof:result.file,dossier:result.dossier},null,2)+'\n');
  if(result.dossier.sceneResult.state!=='REVIEW_REQUIRED')process.exitCode=2;
 }catch(e){
  console.error('JEM_CINEMA_LAB_FAILED:',e.message);
  process.exitCode=1;
 }
}
