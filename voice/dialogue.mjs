/** Offline speech voices through eSpeak NG. No third-party impersonation or cloud API. */
import {spawn} from 'node:child_process';
import {join,resolve} from 'node:path';
import {mkdirSync,statSync} from 'node:fs';
export function validateDialogue(screenplay){
 if(screenplay?.schema!=='jem_screenplay_v1'||screenplay.language!=='en'||
  !Array.isArray(screenplay.shots)||screenplay.shots.length!==6||
  screenplay.shots.some(s=>typeof s.dialogue?.text!=='string'||
   s.dialogue.text.length<3||s.dialogue.text.length>120||
   /[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/u.test(s.dialogue.text)||
   typeof s.fromSec!=='number'||typeof s.toSec!=='number'||s.fromSec>=s.toSec))
  throw Error('DIALOGUE_SCHEMA_DENIED');
 return screenplay.shots;
}
async function run(binary,args,{input=null,timeoutMs=18000}={}){
 return new Promise((ok,no)=>{
  const process=spawn(binary,args,{shell:false,stdio:['pipe','pipe','pipe']});
  let stderr='',out='',finished=false;
  const timer=setTimeout(()=>process.kill('SIGKILL'),timeoutMs);
  process.on('error',e=>{clearTimeout(timer);if(!finished){finished=true;no(e)}});
  process.stderr.on('data',b=>{if(stderr.length<1800)stderr+=b});
  process.stdout.on('data',b=>{if(out.length<10000)out+=b});
  process.on('close',code=>{
   clearTimeout(timer);if(finished)return;finished=true;
   if(code!==0)return no(Error('LOCAL_SPEECH_TOOL_NOT_AVAILABLE_OR_FAILED: '+stderr.slice(-400)));
   ok(out);
  });
  process.stdin.end(input);
 });
}
const speakRate=180;
export async function buildDialogueAssets(screenplay,{outputRoot}={}){
 validateDialogue(screenplay);
 if(typeof outputRoot!=='string'||!outputRoot.trim())throw Error('OUTPUT_ROOT_REQUIRED');
 const root=resolve(outputRoot);mkdirSync(root,{recursive:true,mode:0o700});
 const sounds=[];
 for(const [index,shot] of screenplay.shots.entries()){
  const filename=join(root,'voice-'+(index+1)+'.wav');
  await run('espeak-ng',['-v','en','-s',String(speakRate),'-w',filename,'--stdin'],
   {input:shot.dialogue.text+'\n'});
  if(statSync(filename).size<100)throw Error('VOICE_FILE_EMPTY');
  const json=JSON.parse(await run('ffprobe',['-v','error','-show_entries',
   'format=duration','-of','json',filename],{timeoutMs:8000}));
  const length=Number(json.format?.duration);
  if(!Number.isFinite(length)||length<=0||length>shot.toSec-shot.fromSec-0.25)
   throw Error('VOICE_TOO_LONG_FOR_SCENE');
  sounds.push({index,filename,fromSec:shot.fromSec+.12,
   endSec:shot.fromSec+.12+length,lengthSec:length,
   spokenBy:shot.dialogue.speaker,voice:'espeak-ng/en'});
 }
 return {voices:sounds,language:'en',method:'OFFLINE_ESPEAK_NG',
  voiceCloning:'NOT_USED',rights:'SYSTEM_SYNTHETIC_VOICE_ONLY',lipSync:'TIMELINE_APPROXIMATION_NOT_PHONEME_SYNC'};
}
export async function mixSpokenFilm({sourceMp4,assets,outputMp4}={}){
 if(typeof sourceMp4!=='string'||typeof outputMp4!=='string'||assets?.voices?.length!==6)
  throw Error('SPEECH_MIX_INPUT_DENIED');
 const args=['-hide_banner','-loglevel','error','-nostdin','-y','-i',resolve(sourceMp4)];
 for(const s of assets.voices)args.push('-i',s.filename);
 const filters=assets.voices.map((s,i)=>{
  if(!Number.isInteger(s.index)||s.index!==i||
    !Number.isFinite(s.fromSec)||s.fromSec<0||s.fromSec>60)
    throw Error('VOICE_TIMELINE_DENIED');
  return '['+(i+1)+':a]aresample=16000,adelay='+Math.round(s.fromSec*1000)+
   '|'+Math.round(s.fromSec*1000)+'[d'+i+']';
 });
 const merge=assets.voices.map((_,i)=>'[d'+i+']').join('')+
  'amix=inputs=6:duration=longest:normalize=0[voice];'+
  '[0:a][voice]amix=inputs=2:duration=first:weights=0.32 0.95:normalize=0[a]';
 args.push('-filter_complex',filters.join(';')+';'+merge,
  '-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','112k',
  '-movflags','+faststart',resolve(outputMp4));
 await run('ffmpeg',args,{timeoutMs:90000});
 if(statSync(outputMp4).size<1000)throw Error('VOICED_FILM_EMPTY');
 return {outputMp4,voiceMix:'TIMELINE_ALIGNED_SPEECH_AND_ORIGINAL_SCORE'};
}
