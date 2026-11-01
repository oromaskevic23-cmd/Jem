import { createHash } from 'node:crypto';
import { lockShotSequence } from './shot-continuity.mjs';

/**
 * Deterministic production planning: shot order, continuity and budget gates.
 * It does not generate footage or assert visual QA.
 */
export function createFilmProductionPlan({title,shots,frameRate=24,approval='NOT_APPROVED'}={}){
 if(typeof title!=='string'||title.length<3||title.length>120||/[\u0000-\u001f]/.test(title))
  throw Error('INVALID_FILM_TITLE');
 if(!Number.isInteger(frameRate)||frameRate<8||frameRate>60)
  throw Error('INVALID_FRAME_RATE');
 const sequence=lockShotSequence(shots);
 const timeline=[];
 let frame=0;
 for(const shot of sequence.shots){
  const startFrame=frame;
  frame+=shot.durationFrames;
  timeline.push(Object.freeze({shotId:shot.shotId,characterId:shot.characterId,
   startFrame,endFrameExclusive:frame,camera:shot.camera,
   status:'AWAITING_GENERATION_AND_VISUAL_QA'}));
 }
 const canonical={schema:'jem_film_production_plan_v1',title,frameRate,
  continuityManifestSha256:sequence.manifestSha256,timeline,
  estimatedSeconds:Number((frame/frameRate).toFixed(3))};
 return Object.freeze({...canonical,sha256:createHash('sha256').update(JSON.stringify(canonical)).digest('hex'),
  approval:'NOT_APPROVED',publishAllowed:false,renderVerified:false});
}
