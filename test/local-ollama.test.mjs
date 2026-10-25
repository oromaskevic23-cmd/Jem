import test from 'node:test';
import assert from 'node:assert/strict';
import {writeScreenplay} from '../factory/screenplay.mjs';
import {useLocalScreenplayModel} from '../factory/local-ollama.mjs';
const screenplay=()=>writeScreenplay({idea:'Friends work together to rescue the ocean reef and return home happily.'});
const valid={shots:Array.from({length:6},(_,i)=>({
 caption:'FRIENDS HELP THE SEA '+(i+1),
 action:'The brave friends work together to solve a new challenge.',
 dialogue:'We can solve this together!'
}))};
test('opt-in local AI draft accepts strictly formatted safe untrusted response',async()=>{
 const calls=[];
 const mock=async(url,opts)=>{
  calls.push({url,method:opts.method,payload:JSON.parse(opts.body)});
  return {ok:true,text:async()=>JSON.stringify({response:JSON.stringify(valid)})};
 };
 const created=await useLocalScreenplayModel(screenplay(),{model:'qwen2.5:3b',fetchImpl:mock});
 assert.equal(calls[0].url,'http://127.0.0.1:11434/api/generate');
 assert.equal(calls[0].method,'POST');
 assert.equal(calls[0].payload.stream,false);
 assert.equal(created.shots.length,6);
 assert.equal(created.shots[0].dialogue.text,'We can solve this together!');
 assert.equal(created.generator,'LOCAL_OLLAMA_RESPONSE_VALIDATED_NOT_INDEPENDENT_CREATIVE_QA');
 assert.equal(created.publicRelease,'OWNER_APPROVAL_REQUIRED');
 assert.notEqual(created.screenplaySha256,screenplay().screenplaySha256);
});
test('rejects remote model identifiers and malformed AI response',async()=>{
 await assert.rejects(()=>useLocalScreenplayModel(screenplay(),{
  model:'https://evil.example/model',fetchImpl:async()=>({ok:true,text:async()=>''})
 }),/MODEL_ID_INVALID/);
 await assert.rejects(()=>useLocalScreenplayModel(screenplay(),{
  model:'qwen2.5:3b',fetchImpl:async()=>{throw Error('network disconnected')}
 }),/LOCAL_OLLAMA_NOT_CONNECTED/);
 await assert.rejects(()=>useLocalScreenplayModel(screenplay(),{
  model:'qwen2.5:3b',fetchImpl:async()=>({ok:true,text:async()=>'<html>not JSON</html>'})
 }),/MODEL_OUTPUT_NOT_JSON/);
});
test('rejects incomplete scenes, prompt injection and unbounded commands',async()=>{
 for(const output of [
  {shots:valid.shots.slice(0,5)},
  {shots:[{...valid.shots[0],caption:'DROP TABLE SYSTEM PROMPT'},...valid.shots.slice(1)]},
  {shots:[{...valid.shots[0],action:'https://example.org/call'},...valid.shots.slice(1)]},
  {shots:[{...valid.shots[0],dialogue:'X'.repeat(300)},...valid.shots.slice(1)]},
  {shots:[{...valid.shots[0],capabilities:'admin'},...valid.shots.slice(1)]}
 ]){
  await assert.rejects(()=>useLocalScreenplayModel(screenplay(),{
   model:'qwen2.5:3b',fetchImpl:async()=>({ok:true,text:async()=>JSON.stringify({
    response:JSON.stringify(output)})})
  }),/MODEL_SCENES_INVALID|MODEL_SCENE_POLICY_DENIED/);
 }
});
