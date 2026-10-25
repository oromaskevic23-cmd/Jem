import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {makeStoryboard,validateImageBytes,inspectImage} from '../src/storyboard.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(64)]);
const reference=validateImageBytes(png);
const prompt='A little astronaut explores a magical forest, finds a glowing flower, and returns home.';
const make=options=>makeStoryboard({prompt,reference,...options});
test('reference image is identified and pinned by original bytes',()=>{
 assert.equal(reference.format,'png');assert.equal(reference.sha256,sha(png));
 assert.throws(()=>validateImageBytes(Buffer.alloc(128)),/FORMAT_DENIED/);
 assert.throws(()=>validateImageBytes(Buffer.alloc(11)),/SIZE_DENIED/);
});
test('60 seconds at 12 fps creates exact deterministic 720-frame timeline',()=>{
 const a=make(),b=make();
 assert.deepEqual(a,b);assert.equal(a.scenes.length,6);
 assert.equal(a.scenes.reduce((sum,s)=>sum+s.frames,0),720);
 assert.equal(a.scenes.at(-1).startFrame+a.scenes.at(-1).frames,720);
 assert(a.scenes.every(s=>s.characterRefSha256===reference.sha256));
 assert.equal(a.animationMode,'CAMERA_MOTION_ONLY_NOT_GENERATIVE_CHARACTER_ANIMATION');
 assert.equal(a.release,'NON_PRODUCTION_LAB');
});
test('no scene can silently swap original character reference',()=>{
 const story=make();
 assert.equal(new Set(story.scenes.map(s=>s.characterRefSha256)).size,1);
});
test('short 2s and uneven 11s timelines retain every frame',()=>{
 for(const seconds of [2,3,4,11,59]){
  const s=make({durationSec:seconds,fps:8});
  assert.equal(s.scenes.reduce((n,scene)=>n+scene.frames,0),seconds*8);
  assert(s.scenes.every(scene=>scene.frames>0&&scene.durationSec>0));
 }
});
test('bad prompt and controls fail closed',()=>{
 for(const p of ['', 'short', 'a'.repeat(1001), 'Adventure \u202e hidden text']){
  assert.throws(()=>makeStoryboard({prompt:p,reference}),/PROMPT_INVALID/);
 }
});
test('unsupported codecs/durations/resolutions are blocked',()=>{
 for(const opts of [{fps:100},{durationSec:0},{durationSec:61},
  {width:4096},{height:4000},{fps:12.5},{durationSec:3.5}]){
  assert.throws(()=>make(opts),/NOT_SUPPORTED|OUT_OF_RANGE/);
 }
});
test('nonnumeric, absent or substituted identity digests are rejected',()=>{
 assert.throws(()=>makeStoryboard({prompt,reference:{format:'png',sha256:'broken'}}),/REFERENCE_NOT_LOCKED/);
 assert.throws(()=>makeStoryboard({prompt}),/REFERENCE_NOT_LOCKED/);
});
test('storyboard digest changes when narrative changes',()=>{
 const one=make();
 const two=makeStoryboard({prompt:prompt+' A dragon joins the party.',reference});
 assert.notEqual(one.storyboardSha256,two.storyboardSha256);
});
test('storyboard never claims voice, model inference or pose animation',()=>{
 const a=make();
 assert.equal(a.audio,'NOT_GENERATED');
 assert(a.scenes.every(s=>!Object.hasOwn(s,'generatedVideo')));
});
