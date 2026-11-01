import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectI2VReadiness} from '../video/i2v-readiness.mjs';
test('no GPU or model must block inference and deny publication',()=>{
 const r=inspectI2VReadiness({});
 assert.equal(r.ready,false);
 assert.ok(r.blockers.includes('BLOCKED_GPU_UNAVAILABLE'));
 assert.ok(r.blockers.includes('BLOCKED_MODEL_UNAPPROVED'));
 assert.equal(r.generativeClip,'NOT_GENERATED');
 assert.equal(r.publication,'DENIED');
});
test('unverified model and missing pinned assets fail closed',()=>{
 const r=inspectI2VReadiness({
  gpu:{available:true,vramGb:8},
  model:{licenseReviewed:true,commercialUseReviewed:true,weightsSha256:'a'.repeat(64),checkpointPath:'/nonexistent-jem-model'},
  python:{available:true},ffmpeg:{available:true},ffprobe:{available:true}
 });
 assert.ok(r.blockers.includes('BLOCKED_MODEL_WEIGHTS_UNVERIFIED'));
 assert.ok(r.blockers.includes('BLOCKED_REFERENCE_PIN_MISSING'));
 assert.equal(r.ready,false);
});
