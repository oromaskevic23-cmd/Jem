import {createHash} from 'node:crypto';
import {readFileSync,statSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';

const hex=/^[a-f0-9]{64}$/;
const sha=b=>createHash('sha256').update(b).digest('hex');

/** Local-only provenance check. This never claims visual identity similarity. */
export function verifyRenderedClipEvidence({clipPath,expectedSha256,sceneProofs,ownerReviewApproved=false}={}){
 if(typeof clipPath!=='string'||!clipPath||!hex.test(expectedSha256||''))
  throw Error('CLIP_EVIDENCE_INVALID');
 if(!Array.isArray(sceneProofs)||sceneProofs.length<1||sceneProofs.length>24)
  throw Error('SCENE_PROOFS_REQUIRED');
 const path=realpathSync(resolve(clipPath)),st=statSync(path);
 if(!st.isFile()||st.size<100||st.size>500*1024*1024)throw Error('CLIP_FILE_SIZE_DENIED');
 const actual=sha(readFileSync(path));
 if(actual!==expectedSha256)throw Error('CLIP_HASH_MISMATCH');
 const ids=new Set();
 for(const proof of sceneProofs){
  if(!proof||typeof proof!=='object'||typeof proof.shotId!=='string'||
   ids.has(proof.shotId)||!hex.test(proof.clipSha256||'')||
   proof.visualQa!=='INDEPENDENTLY_APPROVED')
   throw Error('SCENE_VISUAL_QA_REQUIRED');
  ids.add(proof.shotId);
 }
 return Object.freeze({schema:'jem_local_film_evidence_v1',clipSha256:actual,
  sceneCount:sceneProofs.length,visualReviewRecords:'PRESENT_UNVERIFIED_SIGNATURES',
  ownerReview:'NOT_AUTHENTICATED',publication:'DENIED',
  status:'ARTIFACT_INTEGRITY_VERIFIED_ONLY'});
}
