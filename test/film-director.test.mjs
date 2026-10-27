import test from 'node:test';
import assert from 'node:assert/strict';
import { createFilmProductionPlan } from '../video/film-director.mjs';
const shot=(id,frames=48)=>({shotId:id,characterId:'hero',referenceSha256:'a'.repeat(64),
 styleSha256:'b'.repeat(64),durationFrames:frames,camera:'static',prompt:'Safe original story'});
test('Film Director produces deterministic ordered shot schedule',()=>{
 const a=createFilmProductionPlan({title:'Jem Original',shots:[shot('s1'),shot('s2',72)]});
 const b=createFilmProductionPlan({title:'Jem Original',shots:[shot('s1'),shot('s2',72)]});
 assert.equal(a.sha256,b.sha256);
 assert.equal(a.timeline[0].startFrame,0);
 assert.equal(a.timeline[0].endFrameExclusive,48);
 assert.equal(a.timeline[1].startFrame,48);
 assert.equal(a.timeline[1].endFrameExclusive,120);
 assert.equal(a.estimatedSeconds,5);
 assert.equal(a.publishAllowed,false);
 assert.equal(a.renderVerified,false);
});
test('Film Director never accepts caller-supplied publish approval',()=>{
 const a=createFilmProductionPlan({title:'Jem Original',shots:[shot('s1')],approval:'APPROVED'});
 assert.equal(a.approval,'NOT_APPROVED');
});
test('Film Director denies unsupported frame rate',()=>assert.throws(
 ()=>createFilmProductionPlan({title:'Jem Original',shots:[shot('s1')],frameRate:240}),/INVALID_FRAME_RATE/));
test('Film Director denies changed reference',()=>assert.throws(
 ()=>createFilmProductionPlan({title:'Jem Original',shots:[shot('s1'),{...shot('s2'),referenceSha256:'c'.repeat(64)}]}),
 /CHARACTER_OR_STYLE_CHANGED/));
