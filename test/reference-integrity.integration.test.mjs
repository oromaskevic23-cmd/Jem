import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {renderFilm} from '../src/render.mjs';

function ffmpeg(args) {
 const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error',...args],{timeout:30000});
 assert.equal(result.status,0,result.stderr?.toString());
 return result.stdout;
}

test('rendered frames keep the same reference if the source file changes during rendering',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jem-reference-integrity-'));
 try{
  const photo=join(dir,'reference.jpg'),replacement=join(dir,'replacement.jpg');
  for(const [file,color] of [[photo,'red'],[replacement,'blue']])
   ffmpeg(['-f','lavfi','-i',`color=c=${color}:s=96x96:r=1`,
    '-frames:v','1','-threads','1','-y',file]);
  const original=readFileSync(photo);
  const originalHash=createHash('sha256').update(original).digest('hex');
  const resultPromise=renderFilm({prompt:'A small bright flower appears on the stage.',photoPath:photo,
   outputRoot:join(dir,'output'),durationSec:4,fps:8,width:320,height:180});
  writeFileSync(photo,readFileSync(replacement));
  const result=await resultPromise;
  assert.equal(result.report.referenceSha256,originalHash);
  for(const time of [1,3]){
   const pixel=ffmpeg(['-ss',String(time),'-i',result.video,'-frames:v','1','-vf','scale=1:1',
    '-pix_fmt','rgb24','-f','rawvideo','-']);
   assert.equal(pixel.length,3);
   assert(pixel[0]>pixel[2]+100,'Both shots must use the original red image, not the blue replacement');
  }
  assert(!readdirSync(result.directory).some(name=>name.startsWith('reference-snapshot.')),
   'Temporary reference snapshot must be removed after rendering');
 }finally{rmSync(dir,{recursive:true,force:true});}
},{timeout:90000});

test('temporary reference snapshot is removed when image decoding fails',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jem-reference-failure-'));
 try{
  const photo=join(dir,'broken.jpg');
  const invalid=Buffer.alloc(64);invalid[0]=0xff;invalid[1]=0xd8;
  invalid[invalid.length-2]=0xff;invalid[invalid.length-1]=0xd9;
  writeFileSync(photo,invalid);
  const output=join(dir,'output');
  await assert.rejects(renderFilm({prompt:'A small bright flower appears on the stage.',photoPath:photo,
   outputRoot:output,durationSec:2,fps:8,width:320,height:180}));
  const projects=readdirSync(output);
  assert.equal(projects.length,1);
  assert(!readdirSync(join(output,projects[0])).some(name=>name.startsWith('reference-snapshot.')));
 }finally{rmSync(dir,{recursive:true,force:true});}
},{timeout:30000});
