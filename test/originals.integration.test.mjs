import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {renderOriginals,inspectEpisode} from '../originals/render.mjs';
test('real film has procedural character movements, six acts, audio and verified SRT',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-originals-qa-'));
 try{
  const result=await renderOriginals({outputRoot:root,seconds:6,fps:8});
  const probe=await inspectEpisode(result.film);
  assert(existsSync(result.film));assert.equal(probe.codec,'h264');
  assert.equal(probe.audioCodec,'aac');assert.equal(probe.frames,48);
  assert.equal(probe.durationSec,6);assert.equal(result.receipt.sceneCount,6);
  assert.equal(result.receipt.generativeModel,'NOT_USED');
  assert.equal(result.receipt.distribution,'DENIED_UNTIL_OWNER_APPROVAL');
  assert(readFileSync(join(result.folder,'subtitles.srt'),'utf8').includes('PIP FINDS'));
  assert(readFileSync(result.film).length>2000);
 }finally{rmSync(root,{recursive:true,force:true})}
},{timeout:90000});
test('real sixty-second original cartoon has 480 frames, six scenes and AAC music',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-originals-60s-'));
 try{
  const result=await renderOriginals({outputRoot:root,seconds:60,fps:8});
  const probe=await inspectEpisode(result.film);
  assert.equal(probe.frames,480);assert.equal(probe.durationSec,60);
  assert.equal(probe.codec,'h264');assert.equal(probe.audioCodec,'aac');
  assert.equal(result.manifest.acts.reduce((n,x)=>n+x.frames,0),480);
  assert.match(result.receipt.filmSha256,/^[a-f0-9]{64}$/);
 }finally{rmSync(root,{recursive:true,force:true})}
},{timeout:240000});
