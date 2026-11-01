/**
 * Sprint 007 film session: character-reference binding before scene admission.
 * Local-only. Returns an evidence dossier, NEVER production release.
 */
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {bindCharacterBible} from './character-lock.mjs';
import {lockShotSequence} from './shot-continuity.mjs';
import {SceneReviewQueue} from './scene-review-queue.mjs';
import {assertSceneRequest} from './scene-contract.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
export async function runCinemaLabScene({request,characterBible,localRoot,
 modelManifest=null,worker=null}={}){
 if(typeof localRoot!=='string'||!localRoot.trim())throw Error('LOCAL_ROOT_REQUIRED');
 assertSceneRequest(request);
 const binding=bindCharacterBible(request,characterBible);
 mkdirSync(resolve(localRoot),{recursive:true,mode:0o700});
 const root=resolve(localRoot);
 const q=new SceneReviewQueue({databasePath:join(root,'scene-queue.sqlite'),
  artifactRoot:join(root,'rendered'),
  modelManifest,provider:worker});
 let result;
 try{result=await q.submit(request)}
 finally{q.close()}
 const dossier={schema:'jem_cinema_scene_proof_v1',
  missionId:request.missionId,shotId:request.shotId,
  binding,sceneResult:{
   state:result.state,
   clipSha256:result.clip_sha??null,
   reason:result.reason
  },
  inferenceStatus:!worker?'NO_GENERATIVE_MODEL_CONNECTED':
   result.clip_sha?'VIDEO_ARTIFACT_DECODED_HUMAN_QA_REQUIRED':'GENERATIVE_INFERENCE_UNCONFIRMED_OR_BLOCKED',
  continuity:'NOT_INDEPENDENTLY_VISUALLY_VERIFIED',
  review:'REQUIRED',
  production:'DENIED',paidServices:'DISABLED'};
 const filepath=join(root,'proof-'+request.shotId+'.json');
 writeFileSync(filepath,JSON.stringify(dossier,null,2)+'\n',{mode:0o600});
 return {dossier,file:filepath};
}


/**
 * Multi-shot laboratory session. Every shot is validated against a deterministic
 * continuity manifest before ANY model worker can be called. No publication.
 * The original Character Bible remains authoritative for each scene.
 */
export async function runCinemaLabSequence({shots, requests, characterBible, localRoot,
 modelManifest=null, worker=null}={}){
 if(!Array.isArray(requests)||!Array.isArray(shots)||requests.length!==shots.length)
  throw Error('SEQUENCE_REQUEST_COUNT_MISMATCH');
 if(typeof localRoot!=='string'||!localRoot.trim())throw Error('LOCAL_ROOT_REQUIRED');
 const manifest=lockShotSequence(shots);
 const bibleBindings=requests.map((request,i)=>{
  assertSceneRequest(request);
  if(request.shotId!==shots[i].shotId)throw Error('SHOT_ID_MISMATCH');
  const binding=bindCharacterBible(request,characterBible);
  if(!binding.referenceSha256s.includes(shots[i].referenceSha256))
   throw Error('SEQUENCE_REFERENCE_NOT_IN_BIBLE');
  if(!request.characterContinuityRules.lockedCharacterIds.includes(shots[i].characterId))
   throw Error('SEQUENCE_CHARACTER_NOT_LOCKED');
  return binding;
 });
 const root=resolve(localRoot);
 mkdirSync(root,{recursive:true,mode:0o700});
 const results=[];
 for(let i=0;i<requests.length;i++){
  const result=await runCinemaLabScene({
   request:requests[i],characterBible,localRoot:root,modelManifest,worker
  });
  results.push({shotId:shots[i].shotId,proofFile:result.file,
   sceneState:result.dossier.sceneResult.state,clipSha256:result.dossier.sceneResult.clipSha256});
 }
 const evidence={schema:'jem_cinema_sequence_proof_v1',
  manifestSha256:manifest.manifestSha256,characterBibleSha256:characterBible.bibleSha256,
  requestBindings:bibleBindings.map(x=>x.requestSha256),results,
  perceptualContinuity:'NOT_INDEPENDENTLY_VERIFIED',
  humanVisualQA:'REQUIRED',production:'DENIED',publish:'DENIED'};
 const file=join(root,'sequence-proof-'+manifest.manifestSha256+'.json');
 writeFileSync(file,JSON.stringify(evidence,null,2)+'\n',{mode:0o600});
 return {manifest,evidence,file};
}
