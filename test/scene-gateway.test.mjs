import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {writeScreenplay} from '../factory/screenplay.mjs';
import {sceneRequestFromScreenplay,assertSceneRequest} from '../video/scene-contract.mjs';
import {VIDEO_MODEL_CANDIDATES,verifyRuntimeModel} from '../video/model-registry.mjs';
import {SceneReviewQueue} from '../video/scene-review-queue.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const screenplay=writeScreenplay({idea:'The forest team helps a lost deer return safely to its woodland home.'});
const ref=[{id:'CHARACTER-001',type:'image',sha256:sha('synthetic-reference'),rightsConfirmed:true}];
const request=()=>sceneRequestFromScreenplay(screenplay,{references:ref});
const model={id:'ltx-video-2b-distilled',weightsSha256:sha('test-weights-only'),
 licenseReviewed:true,commercialUseReviewed:true,localOnly:true,runtimeOperatorApproved:true};
test('approved reference and locked cast compile into exact request schema',()=>{
 const r=request();assert.equal(r.schema,'jem_scene_generation_request_v1');
 assert.equal(r.approvedReferences[0].sha256,ref[0].sha256);
 assert.equal(r.characterContinuityRules.identityCheckRequired,true);
 assert.equal(r.targetDurationSec,6);
 assert.equal(r.ownerApprovalState,'LAB_REFERENCE_USE_ONLY');
});
test('missing photo, unknown field, forged script and production approval fail closed',()=>{
 const valid=request();
 for(const bad of [{...valid,approvedReferences:[]},{...valid,extraCapability:'execute'},
  {...valid,ownerApprovalState:'PRODUCTION_APPROVED'},
  {...valid,screenplaySha256:'broken'},
  {...valid,characterContinuityRules:{...valid.characterContinuityRules,preserveAppearance:false}}])
  assert.throws(()=>assertSceneRequest(bad),/DENIED|REQUIRED|INVALID/);
});
test('candidate registry explicitly declares NO running model and requires pinned hash and license review',()=>{
 assert(VIDEO_MODEL_CANDIDATES.length>=2);
 assert(VIDEO_MODEL_CANDIDATES.every(x=>x.status==='RESEARCH_ONLY'&&x.weightsSha256===null));
 assert.throws(()=>verifyRuntimeModel({...model,weightsSha256:null}),/MODEL_NOT_APPROVED/);
 assert.throws(()=>verifyRuntimeModel({...model,commercialUseReviewed:false}),/MODEL_NOT_APPROVED/);
 assert.equal(verifyRuntimeModel(model).id,model.id);
});
test('missing real provider persists fail-closed state across process restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jem-scene-unit-'));
 try{
  const db=join(dir,'queue.sqlite'),output=join(dir,'outputs');
  let queue=new SceneReviewQueue({databasePath:db,artifactRoot:output});
  const r=await queue.submit(request());
  assert.equal(r.state,'BLOCKED_MODEL_NOT_AVAILABLE');
  assert.equal(r.production,'DENIED');queue.close();
  queue=new SceneReviewQueue({databasePath:db,artifactRoot:output});
  const stored=queue.status('JEM-MISSION-004-SHOT1');
  assert.equal(stored.state,'BLOCKED_MODEL_NOT_AVAILABLE');
  const repeat=await queue.submit(request());
  assert.equal(repeat.state,'BLOCKED_MODEL_NOT_AVAILABLE');
  await assert.rejects(()=>queue.submit({...request(),visualStyle:'an entirely new style'}),/MISSION_REPLAY_CONFLICT/);
  queue.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('fake worker success cannot provide arbitrary output, unknown model or pre-approve release',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jem-scene-fake-'));
 try{
  const q=new SceneReviewQueue({
   databasePath:join(dir,'db.sqlite'),artifactRoot:join(dir,'media'),
   modelManifest:model,
   provider:{generateSceneClip:async()=>({status:'GENERATED_SCENE_CLIP',outputPath:'/etc/passwd',modelId:model.id})}
  });
  const r=await q.submit(request());
  assert.equal(r.state,'BLOCKED_SAFETY_POLICY');
  assert.equal(r.production,'DENIED');
  q.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});


test('process restart converts unfinished synthetic job to safe BLOCKED, not review authority',()=>{
 const dir=mkdtempSync(join(tmpdir(),'jem-crash-recovery-'));
 try{
  const db=join(dir,'jobs.sqlite'),root=join(dir,'assets');
  let q=new SceneReviewQueue({databasePath:db,artifactRoot:root});
  const r=request(),hash=sha(JSON.stringify(r));
  q.db.prepare("INSERT INTO scene_jobs (mission_id,request_sha,state,reason) VALUES (?, ?, ?, ?)")
   .run(r.missionId+'-'+r.shotId,hash,'PENDING_VALIDATION','WORKER_INTERRUPTED');
  q.close();
  q=new SceneReviewQueue({databasePath:db,artifactRoot:root});
  const state=q.status(r.missionId+'-'+r.shotId);
  assert.equal(state.state,'BLOCKED_RUNTIME_LIMIT');
  assert.equal(state.reason,'INTERRUPTED_JOB_REQUIRES_NEW_MISSION');
  q.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});
