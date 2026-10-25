/**
 * Jem🌼 scene admission. No production or synthetic success substitution.
 * Trusted worker provisioning is a separate operator action; an unconnected
 * gateway only returns BLOCKED_MODEL_NOT_AVAILABLE.
 */
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {realpathSync,readFileSync,statSync,mkdirSync} from 'node:fs';
import {dirname,sep,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {assertSceneRequest} from './scene-contract.mjs';
import {verifyRuntimeModel} from './model-registry.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const json=x=>JSON.stringify(x);
const hashRequest=x=>sha(json(x));
const RESULTS=new Set(['PENDING_VALIDATION','BLOCKED_MODEL_NOT_AVAILABLE','BLOCKED_REFERENCE_PRESERVATION_UNVERIFIED',
 'BLOCKED_SAFETY_POLICY','BLOCKED_RUNTIME_LIMIT','REVIEW_REQUIRED']);
async function inspectClip(path){
 return new Promise((ok,no)=>{
  const child=spawn('ffprobe',['-v','error','-select_streams','v:0',
   '-show_entries','stream=codec_name,width,height,nb_frames,r_frame_rate:format=duration',
   '-of','json',path],{shell:false,stdio:['ignore','pipe','pipe']});
  let out='',err='',complete=false;
  const timer=setTimeout(()=>child.kill('SIGKILL'),15000);
  child.stdout.on('data',b=>{if(out.length<16000)out+=b});
  child.stderr.on('data',b=>{if(err.length<1000)err+=b});
  child.on('error',e=>{clearTimeout(timer);if(!complete){complete=true;no(e)}});
  child.on('close',code=>{
   clearTimeout(timer);if(complete)return;complete=true;
   if(code!==0)return no(Error('CLIP_DECODER_FAILED'));
   try{
    const doc=JSON.parse(out),s=doc.streams?.[0];
    const duration=Number(doc.format?.duration);
    if(s?.codec_name!=='h264'||!Number.isFinite(duration)||
      !Number.isInteger(Number(s.nb_frames))||Number(s.nb_frames)<8)
      throw Error('CLIP_CODEC_OR_FRAMES_INVALID');
    ok({width:s.width,height:s.height,frames:Number(s.nb_frames),durationSec:duration,codec:s.codec_name});
   }catch(e){no(e)}
  });
 });
}
export class SceneReviewQueue{
 constructor({databasePath,artifactRoot,modelManifest=null,provider=null}={}){
  if(typeof databasePath!=='string'||!databasePath||typeof artifactRoot!=='string'||!artifactRoot)
   throw Error('DATABASE_AND_ARTIFACT_ROOT_REQUIRED');
  mkdirSync(dirname(resolve(databasePath)),{recursive:true});
  mkdirSync(artifactRoot,{recursive:true});
  this.artifactRoot=realpathSync(artifactRoot);
  this.model=modelManifest?verifyRuntimeModel(modelManifest):null;
  this.provider=provider;
  this.db=new DatabaseSync(databasePath);
  this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  this.db.exec("CREATE TABLE IF NOT EXISTS scene_jobs (mission_id TEXT PRIMARY KEY, request_sha TEXT NOT NULL, state TEXT NOT NULL, model_id TEXT, clip_sha TEXT, reason TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  // On restart, incomplete work is denied instead of mislabeled as human-reviewed.
  this.db.prepare("UPDATE scene_jobs SET state='BLOCKED_RUNTIME_LIMIT',reason='INTERRUPTED_JOB_REQUIRES_NEW_MISSION',updated_at=CURRENT_TIMESTAMP WHERE state='PENDING_VALIDATION'").run();
 }
 close(){this.db.close()}
 status(missionId){
  return this.db.prepare('SELECT mission_id,request_sha,state,model_id,clip_sha,reason FROM scene_jobs WHERE mission_id=?').get(missionId)??null;
 }
 record(missionId,requestSha,state,reason,clipSha=null){
  if(!RESULTS.has(state))throw Error('STATE_DENIED');
  this.db.prepare("UPDATE scene_jobs SET state=?,reason=?,clip_sha=?,updated_at=CURRENT_TIMESTAMP WHERE mission_id=? AND request_sha=? AND state='PENDING_VALIDATION'")
   .run(state,reason,clipSha,missionId,requestSha);
  return {...this.status(missionId),production:'DENIED',publish:'OWNER_REVIEW_REQUIRED'};
 }
 async submit(request){
  assertSceneRequest(request);
  const requestSha=hashRequest(request),missionId=request.missionId+'-'+request.shotId;
  let inserted;
  try{inserted=this.db.prepare('INSERT OR IGNORE INTO scene_jobs (mission_id,request_sha,state,model_id,reason) VALUES (?, ?, ?, ?, ?)')
   .run(missionId,requestSha,'PENDING_VALIDATION',this.model?.id??null,'INTAKE_PENDING_VIDEO_VALIDATION').changes===1}
  catch{throw Error('SCENE_LEDGER_UNAVAILABLE')}
  const old=this.status(missionId);
  if(!inserted) {
   if(old?.request_sha!==requestSha)throw Error('MISSION_REPLAY_CONFLICT');
   return {...old,production:'DENIED',publish:'OWNER_REVIEW_REQUIRED'};
  }
  if(!this.model||typeof this.provider?.generateSceneClip!=='function')
   return this.record(missionId,requestSha,'BLOCKED_MODEL_NOT_AVAILABLE','NO_APPROVED_LOCAL_INFERENCE_WORKER');
  let result;
  try{result=await this.provider.generateSceneClip(request,this.model)}
  catch{return this.record(missionId,requestSha,'BLOCKED_RUNTIME_LIMIT','WORKER_FAILED_OR_TIMEOUT')}
  if(!result||typeof result!=='object'||result.status!=='GENERATED_SCENE_CLIP'||
    typeof result.outputPath!=='string'||result.outputPath.length>2048||
    result.modelId!==this.model.id)
    return this.record(missionId,requestSha,'BLOCKED_SAFETY_POLICY','WORKER_RESULT_UNTRUSTED');
  try{
   const path=realpathSync(result.outputPath);
   if(!path.startsWith(this.artifactRoot+sep))throw Error('ARTIFACT_PATH_OUTSIDE_LAB');
   const st=statSync(path);
   if(!st.isFile()||st.size<100||st.size>60*1024*1024)
    throw Error('ARTIFACT_SIZE_DENIED');
   const media=await inspectClip(path);
   if(media.width!==request.width||media.height!==request.height||
    Math.abs(media.durationSec-request.targetDurationSec)>.2||
    media.frames!==request.targetDurationSec*request.targetFps)
    throw Error('ARTIFACT_TIMELINE_DENIED');
   if(result.referencePreservationVerified!==true)
    return this.record(missionId,requestSha,'BLOCKED_REFERENCE_PRESERVATION_UNVERIFIED',
     'CHARACTER_CONTINUITY_REQUIRES_INDEPENDENT_HUMAN_REVIEW');
   const clipSha=sha(readFileSync(path));
   return this.record(missionId,requestSha,'REVIEW_REQUIRED',
    'CLIP_DECODED_AND_HASHED_BUT_HUMAN_IDENTITY_AND_OWNER_REVIEW_NOT_PASSED',clipSha);
  }catch{
   return this.record(missionId,requestSha,'BLOCKED_SAFETY_POLICY','CLIP_INVALID_OUTSIDE_ROOT_OR_UNVERIFIED');
  }
 }
}
