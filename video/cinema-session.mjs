/**
 * Sprint 007 film session: character-reference binding before scene admission.
 * Local-only. Returns an evidence dossier, NEVER production release.
 */
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {bindCharacterBible} from './character-lock.mjs';
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
