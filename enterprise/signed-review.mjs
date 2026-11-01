/** Jem signed review gate: Ed25519 human-review receipt, NO release authority. */
import {verify,createPublicKey} from 'node:crypto';
const HASH=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{2,99}$/;
const ROLE_DOMAINS={
 INDEPENDENT_VISUAL_QA:'JEM_VISUAL_REVIEW_V1\n',
 OWNER_SOURCE_REVIEW:'JEM_OWNER_SOURCE_REVIEW_V1\n'
};
const fields=['schema','dossierSha256','reviewId','nonceHex','reviewerId','keyId',
 'role','decision','issuedAt','expiresAt','productionAuthorized','publishAuthorized',
 'externalEffects','spendingUsd'];
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)
 &&Object.keys(o).sort().join('|')===[...k].sort().join('|');
const canonical=o=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a.localeCompare(b,'en'))));
export function verifyJemReview(review,{trustedKeys,expectedDossierSha256,expectedRole,
 now=()=>Math.floor(Date.now()/1000),isRevoked,consumeOnce}={}) {
 if(typeof isRevoked!=='function'||typeof consumeOnce!=='function')
  throw Error('REVIEW_SECURITY_CALLBACK_REQUIRED');
 if(!exact(review,[...fields,'signature']))throw Error('REVIEW_SCHEMA_DENIED');
 if(!Object.hasOwn(ROLE_DOMAINS,expectedRole)
  ||typeof expectedDossierSha256!=='string'||!HASH.test(expectedDossierSha256)
  ||review.schema!=='jem.enterprise.review.v1'
  ||review.dossierSha256!==expectedDossierSha256
  ||review.role!==expectedRole||!ID.test(review.reviewerId||'')
  ||!ID.test(review.keyId||'')||!HASH.test(review.reviewId||'')
  ||!HASH.test(review.nonceHex||'')||review.decision!=='REVIEW_ONLY'
  ||review.productionAuthorized!==false||review.publishAuthorized!==false
  ||review.externalEffects!==false||review.spendingUsd!==0
  ||typeof review.spendingUsd!=='number')throw Error('REVIEW_SCOPE_DENIED');
 const t=now();
 if(!Number.isSafeInteger(t)||!Number.isSafeInteger(review.issuedAt)
  ||!Number.isSafeInteger(review.expiresAt)||review.issuedAt<t-120
  ||review.issuedAt>t+30||review.expiresAt<=t
  ||review.expiresAt>review.issuedAt+300)throw Error('REVIEW_EXPIRED');
 const trusted=trustedKeys?.[review.keyId];
 if(!trusted||trusted.reviewerId!==review.reviewerId||trusted.role!==expectedRole
  ||typeof trusted.publicKeyPem!=='string')throw Error('UNTRUSTED_REVIEWER');
 if(typeof review.signature!=='string'||!/^[a-f0-9]{128}$/.test(review.signature))
  throw Error('REVIEW_SIGNATURE_FORMAT_DENIED');
 const {signature,...body}=review;
 let valid=false;
 try {valid=verify(null,Buffer.from(ROLE_DOMAINS[expectedRole]+canonical(body)),
   createPublicKey(trusted.publicKeyPem),Buffer.from(signature,'hex'))}
 catch {throw Error('REVIEW_SIGNATURE_DENIED')}
 if(!valid)throw Error('REVIEW_SIGNATURE_DENIED');
 if(isRevoked(review.keyId,review.reviewId)!==false)
  throw Error('REVIEW_REVOKED_OR_UNAVAILABLE');
 if(consumeOnce(review.reviewId,review.nonceHex)!==true)
  throw Error('REVIEW_REPLAY_DENIED');
 return Object.freeze({signedReviewVerified:true,role:expectedRole,
  dossierSha256:expectedDossierSha256,independentVisualQAVerified:false,
  ownerProductionApproval:false,publicationAuthorized:false,
  productionAuthorized:false,releaseStatus:'REVIEW_ONLY_EXTERNAL_APPROVAL_REQUIRED'});
}
