import {createHash} from 'node:crypto';
import {readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve} from 'node:path';

const sha=x=>createHash('sha256').update(x).digest('hex');
const HEX=/^[a-f0-9]{64}$/;
const allowedStates=new Set(['BLOCKED_MODEL_NOT_AVAILABLE','BLOCKED_RUNTIME_LIMIT',
 'BLOCKED_REFERENCE_PRESERVATION_UNVERIFIED','BLOCKED_SAFETY_POLICY','REVIEW_REQUIRED']);

/**
 * Read-only, independent evidence audit. Does not infer model inference,
 * identity fidelity or release authority from a file hash or status label.
 */
export function auditCinemaEvidence({dossierPath,expectedManifestSha256}={}){
 if(typeof dossierPath!=='string'||!dossierPath||!HEX.test(expectedManifestSha256||''))
  throw Error('AUDIT_INPUT_DENIED');
 const file=realpathSync(resolve(dossierPath)),st=statSync(file);
 if(!st.isFile()||st.size<2||st.size>1024*1024)throw Error('AUDIT_FILE_SIZE_DENIED');
 let d;
 try{d=JSON.parse(readFileSync(file,'utf8'))}catch{throw Error('AUDIT_JSON_INVALID')}
 if(!d||d.schema!=='jem_cinema_sequence_proof_v1'||
  d.manifestSha256!==expectedManifestSha256||
  !Array.isArray(d.results)||d.results.length<1||d.results.length>24||
  d.production!=='DENIED'||d.publish!=='DENIED'||
  d.humanVisualQA!=='REQUIRED'||d.perceptualContinuity!=='NOT_INDEPENDENTLY_VERIFIED')
  throw Error('AUDIT_PROOF_CONTRACT_DENIED');
 const seen=new Set();
 for(const scene of d.results){
  if(!scene||typeof scene.shotId!=='string'||seen.has(scene.shotId)||
   !allowedStates.has(scene.sceneState)||
   (scene.clipSha256!==null&&!HEX.test(scene.clipSha256||'')))
   throw Error('AUDIT_SCENE_STATE_DENIED');
  seen.add(scene.shotId);
 }
 return Object.freeze({schema:'jem_cinema_independent_audit_v1',
  dossierSha256:sha(readFileSync(file)),manifestSha256:expectedManifestSha256,
  scenesAudited:seen.size,contract:'PASS',actualGenerativeVideo:'NOT_PROVEN',
  characterIdentity:'NOT_PROVEN',publication:'DENIED'});
}
