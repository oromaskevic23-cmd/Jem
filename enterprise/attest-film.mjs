/**
 * Actual local FFmpeg film attestation: validate disk bytes, storyboard structure,
 * FFprobe output and rights-evidence file hash. NEVER proves actual legal rights
 * or independent perceptual QA, and never grants production/publication authority.
 */
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {probeVideo} from '../src/render.mjs';
import {createFilmDossier,verifyFilmDossier} from './film-proof.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const FAIL=msg=>{throw Error(msg)};
function bounded(file,{max=128*1024*1024,min=1}={}) {
 if(typeof file!=='string'||!file)FAIL('FILE_ARGUMENT_REQUIRED');
 const st=lstatSync(file);
 if(!st.isFile()||st.isSymbolicLink()||st.size<min||st.size>max)
  FAIL('INPUT_FILE_TYPE_OR_SIZE_DENIED');
 return readFileSync(file);
}
export async function attestLocalCameraFilm({renderDirectory,rightsFile,projectId,tenantId}={}) {
 if(typeof renderDirectory!=='string'||!renderDirectory)
  FAIL('RENDER_DIRECTORY_REQUIRED');
 const film=bounded(join(renderDirectory,'film.mp4'),{min:100}),
  reportBytes=bounded(join(renderDirectory,'render-report.json'),{max:1024*1024}),
  storyboardBytes=bounded(join(renderDirectory,'storyboard.json'),{max:1024*1024}),
  rightsBytes=bounded(rightsFile,{max:65536,min:20});
 let report,storyboard;
 try{report=JSON.parse(reportBytes);storyboard=JSON.parse(storyboardBytes)}
 catch{FAIL('MEDIA_EVIDENCE_JSON_DENIED')}
 if(!report||report.schema!=='jem_render_receipt_v1'
  ||report.renderer!=='FFMPEG_OFFLINE_CAMERA_MOTION'
  ||report.modelInference!=='NOT_PERFORMED'
  ||report.characterArticulation!=='NOT_AVAILABLE'
  ||report.productionRelease!=='NOT_APPROVED'
  ||report.audio!=='NOT_GENERATED'
  ||report.verified!=='FFPROBE_DURATION_FRAMES_RESOLUTION_AND_SHA256')
  FAIL('MEDIA_REPORT_SCOPE_DENIED');
 if(!storyboard||storyboard.schema!=='jem_storyboard_v1'
  ||storyboard.animationMode!=='CAMERA_MOTION_ONLY_NOT_GENERATIVE_CHARACTER_ANIMATION'
  ||storyboard.release!=='NON_PRODUCTION_LAB'
  ||!Array.isArray(storyboard.scenes)||storyboard.scenes.length<1
  ||storyboard.scenes.length>6||!storyboard.reference
  ||storyboard.reference.sha256!==report.referenceSha256
  ||!storyboard.scenes.every(x=>x.characterRefSha256===report.referenceSha256))
  FAIL('STORYBOARD_CHARACTER_OR_SCOPE_DENIED');
 const core={schema:storyboard.schema,prompt:storyboard.prompt,
   reference:storyboard.reference,durationSec:storyboard.durationSec,
   fps:storyboard.fps,width:storyboard.width,height:storyboard.height,
   scenes:storyboard.scenes};
 if(sha(JSON.stringify(core))!==storyboard.storyboardSha256
  ||storyboard.storyboardSha256!==report.storyboardSha256
  ||sha(film)!==report.filmSha256)
  FAIL('FILM_OR_STORYBOARD_HASH_DENIED');
 const measured=await probeVideo(join(renderDirectory,'film.mp4'));
 if(measured.codec!=='h264'||measured.codec!==report.codec
  ||measured.frames!==report.frames||measured.frames!==storyboard.durationSec*storyboard.fps
  ||measured.width!==report.width||measured.height!==report.height
  ||measured.width!==storyboard.width||measured.height!==storyboard.height
  ||Math.abs(measured.durationSec-report.durationSec)>0.15
  ||Math.abs(measured.durationSec-storyboard.durationSec)>0.15)
  FAIL('FFPROBE_TECHNICAL_QA_DENIED');
 const dossier=createFilmDossier({projectId,tenantId,filmBytes:film,
  storyboardSha256:report.storyboardSha256,
  referenceSha256:report.referenceSha256,
  rightsEvidenceSha256:sha(rightsBytes),qaEvidenceSha256:sha(JSON.stringify(measured)),
  frameCount:measured.frames,durationSec:storyboard.durationSec,
  width:measured.width,height:measured.height,codec:measured.codec});
 const verified=verifyFilmDossier(dossier,film,{
  expectedStoryHash:report.storyboardSha256,expectedRightsHash:sha(rightsBytes)});
 if(!verified.integrityVerified)FAIL('DOSSIER_RECOMPUTATION_DENIED');
 return Object.freeze({schema:'jem.enterprise.local-attestation.v1',
  dossier,technicalMediaVerified:true,
  evidenceIntegrityVerified:true,sourceRightsLegallyVerified:false,
  independentVisualQAVerified:false,actualModelInference:false,
  ownerProductionApproval:false,productionAuthorized:false,publishAuthorized:false,
  artifactBytes:film.length,filmSha256:report.filmSha256});
}
