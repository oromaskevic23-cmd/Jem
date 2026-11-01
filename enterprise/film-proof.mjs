/** Jem Enterprise film evidence: hashes bind bytes, never independent QA or rights. */
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const HASH=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{2,99}$/;
const F=['schema','projectId','tenantId','filmSha256','storyboardSha256',
 'characterBibleSha256','referenceSha256','rightsEvidenceSha256','qaEvidenceSha256',
 'frameCount','durationSec','width','height','codec','animationKind',
 'sourceRights','actualModelInference','ownerApproval','independentVisualQA',
 'productionAuthorized','publishAuthorized','externalEffects','spendingUsd'];
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)
 &&Object.keys(o).sort().join('|')===[...k].sort().join('|');
const canonical=o=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a.localeCompare(b,'en'))));
const NULLHASH='0'.repeat(64);
function check(d) {
 if(!exact(d,F)||d.schema!=='jem.enterprise.film-proof.v1'
  ||[d.projectId,d.tenantId].some(s=>typeof s!=='string'||!ID.test(s))
  ||['filmSha256','storyboardSha256','characterBibleSha256','referenceSha256',
     'rightsEvidenceSha256','qaEvidenceSha256'].some(k=>typeof d[k]!=='string'||!HASH.test(d[k]))
  ||d.rightsEvidenceSha256===NULLHASH
  ||!Number.isSafeInteger(d.frameCount)||d.frameCount<8||d.frameCount>60000
  ||!Number.isSafeInteger(d.durationSec)||d.durationSec<1||d.durationSec>1800
  ||d.frameCount/d.durationSec>120
  ||!Number.isSafeInteger(d.width)||d.width<64||d.width>4096
  ||!Number.isSafeInteger(d.height)||d.height<64||d.height>4096
  ||d.width*d.height>16777216||d.codec!=='h264'
  ||!['CAMERA_MOVEMENT_ONLY','PROCEDURAL_2D_POSE_AND_LIMB_ANIMATION'].includes(d.animationKind)
  ||d.sourceRights!=='CLAIMED_NOT_LEGALLY_VERIFIED'
  ||d.actualModelInference!==false||d.ownerApproval!==false
  ||d.independentVisualQA!==false||d.productionAuthorized!==false
  ||d.publishAuthorized!==false||d.externalEffects!==false
  ||d.spendingUsd!==0||typeof d.spendingUsd!=='number')
   throw Error('FILM_PROVENANCE_SCOPE_DENIED');
}
export function createFilmDossier({projectId,tenantId,filmBytes,storyboardSha256,
 characterBibleSha256=NULLHASH,referenceSha256=NULLHASH,rightsEvidenceSha256,
 qaEvidenceSha256=NULLHASH,frameCount,durationSec,width,height,codec='h264',
 animationKind='CAMERA_MOVEMENT_ONLY'}={}) {
 if(!Buffer.isBuffer(filmBytes)||filmBytes.length<100||filmBytes.length>128*1024*1024)
  throw Error('FILM_BYTES_DENIED');
 const body={schema:'jem.enterprise.film-proof.v1',projectId,tenantId,
 filmSha256:sha(filmBytes),storyboardSha256,characterBibleSha256,
 referenceSha256,rightsEvidenceSha256,qaEvidenceSha256,frameCount,durationSec,
 width,height,codec,animationKind,sourceRights:'CLAIMED_NOT_LEGALLY_VERIFIED',
 actualModelInference:false,ownerApproval:false,independentVisualQA:false,
 productionAuthorized:false,publishAuthorized:false,externalEffects:false,spendingUsd:0};
 check(body);
 return Object.freeze({...body,dossierSha256:sha(canonical(body))});
}
export function verifyFilmDossier(d,bytes,{expectedStoryHash,expectedRightsHash}={}) {
 const denied={integrityVerified:false,rightsVerified:false,
 independentVisualQAVerified:false,productionAuthorized:false,publicationAuthorized:false};
 try {
  if(!exact(d,[...F,'dossierSha256'])||!Buffer.isBuffer(bytes)
   ||bytes.length>128*1024*1024||typeof d.dossierSha256!=='string'
   ||!HASH.test(d.dossierSha256)||typeof expectedStoryHash!=='string'
   ||!HASH.test(expectedStoryHash)||typeof expectedRightsHash!=='string'
   ||!HASH.test(expectedRightsHash))return denied;
  const payload={...d};delete payload.dossierSha256;check(payload);
  if(sha(canonical(payload))!==d.dossierSha256||sha(bytes)!==d.filmSha256
   ||d.storyboardSha256!==expectedStoryHash||d.rightsEvidenceSha256!==expectedRightsHash)
   return denied;
  return {...denied,integrityVerified:true,dossierSha256:d.dossierSha256};
 }catch{return denied}
}
