import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runFilmFactory} from '../factory/pipeline.mjs';
import {inspectEpisode} from '../originals/render.mjs';

test('single prompt creates original screenplay then an actual H264+AAC animated short',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-factory-e2e-'));
 try{
  const task=await runFilmFactory({
   idea:'Our garden friends search for water, protect little flowers and save the valley.',
   theme:'garden',durationSec:6,outputRoot:root
  });
  assert.equal(task.result.status,'PROCEDURAL_2D_FILM_READY_FOR_OWNER_REVIEW');
  assert(existsSync(task.film));
  const media=await inspectEpisode(task.film);
  assert.equal(media.codec,'h264');assert.equal(media.audioCodec,'aac');
  assert.equal(media.durationSec,6);assert.equal(media.frames,48);
  assert.equal(task.screenplay.shots.length,6);
  assert.equal(task.result.stages.screenplay,'DRAFTED');
  assert.equal(task.result.stages.animation,'PROCEDURAL_PRESET_RIG');
  assert.equal(task.result.stages.distribution,'DENIED');
  assert.equal(task.result.generativeAI,'NOT_CONNECTED');
  assert.equal(task.result.runtimeVoice,'NONE');
  assert.equal(task.rendered.manifest.acts[0].caption,'THE GARDEN NEEDS WATER');
  assert.equal(task.result.filmSha256,task.rendered.receipt.filmSha256);
  assert(existsSync(join(task.directory,'shot-plan.json')));
  assert(existsSync(join(task.directory,'character-bible.json')));
 }finally{rmSync(root,{recursive:true,force:true})}
},{timeout:90000});

test('user-provided character reference creates complete pre-production but no fake cartoon',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-photo-factory-'));
 try{
  const imagePath=join(root,'photo.jpg');
  writeFileSync(imagePath,Buffer.concat([
   Buffer.from([255,216]),Buffer.alloc(80),Buffer.from([255,217])
  ]));
  const task=await runFilmFactory({
   idea:'An ocean adventure with a brave little crew and a friendly dolphin.',
   outputRoot:root,photoPaths:[imagePath],ownerConfirmsPhotoRights:true
  });
  assert.equal(task.film,null);
  assert.equal(task.result.status,'BLOCKED_IMAGE_TO_VIDEO_MODEL_NOT_CONNECTED');
  assert.equal(task.result.stages.film,'NOT_CREATED');
  assert.equal(task.result.stages.references,'HASH_PINNED');
  assert.equal(task.screenplay.theme,'ocean');
  assert(existsSync(join(task.directory,'screenplay.json')));
  assert(existsSync(join(task.directory,'character-bible.json')));
  assert.deepEqual(JSON.parse(readFileSync(join(task.directory,'production-report.json'),'utf8')).assets,1);
 }finally{rmSync(root,{recursive:true,force:true})}
});
