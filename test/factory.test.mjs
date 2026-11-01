import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {writeScreenplay,compileRigFilm,selectWorld,verifyReferences} from '../factory/screenplay.mjs';
import {developProductionProject,inspectAuthorizedPhotos} from '../factory/pipeline.mjs';
const IDEA='The little heroes repair the garden and help their friends in the storm.';
const h=x=>createHash('sha256').update(x).digest('hex');
test('automatic original six-act screenplay uses idea and self-consistent schedule',()=>{
 const p=writeScreenplay({idea:IDEA,durationSec:60});
 assert.equal(p.schema,'jem_screenplay_v1');
 assert.equal(p.shots.length,6);
 assert.equal(p.shots.at(-1).toSec,60);
 assert.equal(p.shots[0].fromSec,0);
 assert(p.shots.every((s,i)=>s.fromSec===i*10&&s.toSec===(i+1)*10));
 assert.equal(p.shots[0].dialogue.state,'TEXT_ONLY_NOT_VOICED');
 assert.equal(p.generator,'DETERMINISTIC_NOT_LLM');
 assert(p.logline.includes(IDEA));
});
test('the same brief deterministically returns identical screenplay and hash',()=>{
 assert.deepEqual(writeScreenplay({idea:IDEA}),writeScreenplay({idea:IDEA}));
 assert.notEqual(writeScreenplay({idea:IDEA}).screenplaySha256,
  writeScreenplay({idea:IDEA+' More teamwork.'}).screenplaySha256);
});
test('studio selects original IMPERIAL Kids worlds from natural-language ideas',()=>{
 assert.equal(selectWorld('Let us sail on the ocean to visit a dolphin.'),'ocean');
 assert.equal(selectWorld('Путешествие к облачному маяку.'),'lighthouse');
 assert.equal(selectWorld('Горные спасатели помогают другу.'),'mountain');
 assert.equal(selectWorld('Children repair the workshop.'),'workshop');
 assert.equal(selectWorld('The magic of music and friendship.'),'music');
 assert.equal(selectWorld('Play together and show kindness.'),'forest');
 assert.throws(()=>selectWorld(IDEA,'nonexistent'),/THEME_INVALID/);
});
test('six requested IMPERIAL Kids franchises create different scripted captions',()=>{
 const names=['workshop','mountain','garden','forest','ocean','lighthouse','music'];
 const s=names.map(theme=>writeScreenplay({idea:IDEA,theme}));
 assert.equal(new Set(s.map(x=>x.title)).size,7);
 assert.equal(new Set(s.map(x=>x.shots[0].caption)).size,7);
 assert(s.every(x=>x.shots.length===6));
});
test('real rig manifest retains all generated subtitles and original character identity',()=>{
 const p=writeScreenplay({idea:IDEA});
 const m=compileRigFilm(p);
 assert.equal(m.seconds,60);assert.equal(m.acts.length,6);
 assert.deepEqual(m.acts.map(x=>x.caption),p.shots.map(x=>x.caption));
 assert(m.acts.every(a=>a.characterIds.join(',')==='PIP-001,STARFLOWER-001'));
 assert.match(m.manifestSha256,/^[a-f0-9]{64}$/);
 assert.equal(m.filmFactoryMode,'PRESET_2D_RIG_WITH_GENERATED_CAPTIONS');
});
test('source photo without verifiable owner permission is rejected',()=>{
 const a={kind:'image',sha256:h('original-photo'),authorized:true};
 const p=writeScreenplay({idea:IDEA,references:[a]});
 assert.equal(p.referenceAssets.length,1);
 assert.throws(()=>compileRigFilm(p),/IMAGE_TO_VIDEO_PROVIDER_NOT_CONNECTED/);
 assert.throws(()=>verifyReferences([{...a,authorized:false}]),/REFERENCE_NOT_AUTHORIZED/);
 assert.throws(()=>verifyReferences([a,a]),/REFERENCE_NOT_AUTHORIZED/);
});
test('invalid prompts, dangerous controls, unsupported duration and language rejected',()=>{
 for(const idea of ['little','x'.repeat(2001),'a'.repeat(20)+'\u202e'])
  assert.throws(()=>writeScreenplay({idea}),/IDEA_INVALID/);
 assert.throws(()=>writeScreenplay({idea:IDEA,language:'ru'}),/LANGUAGE_NOT_IMPLEMENTED/);
 assert.throws(()=>writeScreenplay({idea:IDEA,durationSec:91}),/DURATION_DENIED/);
 assert.throws(()=>writeScreenplay({idea:IDEA,durationSec:7}),/DURATION_DENIED/);
});
test('only owner-authorized image bytes can enter pre-production; media is never copied',()=>{
 const root=mkdtempSync(join(tmpdir(),'jem-script-unit-'));
 try{
  const photo=join(root,'child.png');
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(64)]);
  writeFileSync(photo,png);
  assert.throws(()=>developProductionProject({
   outputRoot:root,idea:IDEA,photoPaths:[photo]}),/PHOTO_RIGHTS_CONFIRMATION_REQUIRED/);
  const p=developProductionProject({
   outputRoot:root,idea:IDEA,photoPaths:[photo],ownerConfirmsPhotoRights:true});
  assert.equal(p.screenplay.referenceAssets.length,1);
  assert.equal(p.screenplay.referenceAssets[0].sha256,h(png));
  assert.equal(JSON.parse(readFileSync(join(p.directory,'screenplay.json'))).referenceAssets.length,1);
  assert.equal(JSON.parse(readFileSync(join(p.directory,'shot-plan.json'))).shots.length,6);
  assert(!readFileSync(join(p.directory,'screenplay.json'),'utf8').includes(png.toString('base64')));
  assert.throws(()=>inspectAuthorizedPhotos([join(root,'missing.jpg')]),/ENOENT/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('film-factory creates no production release, paid offer or spoken audio authority',()=>{
 const p=writeScreenplay({idea:IDEA});
 assert.equal(p.publicRelease,'OWNER_APPROVAL_REQUIRED');
 assert.equal(p.spokenDialogue,'NOT_GENERATED');
 assert.equal(p.videoModel,'NOT_CONNECTED');
 assert.equal(p.photoMode,'NO_EXTERNAL_PHOTO');
});
