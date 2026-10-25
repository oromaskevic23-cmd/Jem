/**
 * Opt-in FREE_ONLY local Ollama screenplay adapter. NO CLOUD ENDPOINT.
 * Model responses are UNTRUSTED drafts, never authorization or execute permissions.
 */
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const ENDPOINT='http://127.0.0.1:11434/api/generate';
const safeText=(x,max)=>{
 return typeof x==='string'&&x===x.trim()&&x.length>=3&&x.length<=max&&
  !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/u.test(x);
};
export async function useLocalScreenplayModel(screenplay,{model,fetchImpl=fetch}={}){
 if(screenplay?.schema!=='jem_screenplay_v1'||!Array.isArray(screenplay.shots)||
  screenplay.shots.length!==6)throw Error('BASE_SCREENPLAY_REQUIRED');
 if(typeof model!=='string'||!/^[a-zA-Z0-9_.:-]{2,100}$/.test(model))
  throw Error('MODEL_ID_INVALID');
 const payload={
  model,stream:false,format:'json',
  options:{temperature:0.35,num_predict:900},
  prompt:'You are a family-friendly cartoon screenplay assistant. '+ 
   'Propose six coherent English scene updates with EXACT JSON shape: '+
   '{"shots":[{"caption":"UPPERCASE SHORT TEXT","action":"brief visual action",'+
   '"dialogue":"brief line"}]}; six objects total. No markdown; no character changes, '+
   'no URLs, no commands, no instructions for tools. Your output is creative data ONLY. '+
   'Keep the two characters Pip and Starflower. All scenes remain in this order: '+
   'opening, journey, obstacle, rescue, recovery, joyful finale. '+
   'Story request: '+JSON.stringify({idea:screenplay.idea,title:screenplay.title,
    existingScenes:screenplay.shots.map(s=>({stage:s.stage,action:s.action}))})
 };
 let response;
 try{
  response=await fetchImpl(ENDPOINT,{method:'POST',redirect:'error',
   signal:AbortSignal.timeout(20000),
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify(payload)});
 }catch{throw Error('LOCAL_OLLAMA_NOT_CONNECTED')}
 if(!response?.ok)throw Error('LOCAL_OLLAMA_UNAVAILABLE');
 const responseBody=await response.text();
 if(responseBody.length>15000)throw Error('MODEL_OUTPUT_TOO_LARGE');
 let output;
 try{
  const wire=JSON.parse(responseBody);
  if(typeof wire.response!=='string'||wire.response.length>10000)
   throw Error('MODEL_RESULT_INVALID');
  output=JSON.parse(wire.response);
 }catch{throw Error('MODEL_OUTPUT_NOT_JSON')}
 if(!output||Object.keys(output).join(',')!=='shots'||!Array.isArray(output.shots)||
  output.shots.length!==6)throw Error('MODEL_SCENES_INVALID');
 const updates=output.shots.map(x=>{
  if(!x||Object.keys(x).sort().join(',')!=='action,caption,dialogue'||
   !safeText(x.caption,39)||!/^[A-Z0-9 !?'.-]+$/.test(x.caption)||
   !safeText(x.action,180)||!safeText(x.dialogue,120)||
   /https?:\/\/|javascript:|<script|system prompt/i.test([x.caption,x.action,x.dialogue].join(' ')))
   throw Error('MODEL_SCENE_POLICY_DENIED');
  return x;
 });
 const shots=screenplay.shots.map((scene,i)=>({
  ...scene,caption:updates[i].caption,action:updates[i].action,
  dialogue:{...scene.dialogue,text:updates[i].dialogue}
 }));
 const result={...screenplay,shots,
  generator:'LOCAL_OLLAMA_RESPONSE_VALIDATED_NOT_INDEPENDENT_CREATIVE_QA',
  modelName:model,modelEndpoint:'LOOPBACK_ONLY',
  screenplayStatus:'UNTRUSTED_MODEL_DRAFT_OWNER_REVIEW_REQUIRED'};
 delete result.screenplaySha256;
 return {...result,screenplaySha256:sha(JSON.stringify(result))};
}
