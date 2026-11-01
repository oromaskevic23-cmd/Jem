/**
 * Jem CharacterLock v1 — a human-review contract, NOT automatic face recognition.
 * Reference hashes prove byte integrity, never perceptual identity.
 * Release authority remains outside this module and defaults to DENIED.
 */
import {createHash,createPublicKey,verify as edVerify} from 'node:crypto';
import {assertSceneRequest} from './scene-contract.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const canonical=x=>JSON.stringify(x);
const HEX=/^[a-f0-9]{64}$/, ID=/^[A-Za-z0-9][A-Za-z0-9_.-]{2,80}$/;
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).sort().join(',')===k.slice().sort().join(',');
const clean=(x,max=200)=>typeof x==='string'&&x.length>=2&&x.length<=max&&
 !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/u.test(x);
const fields=['schema','projectId','revision','referenceImages','characters','ownerReferenceConsent'];
const traitFields=['face','hair','clothing','colors','marks','silhouette','style'];
const allowed=new Set(['pose','expression','camera','lighting','background']);
export function createCharacterBible({projectId,revision=1,referenceImages,characters,ownerReferenceConsent}={}){
 const doc={schema:'jem_character_bible_v1',projectId,revision,referenceImages,characters,ownerReferenceConsent};
 return Object.freeze({...doc,bibleSha256:sha(canonical(doc))});
}
export function assertCharacterBible(bible){
 if(!exact(bible,[...fields,'bibleSha256'])||
  bible.schema!=='jem_character_bible_v1'||!ID.test(bible.projectId||'')||
  !Number.isInteger(bible.revision)||bible.revision<1||
  bible.ownerReferenceConsent!=='LAB_ONLY'||
  !Array.isArray(bible.referenceImages)||bible.referenceImages.length<1||
  bible.referenceImages.length>12||
  !Array.isArray(bible.characters)||bible.characters.length<1||bible.characters.length>12)
  throw Error('CHARACTER_BIBLE_SCHEMA_DENIED');
 const referenceIds=new Set();
 for(const image of bible.referenceImages){
  if(!exact(image,['id','sha256','rightsConfirmed'])||
   !ID.test(image.id||'')||!HEX.test(image.sha256||'')||
   image.rightsConfirmed!==true||referenceIds.has(image.id))
   throw Error('CHARACTER_REFERENCE_DENIED');
  referenceIds.add(image.id);
 }
 const characterIds=new Set();
 for(const character of bible.characters){
  if(!exact(character,['id','referenceIds','lockedTraits','allowedChanges'])||
   !ID.test(character.id||'')||characterIds.has(character.id)||
   !Array.isArray(character.referenceIds)||character.referenceIds.length<1||
   new Set(character.referenceIds).size!==character.referenceIds.length||
   character.referenceIds.some(id=>!referenceIds.has(id))||
   !exact(character.lockedTraits,traitFields)||
   traitFields.some(x=>!clean(character.lockedTraits[x]))||
   !Array.isArray(character.allowedChanges)||character.allowedChanges.length<1||
   new Set(character.allowedChanges).size!==character.allowedChanges.length||
   character.allowedChanges.some(x=>!allowed.has(x)))
   throw Error('CHARACTER_TRAITS_OR_AUTHORITY_DENIED');
  characterIds.add(character.id);
 }
 const {bibleSha256,...unsigned}=bible;
 if(!HEX.test(bibleSha256||'')||sha(canonical(unsigned))!==bibleSha256)
  throw Error('CHARACTER_BIBLE_INTEGRITY_DENIED');
 return bible;
}
export function bindCharacterBible(request,bible){
 assertSceneRequest(request);assertCharacterBible(bible);
 if(request.projectId!==bible.projectId)throw Error('BIBLE_PROJECT_SCOPE_DENIED');
 const bRefs=new Map(bible.referenceImages.map(x=>[x.id,x.sha256]));
 for(const r of request.approvedReferences)
  if(bRefs.get(r.id)!==r.sha256||!r.rightsConfirmed)
   throw Error('REFERENCE_SWAP_DENIED');
 const required=request.characterContinuityRules.lockedCharacterIds;
 for(const id of required)if(!bible.characters.some(x=>x.id===id))
  throw Error('CHARACTER_SUBSTITUTION_DENIED');
 return Object.freeze({schema:'jem_character_binding_v1',
  projectId:bible.projectId,bibleSha256:bible.bibleSha256,
  requestSha256:sha(canonical(request)),
  referenceSha256s:request.approvedReferences.map(x=>x.sha256),
  status:'REFERENCE_BOUND_VISUAL_SIMILARITY_UNVERIFIED'});
}
const reviewFields=['schema','projectId','requestSha256','bibleSha256',
 'clipSha256','reviewerId','reviewedAt','verdict','observations'];
export function verifyContinuityReview(review,{trustedReviewers,binding,clipSha256}={}){
 if(!exact(review,[...reviewFields,'keyId','signature'])||
  review.schema!=='jem_character_review_v1'||
  !ID.test(review.reviewerId||'')||!ID.test(review.keyId||'')||
  !HEX.test(review.requestSha256||'')||!HEX.test(review.bibleSha256||'')||
  !HEX.test(review.clipSha256||'')||
  !Number.isInteger(review.reviewedAt)||review.reviewedAt<=0||
  !['APPROVE','REJECT'].includes(review.verdict)||
  !Array.isArray(review.observations)||review.observations.length!==7||
  new Set(review.observations.map(x=>x.trait)).size!==7||
  review.observations.some(x=>!exact(x,['trait','matched','note'])||
   !traitFields.includes(x.trait)||typeof x.matched!=='boolean'||
   !clean(x.note,300))||
  typeof review.signature!=='string'||!/^[a-f0-9]{128}$/.test(review.signature))
  throw Error('REVIEW_SCHEMA_DENIED');
 if(!binding||review.projectId!==binding.projectId||
  review.requestSha256!==binding.requestSha256||
  review.bibleSha256!==binding.bibleSha256||
  review.clipSha256!==clipSha256)throw Error('REVIEW_BINDING_DENIED');
 const trusted=trustedReviewers?.[review.keyId];
 if(!trusted||trusted.reviewerId!==review.reviewerId||
  trusted.role!=='INDEPENDENT_VISUAL_QA'||typeof trusted.publicKeyPem!=='string')
  throw Error('UNTRUSTED_VISUAL_REVIEWER');
 const {signature,...content}=review;
 let verified=false;
 try{verified=edVerify(null,Buffer.from(canonical(content)),createPublicKey(trusted.publicKeyPem),Buffer.from(signature,'hex'))}
 catch{verified=false}
 if(!verified)throw Error('REVIEW_SIGNATURE_INVALID');
 const allMatch=review.observations.every(x=>x.matched);
 if(review.verdict==='APPROVE'&&!allMatch)throw Error('REVIEW_VERDICT_CONTRADICTS_OBSERVATIONS');
 return Object.freeze({status:review.verdict==='APPROVE'?'INDEPENDENT_REVIEW_RECORDED':'CHARACTER_MISMATCH_REJECTED',
  evidence:'HUMAN_SIGNED_SEVEN_TRAITS_NOT_AUTOMATED_VISUAL_INFERENCE',
  clipSha256,reviewerId:review.reviewerId,publication:'DENIED'});
}
export const visualTraitNames=Object.freeze([...traitFields]);
