import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyRenderedClipEvidence} from '../video/film-evidence.mjs';
test('actual local bytes must match expected film hash; no publication even with caller approval',()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-proof-'));
 try{
  const path=join(root,'clip.mp4'),bytes=Buffer.alloc(256,1);
  writeFileSync(path,bytes);
  const hash=createHash('sha256').update(bytes).digest('hex');
  const input={clipPath:path,expectedSha256:hash,
   sceneProofs:[{shotId:'shot-001',clipSha256:'a'.repeat(64),visualQa:'INDEPENDENTLY_APPROVED'}],
   ownerReviewApproved:true};
  const proof=verifyRenderedClipEvidence(input);
  assert.equal(proof.status,'ARTIFACT_INTEGRITY_VERIFIED_ONLY');
  assert.equal(proof.publication,'DENIED');
  assert.equal(proof.ownerReview,'NOT_AUTHENTICATED');
  assert.throws(()=>verifyRenderedClipEvidence({...input,expectedSha256:'b'.repeat(64)}),/CLIP_HASH_MISMATCH/);
  assert.throws(()=>verifyRenderedClipEvidence({...input,sceneProofs:[{...input.sceneProofs[0],visualQa:'PENDING'}]}),/SCENE_VISUAL_QA_REQUIRED/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
