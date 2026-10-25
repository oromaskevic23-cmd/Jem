/**
 * Opt-in real LTX-Video 0.9.8 2B inference adapter. No fake generated clips.
 * OFF by default. Requires manually installed, pinned, licensed local files.
 * Python source is NOT sandboxed: run only in a restricted owner-approved environment.
 */
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,realpathSync,statSync,readdirSync,openSync,readSync,closeSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {assertSceneRequest} from './scene-contract.mjs';
import {verifyRuntimeModel} from './model-registry.mjs';
function sha(file){
 const digest=createHash('sha256'),fd=openSync(file,'r'),buffer=Buffer.allocUnsafe(1024*1024);
 try{let n;while((n=readSync(fd,buffer,0,buffer.length,null))>0)digest.update(buffer.subarray(0,n))}
 finally{closeSync(fd)}
 return digest.digest('hex');
}
const HEX=/^[a-f0-9]{64}$/, GIT_SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_.-]{2,80}$/;
function fileUnderRoot(path,root){
 const p=realpathSync(path),dir=realpathSync(root);
 if(!p.startsWith(dir+sep))throw Error('EXECUTION_ASSET_OUTSIDE_PINNED_ROOT');
 if(!statSync(p).isFile())throw Error('EXECUTION_ASSET_NOT_FILE');
 return p;
}
function run(exec,args,{cwd,timeoutMs=600000}={}){
 return new Promise((done,fail)=>{
  const env={
   PATH:process.env.PATH||'',HOME:process.env.HOME||'',
   HF_HUB_OFFLINE:'1',TRANSFORMERS_OFFLINE:'1',HF_DATASETS_OFFLINE:'1',
   PYTHONNOUSERSITE:'1',PYTHONDONTWRITEBYTECODE:'1',
   CUDA_VISIBLE_DEVICES:'0',OMP_NUM_THREADS:'4'
  };
  const child=spawn(exec,args,{cwd,env,shell:false,stdio:['ignore','ignore','pipe']});
  let error='',settled=false;
  const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);
  child.stderr.on('data',b=>{if(error.length<1000)error+=b.toString().slice(0,1000-error.length)});
  child.on('error',e=>{
   if(!settled){settled=true;clearTimeout(timer);fail(e)}
  });
  child.on('close',code=>{
   if(settled)return;settled=true;clearTimeout(timer);
   if(code!==0)return fail(Error('INFERENCE_OR_TRANSCODE_FAILED_WITH_EXIT_'+code));
   done();
  });
 });
}
/** Reference filenames and model weights must already exist on local disk. */
export function prepareLtxExecution({
 modelManifest,repoRoot,repoCommitSha,inferenceSha256,configRelativePath,
 configSha256,checkpointFile,pythonExecutable,referenceFiles,
 artifactRoot,operatorApproved=false
}={}){
 const model=verifyRuntimeModel(modelManifest);
 if(model.id!=='ltx-video-2b-distilled'||operatorApproved!==true)
  throw Error('LOCAL_RUNTIME_OPERATOR_APPROVAL_REQUIRED');
 if(!GIT_SHA.test(repoCommitSha||'')||!HEX.test(inferenceSha256||'')||
  !HEX.test(configSha256||'')||!ID.test(configRelativePath?.split('/').at(-1)?.replace('.yaml','')||''))
  throw Error('LOCAL_RUNTIME_PINS_DENIED');
 if(typeof configRelativePath!=='string'||!/^[a-zA-Z0-9_./-]+\.yaml$/.test(configRelativePath)||
  configRelativePath.startsWith('/')||configRelativePath.split('/').includes('..'))
  throw Error('CONFIG_PATH_DENIED');
 if(typeof pythonExecutable!=='string'||!pythonExecutable||
  typeof artifactRoot!=='string'||!artifactRoot||
  !referenceFiles||typeof referenceFiles!=='object')throw Error('LOCAL_EXECUTION_PATHS_DENIED');
 const root=realpathSync(repoRoot);
 const script=fileUnderRoot(join(root,'inference.py'),root);
 const config=fileUnderRoot(join(root,configRelativePath),root);
 const python=realpathSync(pythonExecutable);
 const checkpoint=realpathSync(checkpointFile);
 if(!statSync(python).isFile()||!statSync(checkpoint).isFile())
  throw Error('PYTHON_OR_MODEL_WEIGHTS_MISSING');
 if(sha(script)!==inferenceSha256||sha(config)!==configSha256||
  sha(checkpoint)!==model.weightsSha256)throw Error('INFERENCE_SOURCE_OR_WEIGHTS_SHA_MISMATCH');
 const git=spawnSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',timeout:10000});
 if(git.status!==0||git.stdout.trim()!==repoCommitSha)
  throw Error('MODEL_REPO_COMMIT_MISMATCH');
 const dirty=spawnSync('git',['-C',root,'status','--porcelain','--untracked-files=no'],{encoding:'utf8',timeout:10000});
 if(dirty.status!==0||dirty.stdout.trim())throw Error('MODEL_REPO_DIRTY');
 mkdirSync(artifactRoot,{recursive:true,mode:0o700});
 const outRoot=realpathSync(artifactRoot);
 const refs={};
 for(const [refId,ref]of Object.entries(referenceFiles)){
  if(!ID.test(refId)||!ref||typeof ref.path!=='string'||!HEX.test(ref.sha256||''))
   throw Error('REFERENCE_FILE_BINDING_DENIED');
  const path=realpathSync(ref.path);
  const st=statSync(path);
  if(!st.isFile()||st.size<32||st.size>12*1024*1024||sha(path)!==ref.sha256)
   throw Error('REFERENCE_BYTES_CHANGED');
  refs[refId]={path,sha256:ref.sha256};
 }
 return Object.freeze({
  modelId:model.id,workerKind:'REAL_PINNED_LTX_0_9_8_2B',
  // This adapter is not proof of identity continuity. It does not grant approval.
  async generateSceneClip(request){
   assertSceneRequest(request);
   if(request.approvedReferences.length!==1)
    throw Error('LTX_INITIAL_PILOT_REQUIRES_ONE_REFERENCE');
   const r=request.approvedReferences[0],local=refs[r.id];
   if(!local||local.sha256!==r.sha256||sha(local.path)!==local.sha256)
    throw Error('REFERENCE_BINDING_DENIED');
   // Official LTX model uses 8*k+1 generated frames, then transcode to exactly requested count.
   const wanted=request.targetDurationSec*request.targetFps;
   const numFrames=Math.ceil(wanted/8)*8+1;
   const folder=mkdtempSync(join(outRoot,'ltx-scene-'));
   const args=[script,'--prompt',
    request.environmentRules.join('; ')+'. '+request.visualStyle+
    '. Preserve the character in the reference photo; visible body motion.',
    '--conditioning_media_paths',local.path,'--conditioning_start_frames','0',
    '--width',String(request.width),'--height',String(request.height),
    '--num_frames',String(numFrames),'--frame_rate',String(request.targetFps),
    '--seed','42','--pipeline_config',configRelativePath,
    '--output_path',folder,'--offload_to_cpu','True'];
   await run(python,args,{cwd:root,timeoutMs:600000});
   // Upstream writes uniquely named outputs to the designated folder.
   const files=readdirSync(folder).filter(x=>x.endsWith('.mp4'));
   if(files.length!==1)throw Error('LTX_OUTPUT_NOT_UNAMBIGUOUS');
   const raw=fileUnderRoot(join(folder,files[0]),folder);
   const final=join(folder,'jem-clip-h264.mp4');
   await run('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y',
    '-i',raw,'-frames:v',String(wanted),'-r',String(request.targetFps),
    '-vf','scale='+request.width+':'+request.height,
    '-c:v','libx264','-pix_fmt','yuv420p',final],{cwd:folder,timeoutMs:90000});
   return {status:'GENERATED_SCENE_CLIP',modelId:model.id,outputPath:final,
    inferenceMethod:'ACTUAL_LTX_PYTHON_PROCESS',
    referencePreservationVerified:false};
  }
 });
}
