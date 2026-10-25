/**
 * Jem🌼 — untrusted scene request, fail closed. A model's output is NOT proof
 * of character identity, owner consent, or publication authority.
 */
export const SCENE_SCHEMA='jem_scene_generation_request_v1';
const hex=/^[a-f0-9]{64}$/;
const id=/^[A-Za-z0-9][A-Za-z0-9_.-]{2,80}$/;
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).sort().join('|')===keys.slice().sort().join('|');
const keys=['schema','missionId','projectId','screenplaySha256','shotId',
 'approvedReferences','characterContinuityRules','environmentRules',
 'forbiddenDeviations','visualStyle','targetDurationSec','targetFps',
 'width','height','safetyPolicyVersion','ownerApprovalState'];
export function assertSceneRequest(request){
 if(!exact(request,keys)||request.schema!==SCENE_SCHEMA)throw Error('SCENE_SCHEMA_DENIED');
 for(const key of ['missionId','projectId','shotId','safetyPolicyVersion'])
  if(typeof request[key]!=='string'||!id.test(request[key]))throw Error('SCENE_ID_DENIED');
 if(!hex.test(request.screenplaySha256||''))throw Error('SCREENPLAY_SHA_DENIED');
 if(!Array.isArray(request.approvedReferences)||request.approvedReferences.length<1||
  request.approvedReferences.length>3)throw Error('SCENE_REFERENCES_REQUIRED');
 const distinct=new Set();
 for(const r of request.approvedReferences){
  if(!exact(r,['id','sha256','type','rightsConfirmed'])||
   !id.test(r.id)||!hex.test(r.sha256||'')||r.type!=='image'||
   r.rightsConfirmed!==true||distinct.has(r.id))throw Error('SCENE_REFERENCE_DENIED');
  distinct.add(r.id);
 }
 const continuity=request.characterContinuityRules;
 if(!exact(continuity,['lockedCharacterIds','preserveAppearance','identityCheckRequired'])||
  !Array.isArray(continuity.lockedCharacterIds)||continuity.lockedCharacterIds.length<1||
  continuity.lockedCharacterIds.length>12||
  continuity.lockedCharacterIds.some(x=>typeof x!=='string'||!id.test(x))||
  continuity.preserveAppearance!==true||continuity.identityCheckRequired!==true)
  throw Error('CONTINUITY_REQUIREMENTS_DENIED');
 for(const key of ['environmentRules','forbiddenDeviations']){
  if(!Array.isArray(request[key])||request[key].length<1||request[key].length>12||
   request[key].some(x=>typeof x!=='string'||x.length<3||x.length>180||
    /[\u0000-\u001f\u007f-\u009f]/.test(x)))
    throw Error('SCENE_RULES_DENIED');
 }
 if(typeof request.visualStyle!=='string'||request.visualStyle.length<3||
  request.visualStyle.length>180||
  /[\u0000-\u001f\u007f-\u009f]/.test(request.visualStyle))
  throw Error('SCENE_STYLE_DENIED');
 if(!Number.isInteger(request.targetDurationSec)||request.targetDurationSec<1||
  request.targetDurationSec>6||![8,12,24].includes(request.targetFps)||
  ![[320,192],[512,320],[768,448]].some(([w,h])=>request.width===w&&request.height===h))
  throw Error('SCENE_MEDIA_TARGET_DENIED');
 if(request.ownerApprovalState!=='LAB_REFERENCE_USE_ONLY')
  throw Error('OWNER_APPROVAL_REQUIRED');
 return request;
}
export function sceneRequestFromScreenplay(screenplay,{references,shotIndex=0}={}){
 if(screenplay?.schema!=='jem_screenplay_v1'||!Array.isArray(screenplay.shots)||
  screenplay.shots.length!==6||!hex.test(screenplay.screenplaySha256||''))
  throw Error('SCREENPLAY_NOT_READY');
 const shot=screenplay.shots[shotIndex];
 if(!shot)throw Error('SCENE_SHOT_NOT_FOUND');
 const request={schema:SCENE_SCHEMA,
  missionId:'JEM-MISSION-004',projectId:'JEM-ORIGINALS',
  screenplaySha256:screenplay.screenplaySha256,
  shotId:shot.shotId,
  approvedReferences:references,
  characterContinuityRules:{
   lockedCharacterIds:shot.characters,
   preserveAppearance:true,identityCheckRequired:true},
  environmentRules:[shot.location,'Maintain the scene continuity described by the screenplay'],
  forbiddenDeviations:['Character substitution','Logo modification','Unapproved additional subjects'],
  visualStyle:'Original family-friendly animation',
  targetDurationSec:Math.max(1,Math.min(6,Math.floor(shot.toSec-shot.fromSec))),
  targetFps:8,width:320,height:192,
  safetyPolicyVersion:'JEM-POLICY-004',
  ownerApprovalState:'LAB_REFERENCE_USE_ONLY'};
 return assertSceneRequest(request);
}
