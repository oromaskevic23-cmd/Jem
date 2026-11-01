import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCinemaLabSequence } from '../video/cinema-session.mjs';
import { createCharacterBible } from '../video/character-lock.mjs';

const ref = 'a'.repeat(64), style = 'b'.repeat(64);
const bible = createCharacterBible({
 projectId:'jem-test',revision:1,ownerReferenceConsent:'LAB_ONLY',
 referenceImages:[{id:'ref-001',sha256:ref,rightsConfirmed:true}],
 characters:[{id:'hero-001',referenceIds:['ref-001'],
 lockedTraits:{face:'round face',hair:'short hair',clothing:'blue jacket',
 colors:'blue and yellow',marks:'small badge',silhouette:'rounded silhouette',style:'flat cartoon'},
 allowedChanges:['camera']}]
});
const shots = [
 {shotId:'shot-001',characterId:'hero-001',referenceSha256:ref,styleSha256:style,
 durationFrames:48,camera:'static',prompt:'First scene'},
 {shotId:'shot-002',characterId:'hero-001',referenceSha256:ref,styleSha256:style,
 durationFrames:48,camera:'pan-right',prompt:'Second scene'}
];
const request = (shotId) => ({
 schema:'jem_scene_request_v1',missionId:'mission-001',projectId:'jem-test',shotId,
 width:512,height:512,targetDurationSec:2,targetFps:24,
 approvedReferences:[{id:'ref-001',sha256:ref,rightsConfirmed:true}],
 characterContinuityRules:{lockedCharacterIds:['hero-001']},
});
test('sequence denies changed character reference before worker', async () => {
 const root=mkdtempSync(join(tmpdir(),'jem-sequence-'));
 try {
  await assert.rejects(runCinemaLabSequence({
   shots:[shots[0],{...shots[1],referenceSha256:'c'.repeat(64)}],
   requests:[request('shot-001'),request('shot-002')],characterBible:bible,localRoot:root
  }), /CHARACTER_OR_STYLE_CHANGED/);
 } finally {rmSync(root,{recursive:true,force:true})}
});
test('sequence rejects mismatched request count before worker', async () => {
 await assert.rejects(runCinemaLabSequence({shots,requests:[],characterBible:bible,localRoot:'/tmp/unused'}),/SEQUENCE_REQUEST_COUNT_MISMATCH/);
});
