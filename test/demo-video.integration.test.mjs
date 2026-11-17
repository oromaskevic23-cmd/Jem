import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,symlinkSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {assembleDemo} from '../src/demo-video.mjs';

function command(binary,args){
 const result=spawnSync(binary,args,{encoding:'utf8',timeout:30000});
 if(result.status!==0)throw Error(binary+' failed: '+result.stderr);
 return result.stdout;
}
function makeClip(file,color){
 command('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-f','lavfi','-i',
  `color=c=${color}:size=320x180:rate=8`,'-frames:v','24','-c:v','libx264','-pix_fmt','yuv420p',file]);
}
const sha=b=>createHash('sha256').update(b).digest('hex');

test('assembles two actual MP4 clips, narration, subtitles, and byte evidence',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jem-demo-'));
 try{
  const a=join(dir,'first clip.mp4'),b=join(dir,'second clip.mp4'),audio=join(dir,'voice.wav');
  makeClip(a,'red');makeClip(b,'blue');
  command('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-f','lavfi','-i',
   'sine=frequency=440:sample_rate=16000:duration=3','-c:a','pcm_s16le',audio]);
  const result=await assembleDemo({clips:[{path:a,startSec:0,durationSec:2},{path:b,startSec:1,durationSec:2}],
   captions:[{startMs:0,endMs:1500,text:'Synthetic test footage'},{startMs:2000,endMs:3500,text:'Second test clip'}],
   narrationPath:audio,rightsDeclaration:'I_CONFIRM_AUTHORIZATION_FOR_ALL_INPUTS',outputRoot:dir,width:320,height:180,fps:8});
  assert.equal(result.report.frames,32);assert.equal(result.report.durationSec,4);
  assert.equal(result.report.codec,'h264');assert.equal(result.report.videoSha256,sha(readFileSync(result.video)));
  assert.deepEqual(result.report.sources.map(x=>x.sha256),[sha(readFileSync(a)),sha(readFileSync(b))]);
  assert.equal(result.report.narrationSha256,sha(readFileSync(audio)));
  assert.match(readFileSync(result.captions,'utf8'),/00:00:02,000 --> 00:00:03,500/);
  assert.equal(result.report.publication,'NOT_PERFORMED');assert.equal(result.report.visualQA,'NOT_INDEPENDENTLY_VERIFIED');
  const raw=command('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_name','-of','json',result.video]);
  assert.equal(JSON.parse(raw).streams[0].codec_name,'aac');
  assert(existsSync(join(result.directory,'demo-evidence.json')));
 }finally{rmSync(dir,{recursive:true,force:true});}
},{timeout:120000});

test('rejects unsafe, out-of-range, and symbolic-link input before delivery',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jem-demo-invalid-'));
 try{
  const clip=join(dir,'clip.mp4'),alias=join(dir,'alias.mp4');makeClip(clip,'red');symlinkSync(clip,alias);
  const common={clips:[{path:clip,startSec:0,durationSec:2}],rightsDeclaration:'I_CONFIRM_AUTHORIZATION_FOR_ALL_INPUTS',outputRoot:dir,width:320,height:180,fps:8};
  await assert.rejects(assembleDemo({...common,rightsDeclaration:null}),/RIGHTS_DECLARATION_REQUIRED/);
  await assert.rejects(assembleDemo({...common,captions:[{startMs:0,endMs:900,text:'<b>bad</b>'}]}),/CAPTION_INVALID/);
  await assert.rejects(assembleDemo({...common,clips:[{path:clip,startSec:0,durationSec:5}]}),/CLIP_EXCEEDS_SOURCE/);
  await assert.rejects(assembleDemo({...common,clips:[{path:alias,startSec:0,durationSec:2}]}),/INPUT_FILE_INVALID/);
  await assert.rejects(assembleDemo({...common,clips:[{path:clip,startSec:0,durationSec:2,action:'publish'}]}),/CLIP_RANGE_INVALID/);
 }finally{rmSync(dir,{recursive:true,force:true});}
},{timeout:60000});
