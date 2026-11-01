/**
 * Jem Sprint 009: deterministic, no-side-effects I2V readiness gate.
 * No model downloads, no arbitrary Python execution and no fake inference.
 */
import {existsSync,statSync,readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
const HEX=/^[a-f0-9]{64}$/;
function fileSha(path){
 const file=realpathSync(path),st=statSync(file);
 if(!st.isFile()||st.size<1||st.size>16*1024*1024*1024)throw Error('INVALID_LOCAL_ASSET');
 return createHash('sha256').update(readFileSync(file)).digest('hex');
}
export function inspectI2VReadiness({gpu,model,reference,source,config,python,ffmpeg,ffprobe}={}){
 const blockers=[];
 if(!gpu||gpu.available!==true||!Number.isFinite(gpu.vramGb)||gpu.vramGb<=0)
  blockers.push('BLOCKED_GPU_UNAVAILABLE');
 if(!model||model.licenseReviewed!==true||model.commercialUseReviewed!==true||
  !HEX.test(model.weightsSha256||'')||!model.checkpointPath)
  blockers.push('BLOCKED_MODEL_UNAPPROVED');
 else if(!existsSync(model.checkpointPath)||fileSha(model.checkpointPath)!==model.weightsSha256)
  blockers.push('BLOCKED_MODEL_WEIGHTS_UNVERIFIED');
 for(const [label,item] of Object.entries({reference,source,config})){
  if(!item||typeof item.path!=='string'||!HEX.test(item.sha256||''))
   blockers.push('BLOCKED_'+label.toUpperCase()+'_PIN_MISSING');
  else if(!existsSync(item.path)||fileSha(item.path)!==item.sha256)
   blockers.push('BLOCKED_'+label.toUpperCase()+'_HASH_MISMATCH');
 }
 if(!python?.available)blockers.push('BLOCKED_PYTHON_UNAVAILABLE');
 if(!ffmpeg?.available||!ffprobe?.available)blockers.push('BLOCKED_FFMPEG_UNAVAILABLE');
 return Object.freeze({schema:'jem_i2v_readiness_v1',ready:!blockers.length,
  blockers,modelExecution:'NOT_STARTED',generativeClip:'NOT_GENERATED',
  identityVerified:false,publication:'DENIED'});
}
