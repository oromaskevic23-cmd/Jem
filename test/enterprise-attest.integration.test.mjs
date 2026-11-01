import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {renderFilm} from '../src/render.mjs';
import {attestLocalCameraFilm} from '../enterprise/attest-film.mjs';
function ffmpeg(args){
 const proc=spawnSync('ffmpeg',['-hide_banner','-loglevel','error',...args],
  {timeout:30000,encoding:'utf8'});
 assert.equal(proc.status,0,proc.stderr);
}
test('actual H264 2-shot MP4 produces an Enterprise local proof with no release',async()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-enterprise-e2e-'));
 try{
  const image=join(root,'ref.jpg');
  ffmpeg(['-f','lavfi','-i','color=c=yellow:s=96x96:r=1','-frames:v','1','-y',image]);
  const render=await renderFilm({prompt:'A little flower grows under the stars.',
   photoPath:image,outputRoot:join(root,'render'),durationSec:4,
   fps:8,width:320,height:180});
  const rights=join(root,'rights-record.txt');
  writeFileSync(rights,'Owner asserts authorized local laboratory use of test synthetic reference.');
  const inputs={renderDirectory:render.directory,rightsFile:rights,
   projectId:'jem-proof-001',tenantId:'imperial-internal'};
  const receipt=await attestLocalCameraFilm(inputs);
  assert.equal(receipt.technicalMediaVerified,true);
  assert.equal(receipt.evidenceIntegrityVerified,true);
  assert.equal(receipt.sourceRightsLegallyVerified,false);
  assert.equal(receipt.independentVisualQAVerified,false);
  assert.equal(receipt.ownerProductionApproval,false);
  assert.equal(receipt.publishAuthorized,false);
  assert.equal(receipt.actualModelInference,false);
  assert.equal(receipt.dossier.referenceSha256,render.report.referenceSha256);
  const reportPath=join(render.directory,'render-report.json');
  writeFileSync(reportPath,readFileSync(reportPath,'utf8').replace(
    render.report.filmSha256,'f'.repeat(64)));
  await assert.rejects(attestLocalCameraFilm(inputs),/FILM_OR_STORYBOARD_HASH_DENIED/);
  const link=join(root,'rights-symlink.txt');symlinkSync(rights,link);
  await assert.rejects(attestLocalCameraFilm({...inputs,rightsFile:link}),/TYPE_OR_SIZE_DENIED/);
 }finally{rmSync(root,{recursive:true,force:true})}
},{timeout:120000});
