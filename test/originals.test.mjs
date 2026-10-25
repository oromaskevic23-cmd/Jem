import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createPilot,DESIGN,stageAtFrame,poseAtFrame,toSrt} from '../originals/pilot.mjs';
import {drawFrame} from '../originals/draw.mjs';
import {makePcmScore} from '../originals/score.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
test('full 60-second film has six original causal scenes and immutable characters',()=>{
 const m=createPilot();
 assert.equal(m.episodeId,'JEM-PILOT-001');assert.equal(m.seconds,60);
 assert.equal(m.fps,8);assert.equal(m.acts.length,6);
 assert.equal(m.acts.reduce((s,a)=>s+a.frames,0),480);
 assert.deepEqual(m.acts.map(x=>x.stage),['DISCOVER','WALK','CHASE','RESCUE','CELEBRATE','FINALE']);
 assert(m.acts.every(x=>x.characterIds.includes(DESIGN.protagonist.id)&&
  x.characterIds.includes(DESIGN.companion.id)));
 assert.equal(m.externalModelCalls,0);assert.equal(m.thirdPartyAssets,0);
});
test('two original character IDs never change over all frames',()=>{
 const m=createPilot();
 for(let f=0;f<480;f+=7){const p=poseAtFrame(m,f);
  assert.equal(p.referenceId,'PIP-001');assert.equal(p.companionId,'STARFLOWER-001')}
});
test('actual animated limb/art pixels change while background camera stays fixed',()=>{
 const m=createPilot(),a=drawFrame(m,84),b=drawFrame(m,85);
 assert.equal(a.length,320*180*3);assert.equal(b.length,a.length);
 assert.notEqual(sha(a),sha(b));
 assert(a.subarray((30*320+4)*3,(40*320+16)*3).equals(
  b.subarray((30*320+4)*3,(40*320+16)*3)));
 const x=poseAtFrame(m,84),y=poseAtFrame(m,85);
 assert.notEqual(x.armLeftAngle,y.armLeftAngle);
 assert.notEqual(x.legLeft,y.legLeft);
});
test('opening and finale have different original character motion',()=>{
 const m=createPilot();assert.notEqual(sha(drawFrame(m,0)),sha(drawFrame(m,479)));
 assert.equal(m.characterBible.protagonist.id,'PIP-001');
});
test('scene boundaries, frames and invalid dimensions fail closed',()=>{
 const m=createPilot();assert.equal(stageAtFrame(m,0).index,0);
 assert.equal(stageAtFrame(m,479).index,5);
 for(const f of [-1,480,4.5])assert.throws(()=>stageAtFrame(m,f),/FRAME_DENIED/);
 for(const seconds of [0,7,61])assert.throws(()=>createPilot({seconds}),/DURATION_DENIED/);
 assert.throws(()=>createPilot({width:1920}),/RESOLUTION_DENIED/);
});
test('closed-caption files match six scene time windows',()=>{
 const s=toSrt(createPilot());
 assert(s.includes('00:00:00,000 --> 00:00:10,000'));
 assert(s.includes('00:00:50,000 --> 00:01:00,000'));
 assert.equal((s.match(/-->/g)||[]).length,6);
});
test('original deterministic synthesized soundtrack is audible and non-sampled',()=>{
 const a=makePcmScore({seconds:6}),b=makePcmScore({seconds:6});
 assert.equal(a.samples,96000);assert(a.pcm.equals(b.pcm));
 assert(a.pcm.some(x=>x!==0));
 assert.equal(a.policy,'ORIGINAL_SYNTH_INSTRUMENTAL_NO_SPEECH');
 assert.throws(()=>makePcmScore({seconds:600}),/AUDIO_SETTINGS_DENIED/);
});
test('no false model, human QA, voice or public distribution claims',()=>{
 const m=createPilot();
 assert.equal(m.distribution,'OWNER_REVIEW_REQUIRED');
 assert.equal(m.audioPolicy,'ORIGINAL_SYNTH_INSTRUMENTAL_NO_NARRATION');
 assert.equal(m.animationPolicy,'ACTUAL_RIGGED_2D_LIMB_AND_EXPRESSION_MOTION_NO_AI_INFERENCE');
});
