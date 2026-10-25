import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {writeScreenplay} from '../factory/screenplay.mjs';
import {sceneRequestFromScreenplay} from '../video/scene-contract.mjs';
import {createCharacterBible,assertCharacterBible,bindCharacterBible,
 verifyContinuityReview,visualTraitNames} from '../video/character-lock.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const idea='The kind robot and glowing flower rescue a little animal during a magical forest storm.';
const screenplay=writeScreenplay({idea});
const assetSha=sha('synthetic bytes only');
const reference={id:'CHARACTER-001',sha256:assetSha,rightsConfirmed:true};
const request=sceneRequestFromScreenplay(screenplay,{references:[{...reference,type:'image'}]});
const bible=createCharacterBible({projectId:request.projectId,revision:1,
 ownerReferenceConsent:'LAB_ONLY',referenceImages:[reference],
 characters:request.characterContinuityRules.lockedCharacterIds.map(id=>({
  id,referenceIds:[reference.id],
  lockedTraits:{face:'Two original eyes',hair:'Unchanged head style',
   clothing:'Original clothing retained',colors:'Lilac white gold palette',
   marks:'Original reference marks retained',silhouette:'Consistent robot profile',
   style:'Approved family animation'},
  allowedChanges:['pose','expression','camera','lighting','background']
 }))});
const signed=(overrides={},keyPair=null)=>{
 const keys=keyPair??generateKeyPairSync('ed25519');
 const core={schema:'jem_character_review_v1',projectId:request.projectId,
  requestSha256:sha(JSON.stringify(request)),bibleSha256:bible.bibleSha256,
  clipSha256:sha('real clip fixture'),reviewerId:'QA-INDEPENDENT-001',
  reviewedAt:1793000000,verdict:'APPROVE',
  observations:visualTraitNames.map(trait=>({trait,matched:true,note:'Visually compared to pinned reference'})),
  keyId:'QA-KEY-001',...overrides};
 const signature=sign(null,Buffer.from(JSON.stringify(core)),keys.privateKey).toString('hex');
 return {review:{...core,signature},
  trust:{'QA-KEY-001':{reviewerId:'QA-INDEPENDENT-001',
   role:'INDEPENDENT_VISUAL_QA',publicKeyPem:keys.publicKey.export({type:'spki',format:'pem'})}}};
};
test('Character Bible pins seven meaningful traits and is strictly versioned',()=>{
 assert.equal(assertCharacterBible(bible),bible);
 assert.match(bible.bibleSha256,/^[a-f0-9]{64}$/);
 assert.equal(bible.characters[0].allowedChanges.length,5);
 assert.equal(bible.characters[0].lockedTraits.face,'Two original eyes');
});
test('request-bound character and photo hashes cannot be silently substituted',()=>{
 const bound=bindCharacterBible(request,bible);
 assert.equal(bound.bibleSha256,bible.bibleSha256);
 assert.equal(bound.requestSha256,sha(JSON.stringify(request)));
 assert.equal(bound.status,'REFERENCE_BOUND_VISUAL_SIMILARITY_UNVERIFIED');
 assert.throws(()=>bindCharacterBible({...request,approvedReferences:[{...request.approvedReferences[0],sha256:sha('other')} ]},bible),/REFERENCE_SWAP_DENIED/);
 assert.throws(()=>bindCharacterBible({...request,projectId:'FOREIGN-PROJECT'},bible),/BIBLE_PROJECT_SCOPE_DENIED/);
});
test('illegal locked trait, altered revision and unexpected field invalidate bible SHA',()=>{
 const b=structuredClone(bible);
 b.characters[0].lockedTraits.clothing='Replaced clothing without consent';
 assert.throws(()=>assertCharacterBible(b),/INTEGRITY_DENIED/);
 const c=structuredClone(bible);c.revision=2;
 assert.throws(()=>assertCharacterBible(c),/INTEGRITY_DENIED/);
 const d=structuredClone(bible);d.approvedToPublish=true;
 assert.throws(()=>assertCharacterBible(d),/SCHEMA_DENIED/);
});
test('Ed25519 independently signed seven-trait review is recorded, never release authority',()=>{
 const b=bindCharacterBible(request,bible),{review,trust}=signed();
 const result=verifyContinuityReview(review,{trustedReviewers:trust,binding:b,clipSha256:review.clipSha256});
 assert.equal(result.status,'INDEPENDENT_REVIEW_RECORDED');
 assert.equal(result.publication,'DENIED');
 assert.equal(result.evidence,'HUMAN_SIGNED_SEVEN_TRAITS_NOT_AUTOMATED_VISUAL_INFERENCE');
});
test('forged signed reviews, unknown signer, mismatched artifact are all rejected',()=>{
 const b=bindCharacterBible(request,bible),{review,trust}=signed();
 assert.throws(()=>verifyContinuityReview({...review,verdict:'REJECT'},{
  trustedReviewers:trust,binding:b,clipSha256:review.clipSha256
 }),/SIGNATURE_INVALID/);
 assert.throws(()=>verifyContinuityReview(review,{
  trustedReviewers:trust,binding:b,clipSha256:sha('swapped clip')
 }),/REVIEW_BINDING_DENIED/);
 assert.throws(()=>verifyContinuityReview(review,{
  trustedReviewers:{},binding:b,clipSha256:review.clipSha256
 }),/UNTRUSTED_VISUAL_REVIEWER/);
});
test('contradictory signed approval from human reviewer remains rejected',()=>{
 const b=bindCharacterBible(request,bible),x=signed({
  observations:visualTraitNames.map((trait,i)=>({trait,matched:i!==0,note:'Manual mismatch reviewed'}))
 });
 assert.throws(()=>verifyContinuityReview(x.review,{
  trustedReviewers:x.trust,binding:b,clipSha256:x.review.clipSha256
 }),/VERDICT_CONTRADICTS/);
});
test('independent explicit rejection is preserved even when signature is valid',()=>{
 const b=bindCharacterBible(request,bible),x=signed({verdict:'REJECT'});
 const result=verifyContinuityReview(x.review,{
  trustedReviewers:x.trust,binding:b,clipSha256:x.review.clipSha256
 });
 assert.equal(result.status,'CHARACTER_MISMATCH_REJECTED');
 assert.equal(result.publication,'DENIED');
});
