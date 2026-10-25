/** Jem🌼 FilmFactory: screenplay -> shots -> validated 2D rig movie, when compatible.
 * Photo references are never silently substituted by unrelated generated characters.
 */
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {writeScreenplay,compileRigFilm} from './screenplay.mjs';
import {useLocalScreenplayModel} from './local-ollama.mjs';
import {renderOriginals} from '../originals/render.mjs';
import {validateImageBytes} from '../src/storyboard.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const encode=(f,x)=>writeFileSync(f,JSON.stringify(x,null,2)+'\n',{mode:0o600});
export function inspectAuthorizedPhotos(paths=[]){
 if(!Array.isArray(paths)||paths.length>12)throw Error('PHOTO_COUNT_DENIED');
 return paths.map(path=>{
  if(typeof path!=='string'||!path||path.length>2000)throw Error('PHOTO_PATH_DENIED');
  const stat=statSync(path);
  if(!stat.isFile()||stat.size<32||stat.size>12*1024*1024)throw Error('PHOTO_SIZE_DENIED');
  const bytes=readFileSync(path);
  validateImageBytes(bytes);
  return {kind:'image',sha256:sha(bytes),authorized:true};
 });
}
export function developProductionProject({outputRoot,idea,theme='auto',language='en',
 durationSec=60,photoPaths=[],ownerConfirmsPhotoRights=false}={}){
 if(typeof outputRoot!=='string'||!outputRoot.trim())throw Error('OUTPUT_ROOT_REQUIRED');
 if(photoPaths.length&&!ownerConfirmsPhotoRights)throw Error('PHOTO_RIGHTS_CONFIRMATION_REQUIRED');
 const refs=inspectAuthorizedPhotos(photoPaths);
 const screenplay=writeScreenplay({idea,theme,language,durationSec,references:refs});
 mkdirSync(resolve(outputRoot),{recursive:true,mode:0o700});
 const directory=mkdtempSync(join(resolve(outputRoot),'jem-factory-'));
 encode(join(directory,'screenplay.json'),screenplay);
 encode(join(directory,'shot-plan.json'),{
  schema:'jem_shot_plan_v1',
  screenplaySha256:screenplay.screenplaySha256,
  shots:screenplay.shots.map(s=>({
   id:s.shotId,start:s.fromSec,end:s.toSec,
   prompt:s.shotPrompt,dialogue:s.dialogue,
   originalCharacterIds:s.characters,referenceIds:s.referenceIds,
   continuity:s.continuity
  }))
 });
 encode(join(directory,'character-bible.json'),{
  schema:'jem_character_bible_v1',
  characters:screenplay.characterBible,sourceReferences:screenplay.referenceAssets,
  photoSubjects:'UNVERIFIED_NO_MODEL_EXTRACTION',
  approval:'REQUIRED_BEFORE_COMMERCIAL_PRODUCTION'
 });
 return {directory,screenplay};
}
export async function runFilmFactory(config={}){
 let planning=developProductionProject(config);
 if(config.ollamaModel){
  const screenplay=await useLocalScreenplayModel(planning.screenplay,
   {model:config.ollamaModel,fetchImpl:config.ollamaFetch??fetch});
  encode(join(planning.directory,'screenplay.json'),screenplay);
  encode(join(planning.directory,'shot-plan.json'),{
   schema:'jem_shot_plan_v1',screenplaySha256:screenplay.screenplaySha256,
   shots:screenplay.shots.map(x=>({id:x.shotId,start:x.fromSec,end:x.toSec,
    prompt:x.shotPrompt,action:x.action,caption:x.caption,
    dialogue:x.dialogue,referenceIds:x.referenceIds,continuity:x.continuity}))
  });
  planning={...planning,screenplay};
 }
 const {directory,screenplay}=planning;
 if(screenplay.referenceAssets.length){
  const blocked={schema:'jem_factory_result_v1',screenplaySha256:screenplay.screenplaySha256,
   status:'BLOCKED_IMAGE_TO_VIDEO_MODEL_NOT_CONNECTED',
   assets:screenplay.referenceAssets.length,
   stages:{screenplay:'DRAFTED',shotPlan:'DRAFTED',references:'HASH_PINNED',
    animation:'NOT_RENDERED',voices:'NOT_GENERATED',soundtrack:'NOT_RENDERED',
    film:'NOT_CREATED',distribution:'DENIED'},
   note:'Photo reference subjects must not be replaced by unrelated preset Pip/Starflower rigs.',
   ownerApproval:'REQUIRED'};
  encode(join(directory,'production-report.json'),blocked);
  return {...planning,result:blocked,film:null};
 }
 const rig=compileRigFilm(screenplay);
 const rendered=await renderOriginals({outputRoot:directory,
  seconds:screenplay.seconds,fps:8,scriptedManifest:rig});
 const receipt=rendered.receipt;
 if(receipt.manifestSha256!==rig.manifestSha256||
  receipt.frames!==screenplay.seconds*8||
  receipt.durationSec<screenplay.seconds-.18||
  receipt.actualAnimatedMotion!=='PROCEDURAL_2D_POSE_AND_LIMB_ANIMATION')
  throw Error('FACTORY_RENDER_VALIDATION_DENIED');
 const result={schema:'jem_factory_result_v1',
  screenplaySha256:screenplay.screenplaySha256,
  manifestSha256:rig.manifestSha256,
  filmSha256:receipt.filmSha256,
  status:'PROCEDURAL_2D_FILM_READY_FOR_OWNER_REVIEW',
  videoPath:rendered.film,
  stages:{screenplay:'DRAFTED',shotPlan:'DRAFTED',references:'NONE',
   animation:'PROCEDURAL_PRESET_RIG',voices:'NOT_GENERATED',
   soundtrack:'ORIGINAL_INSTRUMENTAL',film:'MP4_VERIFIED',distribution:'DENIED'},
  runtimeVoice:'NONE',generativeAI:'NOT_CONNECTED',
  screenplaySource:screenplay.generator,
  finalQuality:'OWNER_REVIEW_REQUIRED',ownerApproval:'REQUIRED'};
 encode(join(directory,'production-report.json'),result);
 return {...planning,result,film:rendered.film,rendered};
}
