import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {auditCinemaEvidence} from '../video/independent-audit.mjs';
const hash='a'.repeat(64);
const dossier={schema:'jem_cinema_sequence_proof_v1',manifestSha256:hash,
 results:[{shotId:'s1',sceneState:'BLOCKED_MODEL_NOT_AVAILABLE',clipSha256:null}],
 production:'DENIED',publish:'DENIED',humanVisualQA:'REQUIRED',
 perceptualContinuity:'NOT_INDEPENDENTLY_VERIFIED'};
test('independent audit checks real dossier bytes but never claims generative success',()=>{
 const dir=mkdtempSync(join(tmpdir(),'jem-audit-'));
 const file=join(dir,'proof.json');
 try{
  writeFileSync(file,JSON.stringify(dossier));
  const a=auditCinemaEvidence({dossierPath:file,expectedManifestSha256:hash});
  assert.equal(a.contract,'PASS');
  assert.equal(a.actualGenerativeVideo,'NOT_PROVEN');
  assert.equal(a.publication,'DENIED');
  writeFileSync(file,JSON.stringify({...dossier,publish:'APPROVED'}));
  assert.throws(()=>auditCinemaEvidence({dossierPath:file,expectedManifestSha256:hash}),/AUDIT_PROOF_CONTRACT_DENIED/);
  writeFileSync(file,JSON.stringify({...dossier,results:[dossier.results[0],dossier.results[0]]}));
  assert.throws(()=>auditCinemaEvidence({dossierPath:file,expectedManifestSha256:hash}),/AUDIT_SCENE_STATE_DENIED/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
