import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {renderFilm,probeVideo} from '../src/render.mjs';
function command(binary,args){
 const r=spawnSync(binary,args,{encoding:'utf8',timeout:30000});
 if(r.status!==0)throw Error(binary+' FAILED '+r.stderr);
}
test('renders real animated MP4 from a real photograph-like JPEG reference',async()=>{
 const folder=mkdtempSync(join(tmpdir(),'jem-ci-render-'));
 try{
  const image=join(folder,'fixture.jpg');
  command('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i',
   'testsrc2=size=192x192:rate=1','-frames:v','1','-q:v','4','-y',image]);
  const result=await renderFilm({prompt:'An adventurous little astronaut finds a glowing flower in the forest.',
   photoPath:image,outputRoot:join(folder,'renders'),durationSec:4,fps:8,width:320,height:180});
  assert(existsSync(result.video));
  assert.equal(result.report.frames,32);
  assert.equal(result.report.width,320);
  assert.equal(result.report.height,180);
  assert.equal(result.report.scenes,2);
  assert.equal(result.report.durationSec,4);
  assert.equal(result.report.audio,'NOT_GENERATED');
  assert.equal(result.report.productionRelease,'NOT_APPROVED');
  assert.equal(result.storyboard.scenes[0].characterRefSha256,result.storyboard.scenes[1].characterRefSha256);
  const p=await probeVideo(result.video);
  assert.equal(p.frames,32);
  assert.equal(p.codec,'h264');
  assert(readFileSync(result.video).length>3000);
  const hashes=[0.3,1.1].map(time=>{
   const r=spawnSync('ffmpeg',['-v','error','-ss',String(time),'-i',result.video,
    '-frames:v','1','-f','md5','-'],{encoding:'utf8',timeout:10000});
   assert.equal(r.status,0,r.stderr);
   return r.stdout.trim();
  });
  assert.notEqual(hashes[0],hashes[1],'Video must have visible camera motion, not a frozen still frame');
 }finally{rmSync(folder,{recursive:true,force:true})}
},{timeout:90000});


test('60-second multi-shot MP4 truly renders six reference-locked scenes (480 verified frames)',async()=>{
 const folder=mkdtempSync(join(tmpdir(),'jem-60s-e2e-'));
 try{
  const photo=join(folder,'reference.jpg');
  command('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i',
   'testsrc2=size=256x256:rate=1','-frames:v','1','-q:v','4','-y',photo]);
  const result=await renderFilm({
   prompt:'A little astronaut travels through the enchanted forest, meets a dragon, solves a mystery, and returns home with a glowing flower.',
   photoPath:photo,outputRoot:join(folder,'renders'),durationSec:60,
   fps:8,width:320,height:180
  });
  const video=await probeVideo(result.video);
  assert.equal(video.codec,'h264');
  assert.equal(video.durationSec,60);
  assert.equal(video.frames,480);
  assert.equal(result.storyboard.scenes.length,6);
  assert.equal(new Set(result.storyboard.scenes.map(s=>s.characterRefSha256)).size,1);
  assert(result.storyboard.scenes.every(s=>s.frames===80));
  assert.equal(result.report.modelInference,'NOT_PERFORMED');
  assert.equal(result.report.characterArticulation,'NOT_AVAILABLE');
 }finally{rmSync(folder,{recursive:true,force:true})}
},{timeout:240000});
