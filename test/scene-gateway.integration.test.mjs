import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {SceneReviewQueue} from '../video/scene-review-queue.mjs';
import {sceneRequestFromScreenplay} from '../video/scene-contract.mjs';
import {writeScreenplay} from '../factory/screenplay.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const manifest={id:'ltx-video-2b-distilled',weightsSha256:sha('CI fixture NOT real weights'),
 licenseReviewed:true,commercialUseReviewed:true,localOnly:true,runtimeOperatorApproved:true};
const screenplay=writeScreenplay({idea:'A little adventure follows a kind friend across the forest.'});
const request=sceneRequestFromScreenplay(screenplay,{references:[
 {id:'OWNER-FIXTURE',type:'image',sha256:sha('test image'),rightsConfirmed:true}
]});
test('a genuine decoded video from a synthetic worker is review-only, NEVER I2V acceptance',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-scene-e2e-'));
 try{
  const outputs=join(root,'media');mkdirSync(outputs);
  const clip=join(outputs,'test-fixture.mp4');
  const ffmpeg=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i',
   'testsrc2=size=320x192:rate=8:duration=6','-frames:v','48',
   '-c:v','libx264','-pix_fmt','yuv420p','-y',clip],{encoding:'utf8',timeout:30000});
  assert.equal(ffmpeg.status,0,ffmpeg.stderr);
  const q=new SceneReviewQueue({databasePath:join(root,'jobs.sqlite'),artifactRoot:outputs,
   modelManifest:manifest,provider:{generateSceneClip:async()=>({
    status:'GENERATED_SCENE_CLIP',modelId:manifest.id,outputPath:clip,
    referencePreservationVerified:true // deliberately untrusted worker assertion
   })}});
  const result=await q.submit(request);
  assert.equal(result.state,'REVIEW_REQUIRED');
  assert.match(result.clip_sha,/^[a-f0-9]{64}$/);
  assert.equal(result.production,'DENIED');
  assert.equal(result.publish,'OWNER_REVIEW_REQUIRED');
  q.close();
 }finally{rmSync(root,{recursive:true,force:true})}
},{timeout:65000});
test('a model-supplied video without character-continuity witness must be blocked',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-unverified-'));
 try{
  const out=join(root,'media');mkdirSync(out);
  const file=join(out,'synthetic.mp4');
  const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i',
   'color=c=blue:size=320x192:rate=8:duration=6','-frames:v','48',
   '-c:v','libx264','-y',file],{encoding:'utf8',timeout:30000});
  assert.equal(r.status,0,r.stderr);
  const q=new SceneReviewQueue({databasePath:join(root,'jobs.sqlite'),artifactRoot:out,
   modelManifest:manifest,provider:{generateSceneClip:async()=>({
    status:'GENERATED_SCENE_CLIP',modelId:manifest.id,outputPath:file,
    referencePreservationVerified:false
   })}});
  const result=await q.submit(request);
  assert.equal(result.state,'BLOCKED_REFERENCE_PRESERVATION_UNVERIFIED');
  assert.equal(result.clip_sha,null);q.close();
 }finally{rmSync(root,{recursive:true,force:true})}
},{timeout:65000});
