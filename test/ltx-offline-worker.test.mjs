import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {writeScreenplay} from '../factory/screenplay.mjs';
import {sceneRequestFromScreenplay} from '../video/scene-contract.mjs';
import {prepareLtxExecution} from '../video/ltx-offline-worker.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
const command=(cwd,args)=>{
 const r=spawnSync('git',args,{cwd,encoding:'utf8',timeout:10000});
 assert.equal(r.status,0,r.stderr);return r.stdout.trim();
};
function fixtures(){
 const root=mkdtempSync(join(tmpdir(),'jem-ltx-preflight-'));
 const repo=join(root,'LTX-Video'),configs=join(repo,'configs'),media=join(root,'ref.png');
 mkdirSync(configs,{recursive:true});
 const script='print("SYNTHETIC_UNTRUSTED_SCRIPT_NOT_ACTUAL_LTX")\n';
 const conf='checkpoint_path: placeholder_synthetic_checkpoint\n';
 const weights=Buffer.from('A'.repeat(120));const bytes=Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(100)]);
 writeFileSync(join(repo,'inference.py'),script);
 writeFileSync(join(configs,'ltxv-2b-0.9.8-distilled.yaml'),conf);
 writeFileSync(join(root,'weights.safetensors'),weights);
 writeFileSync(media,bytes);
 command(repo,['init','-q']);
 command(repo,['-c','user.email=ci@example.test','-c','user.name=CI', 'add','inference.py','configs/ltxv-2b-0.9.8-distilled.yaml']);
 command(repo,['-c','user.email=ci@example.test','-c','user.name=CI','commit','-qm','synthetic code test fixture']);
 const gitSha=command(repo,['rev-parse','HEAD']);
 const config={
  modelManifest:{id:'ltx-video-2b-distilled',weightsSha256:digest(weights),
   licenseReviewed:true,commercialUseReviewed:true,localOnly:true,runtimeOperatorApproved:true},
  repoRoot:repo,repoCommitSha:gitSha,inferenceSha256:digest(script),
  configRelativePath:'configs/ltxv-2b-0.9.8-distilled.yaml',configSha256:digest(conf),
  checkpointFile:join(root,'weights.safetensors'),
  pythonExecutable:process.execPath,referenceFiles:{'REF001':{path:media,sha256:digest(bytes)}},
  artifactRoot:join(root,'output'),operatorApproved:true
 };
 return {root,media,config};
}
test('LTX worker does not self-authorize, does not install/download weights, requires operator approval',()=>{
 const {root,config}=fixtures();
 try{
  assert.throws(()=>prepareLtxExecution({...config,operatorApproved:false}),/APPROVAL_REQUIRED/);
  assert.throws(()=>prepareLtxExecution({...config,modelManifest:{...config.modelManifest,weightsSha256:'nope'}}),/NOT_APPROVED/);
  assert.throws(()=>prepareLtxExecution({...config,modelManifest:{...config.modelManifest,licenseReviewed:false}}),/NOT_APPROVED/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('pinned source, checkpoint bytes, commit and configuration are all checked BEFORE inference',()=>{
 const {root,config}=fixtures();
 try{
  assert.equal(prepareLtxExecution(config).workerKind,'REAL_PINNED_LTX_0_9_8_2B');
  assert.throws(()=>prepareLtxExecution({...config,inferenceSha256:digest('changed')}),/SHA_MISMATCH/);
  assert.throws(()=>prepareLtxExecution({...config,configSha256:digest('changed')}),/SHA_MISMATCH/);
  assert.throws(()=>prepareLtxExecution({...config,repoCommitSha:digest('wrong').slice(0,40)}),/COMMIT_MISMATCH/);
  assert.throws(()=>prepareLtxExecution({...config,configRelativePath:'../evil.yaml'}),/CONFIG_PATH_DENIED/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('worker must rehash source image before running LTX; changing photo fails without any external process',async()=>{
 const {root,media,config}=fixtures();
 try{
  const worker=prepareLtxExecution(config);
  const script=writeScreenplay({idea:'Pip and Starflower rescue a little forest animal in the storm.'});
  const request=sceneRequestFromScreenplay(script,{references:[{
   id:'REF001',type:'image',sha256:config.referenceFiles.REF001.sha256,rightsConfirmed:true
  }]});
  writeFileSync(media,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(100,1)]));
  await assert.rejects(()=>worker.generateSceneClip(request),/REFERENCE_BINDING_DENIED/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('unknown reference ID cannot be silently rebound to another supplied character',async()=>{
 const {root,config}=fixtures();
 try{
  const worker=prepareLtxExecution(config);
  const script=writeScreenplay({idea:'Pip and Starflower rescue a little forest animal in the storm.'});
  const request=sceneRequestFromScreenplay(script,{references:[{
   id:'REF999',type:'image',sha256:digest('wrong'),rightsConfirmed:true
  }]});
  await assert.rejects(()=>worker.generateSceneClip(request),/REFERENCE_BINDING_DENIED/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
