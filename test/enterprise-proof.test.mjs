import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,randomBytes,sign} from 'node:crypto';
import {createFilmDossier,verifyFilmDossier} from '../enterprise/film-proof.mjs';
import {verifyJemReview} from '../enterprise/signed-review.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const film=Buffer.alloc(1024,42),story=sha('storyboard'),rights=sha('owner-supplied-rights-evidence');
const key=generateKeyPairSync('ed25519');
const now=1800000000;
const canonical=obj=>JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a],[b])=>a.localeCompare(b,'en'))));
const make=(change={})=>createFilmDossier({projectId:'jem-film-001',
 tenantId:'imperial-internal',filmBytes:film,storyboardSha256:story,
 rightsEvidenceSha256:rights,frameCount:120,durationSec:10,width:640,height:360,...change});
function receipt(doc=make(),role='INDEPENDENT_VISUAL_QA',change={},signer=key.privateKey){
 const claims={schema:'jem.enterprise.review.v1',dossierSha256:doc.dossierSha256,
  reviewId:randomBytes(32).toString('hex'),nonceHex:randomBytes(32).toString('hex'),
  reviewerId:'human-qa-001',keyId:'local-test-public-key-001',
  role,decision:'REVIEW_ONLY',issuedAt:now-2,expiresAt:now+100,
  productionAuthorized:false,publishAuthorized:false,externalEffects:false,
  spendingUsd:0,...change};
 const prefix=role==='INDEPENDENT_VISUAL_QA'?'JEM_VISUAL_REVIEW_V1\n':'JEM_OWNER_SOURCE_REVIEW_V1\n';
 return {...claims,signature:sign(null,Buffer.from(prefix+canonical(claims)),signer).toString('hex')};
}
function policy(role='INDEPENDENT_VISUAL_QA'){
 const seen=new Set();
 return {trustedKeys:{'local-test-public-key-001':{role,
  reviewerId:'human-qa-001',publicKeyPem:key.publicKey.export({type:'spki',format:'pem'})}},
  expectedDossierSha256:make().dossierSha256,expectedRole:role,now:()=>now,
  isRevoked:()=>false,consumeOnce:(a,b)=>{if(seen.has(a)||seen.has(b))return false;
   seen.add(a);seen.add(b);return true;}};
}
test('local artifact integrity is not rights clearance or QA',()=>{
 const r=verifyFilmDossier(make(),film,{expectedStoryHash:story,expectedRightsHash:rights});
 assert.equal(r.integrityVerified,true);assert.equal(r.rightsVerified,false);
 assert.equal(r.productionAuthorized,false);
});
test('tampered artifact storyboard and rights receipts fail',()=>{
 const d=make();
 for(const patch of [{bytes:Buffer.alloc(1024,41)},{story:sha('other')},{rights:sha('other')}])
 assert.equal(verifyFilmDossier(d,patch.bytes||film,{
  expectedStoryHash:patch.story||story,expectedRightsHash:patch.rights||rights
 }).integrityVerified,false);
});
test('fail-closed external effects and fake perceptual confidence',()=>{
 const d=make();
 for(const patch of [{actualModelInference:true},{ownerApproval:true},
 {independentVisualQA:true},{productionAuthorized:true},{publishAuthorized:true},
 {externalEffects:true},{spendingUsd:1},{spendingUsd:false},{unknown:'bad'}]){
  const changed={...d,...patch};
  assert.equal(verifyFilmDossier(changed,film,{expectedStoryHash:story,
   expectedRightsHash:rights}).integrityVerified,false);
 }
});
test('reject over-budget images, non-H264 and invented model mode',()=>{
 for(const patch of [{durationSec:0},{frameCount:999999},{width:5000},
  {codec:'proprietary'},{animationKind:'AI_VIDEO_INFERRED'}])
  assert.throws(()=>make(patch),/FILM_PROVENANCE_SCOPE_DENIED/);
});
test('no fabricated rights evidence hash allowed',()=>{
 assert.throws(()=>make({rightsEvidenceSha256:'0'.repeat(64)}),/FILM_PROVENANCE_SCOPE_DENIED/);
});
test('pinned reviewer can sign review only; no production privilege',()=>{
 const v=verifyJemReview(receipt(),policy());
 assert.equal(v.signedReviewVerified,true);
 assert.equal(v.independentVisualQAVerified,false);
 assert.equal(v.productionAuthorized,false);
});
test('owner source signature distinct from QA and cannot publish',()=>{
 assert.throws(()=>verifyJemReview(receipt(make(),'OWNER_SOURCE_REVIEW'),policy()),/REVIEW_SCOPE_DENIED/);
 const v=verifyJemReview(receipt(make(),'OWNER_SOURCE_REVIEW'),policy('OWNER_SOURCE_REVIEW'));
 assert.equal(v.ownerProductionApproval,false);
 assert.equal(v.publicationAuthorized,false);
});
test('identical reviewer receipt replay denied',()=>{
 const p=policy(),c=receipt();verifyJemReview(c,p);
 assert.throws(()=>verifyJemReview(c,p),/REVIEW_REPLAY_DENIED/);
});
test('bad reviewer signature rejected',()=>{
 const other=generateKeyPairSync('ed25519');
 assert.throws(()=>verifyJemReview(receipt(make(),'INDEPENDENT_VISUAL_QA',{},other.privateKey),policy()),/REVIEW_SIGNATURE_DENIED/);
});
test('reviewer cannot raise spending/publication permissions',()=>{
 for(const patch of [{productionAuthorized:true},{publishAuthorized:true},
 {externalEffects:true},{spendingUsd:3},{decision:'PUBLISH'}])
  assert.throws(()=>verifyJemReview(receipt(make(),'INDEPENDENT_VISUAL_QA',patch),policy()),/REVIEW_SCOPE_DENIED/);
});
test('expired review and missing revocation or anti-replay services deny',()=>{
 assert.throws(()=>verifyJemReview(receipt(make(),'INDEPENDENT_VISUAL_QA',{expiresAt:now-1}),policy()),/REVIEW_EXPIRED/);
 assert.throws(()=>verifyJemReview(receipt(),{...policy(),consumeOnce:null}),/REVIEW_SECURITY_CALLBACK_REQUIRED/);
 assert.throws(()=>verifyJemReview(receipt(),{...policy(),isRevoked:()=>undefined}),/REVIEW_REVOKED_OR_UNAVAILABLE/);
});
test('wrong task proof hash is rejected',()=>{
 assert.throws(()=>verifyJemReview(receipt(make(),'INDEPENDENT_VISUAL_QA',{dossierSha256:sha('different')}),policy()),/REVIEW_SCOPE_DENIED/);
});
