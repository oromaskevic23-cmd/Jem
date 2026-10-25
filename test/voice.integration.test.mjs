import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {runFilmFactory} from '../factory/pipeline.mjs';
import {inspectEpisode} from '../originals/render.mjs';
test('one command renders 60-second 2D cartoon WITH real locally synthesized speech and lip timing',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-voice-e2e-'));
 try{
  const result=await runFilmFactory({outputRoot:root,durationSec:60,voiceEnabled:true,
   idea:'The forest team fixes a lighthouse and helps their friends return home safely.',
   theme:'lighthouse'});
  assert.equal(result.result.status,'PROCEDURAL_2D_FILM_READY_FOR_OWNER_REVIEW');
  assert.equal(result.result.runtimeVoice,'SYNTHETIC_ESPEAK_NG_TIMED');
  assert.equal(result.result.stages.voices,'OFFLINE_ESPEAK_NG');
  assert.equal(result.result.stages.distribution,'DENIED');
  assert(result.voice.voices.length===6);
  assert(result.voice.voices.every(v=>v.lengthSec>0&&v.endSec<=60));
  assert(existsSync(result.film));
  const probed=await inspectEpisode(result.film);
  assert.equal(probed.codec,'h264');
  assert.equal(probed.audioCodec,'aac');
  assert.equal(probed.frames,480);
  assert.equal(probed.durationSec,60);
  const proof=JSON.parse(readFileSync(join(result.directory,'voice-proof.json'),'utf8'));
  assert.equal(proof.method,'OFFLINE_ESPEAK_NG');
  assert.equal(proof.mouthAnimation,'TIMING_ESTIMATE_NOT_PHONEME_LIPSYNC');
  assert.equal(proof.release,'OWNER_REVIEW_REQUIRED');
  assert.equal(result.result.filmSha256,proof.finalFilmSha256);
 }finally{rmSync(root,{recursive:true,force:true})}
},{timeout:240000});
