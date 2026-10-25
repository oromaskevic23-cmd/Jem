import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {writeScreenplay} from '../factory/screenplay.mjs';
import {sceneRequestFromScreenplay} from '../video/scene-contract.mjs';
import {createCharacterBible} from '../video/character-lock.mjs';
import {runCinemaLabScene} from '../video/cinema-session.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const screenplay=writeScreenplay({idea:'The kind hero finds a friend and rescues a lost forest animal.'});
const ref={id:'REF-PIP',sha256:sha('synthetic authorized reference'),rightsConfirmed:true};
const request=sceneRequestFromScreenplay(screenplay,{references:[{...ref,type:'image'}]});
const bible=createCharacterBible({
 projectId:request.projectId,revision:1,ownerReferenceConsent:'LAB_ONLY',
 referenceImages:[ref],
 characters:request.characterContinuityRules.lockedCharacterIds.map(id=>({
  id,referenceIds:[ref.id],
  lockedTraits:{face:'Original appearance',hair:'Preserve approved hair',
   clothing:'No replacement clothing',colors:'Approved color palette',
   marks:'All marks remain intact',silhouette:'Approved outlines',
   style:'Original consistent cartoon style'},
  allowedChanges:['pose','expression','camera','lighting','background']
 }))
});
test('scene with approved reference but no actual I2V worker produces a persistent refusal, not fake movie',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-cinema-scene-'));
 try{
  const {dossier,file}=await runCinemaLabScene({request,characterBible:bible,localRoot:root});
  assert.equal(dossier.sceneResult.state,'BLOCKED_MODEL_NOT_AVAILABLE');
  assert.equal(dossier.inferenceStatus,'NO_GENERATIVE_MODEL_CONNECTED');
  assert.equal(dossier.continuity,'NOT_INDEPENDENTLY_VISUALLY_VERIFIED');
  assert.equal(dossier.production,'DENIED');
  assert.equal(dossier.binding.referenceSha256s[0],ref.sha256);
  assert.equal(JSON.parse(readFileSync(file,'utf8')).sceneResult.clipSha256,null);
  const repeat=await runCinemaLabScene({request,characterBible:bible,localRoot:root});
  assert.equal(repeat.dossier.sceneResult.state,'BLOCKED_MODEL_NOT_AVAILABLE');
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('swapped image reference cannot enter lab ledger or be quietly replaced with generic cartoon art',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-cinema-swap-'));
 try{
  await assert.rejects(()=>runCinemaLabScene({
   request:{...request,approvedReferences:[{...request.approvedReferences[0],sha256:sha('swap')}]},
   characterBible:bible,localRoot:root}),/REFERENCE_SWAP_DENIED/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
