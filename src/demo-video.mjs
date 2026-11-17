/** Jem offline demo editor: assembles operator-provided recordings, never publishes. */
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,lstatSync,mkdirSync,mkdtempSync,rmSync,renameSync} from 'node:fs';
import {isAbsolute,join,resolve} from 'node:path';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const allowedDimensions=new Set(['320x180','640x360','1280x720']);
const maxInputBytes=256*1024*1024;
const fail=code=>{throw Error(code);};

function run(binary,args,timeoutMs=120000){
 return new Promise((ok,bad)=>{
  const p=spawn(binary,args,{shell:false,stdio:['ignore','pipe','pipe'],windowsHide:true,
   env:{PATH:'/usr/local/bin:/usr/bin:/bin',LANG:'C.UTF-8'}});
  let out='',err='',settled=false,timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;p.kill('SIGKILL');},timeoutMs);
  p.stdout.on('data',b=>{if(out.length<32768)out+=b.toString();});
  p.stderr.on('data',b=>{if(err.length<32768)err+=b.toString();});
  p.on('error',()=>{if(!settled){settled=true;clearTimeout(timer);bad(Error('MEDIA_PROCESS_UNAVAILABLE'));}});
  p.on('close',code=>{if(settled)return;settled=true;clearTimeout(timer);
   if(code!==0||timedOut)return bad(Error('MEDIA_PROCESS_FAILED'));ok(out);});
 });
}

async function probeVideo(path){
 const raw=await run('ffprobe',['-v','error','-protocol_whitelist','file,pipe','-f','mov','-select_streams','v:0',
  '-show_entries','stream=width,height,codec_name,nb_frames,avg_frame_rate:format=duration','-of','json',path],10000);
 const parsed=JSON.parse(raw),stream=parsed.streams?.[0],durationSec=Number(parsed.format?.duration);
 if(!stream||!Number.isFinite(durationSec))fail('VIDEO_PROBE_INVALID');
 return {width:stream.width,height:stream.height,codec:stream.codec_name,frames:Number(stream.nb_frames),durationSec};
}

function snapshot(path,destination,extension){
 if(typeof path!=='string'||!isAbsolute(path)||!path.toLowerCase().endsWith(extension))fail('INPUT_PATH_INVALID');
 const st=lstatSync(path);
 if(!st.isFile()||st.isSymbolicLink()||st.size<32||st.size>maxInputBytes)fail('INPUT_FILE_INVALID');
 const bytes=readFileSync(path);
 if(bytes.length!==st.size)fail('INPUT_CHANGED_DURING_READ');
 writeFileSync(destination,bytes,{mode:0o600,flag:'wx'});
 return sha(bytes);
}

function srtTime(ms){
 const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),n=ms%1000;
 return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(n).padStart(3,'0')}`;
}

function captionsFile(captions,duration){
 if(!Array.isArray(captions)||captions.length>100)fail('CAPTIONS_INVALID');
 let lastEnd=0;
 return captions.map((item,i)=>{
  if(!item||Object.keys(item).sort().join('|')!=='endMs|startMs|text'||
   !Number.isSafeInteger(item.startMs)||!Number.isSafeInteger(item.endMs)||item.startMs<lastEnd||
   item.endMs<=item.startMs||item.endMs>duration*1000||typeof item.text!=='string'||
   !item.text.trim()||item.text.length>240||/[\u0000-\u001f\u007f-\u009f<>]/u.test(item.text)||item.text.includes('-->'))
   fail('CAPTION_INVALID');
  lastEnd=item.endMs;
  return `${i+1}\n${srtTime(item.startMs)} --> ${srtTime(item.endMs)}\n${item.text.trim()}\n`;
 }).join('\n');
}

/** Clips and optional WAV narration must be locally supplied by the operator. */
export async function assembleDemo({clips,captions=[],narrationPath=null,rightsDeclaration,outputRoot,width=1280,height=720,fps=24}={}){
 if(!Array.isArray(clips)||clips.length<1||clips.length>12||typeof outputRoot!=='string'||!outputRoot.trim()||
  !allowedDimensions.has(`${width}x${height}`)||![8,12,24,30].includes(fps))fail('DEMO_CONFIGURATION_INVALID');
 if(rightsDeclaration!=='I_CONFIRM_AUTHORIZATION_FOR_ALL_INPUTS')fail('RIGHTS_DECLARATION_REQUIRED');
 let duration=0;
 for(const clip of clips){
  if(!clip||Object.keys(clip).sort().join('|')!=='durationSec|path|startSec'||
   typeof clip.startSec!=='number'||!Number.isFinite(clip.startSec)||clip.startSec<0||
   typeof clip.durationSec!=='number'||!Number.isFinite(clip.durationSec)||clip.durationSec<=0||clip.durationSec>120||
   Math.abs(clip.durationSec*fps-Math.round(clip.durationSec*fps))>1e-8)fail('CLIP_RANGE_INVALID');
  duration+=clip.durationSec;
 }
 if(duration>300)fail('DEMO_DURATION_LIMIT');
 const subtitles=captionsFile(captions,duration);
 const root=resolve(outputRoot);mkdirSync(root,{recursive:true,mode:0o700});
 const project=mkdtempSync(join(root,'jem-demo-'));
 const temp=mkdtempSync(join(project,'work-'));
 try{
  const sources=[];
  for(let i=0;i<clips.length;i++){
   const input=join(temp,`input-${i}.mp4`),output=join(temp,`clip-${i}.mp4`),clip=clips[i];
   const digest=snapshot(clip.path,input,'.mp4');
   const probe=await probeVideo(input);
   if(clip.startSec+clip.durationSec>probe.durationSec+0.001)fail('CLIP_EXCEEDS_SOURCE');
   const filter=`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=${fps},format=yuv420p`;
   await run('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-ss',String(clip.startSec),
    '-protocol_whitelist','file,pipe','-f','mov','-i',input,'-vf',filter,'-frames:v',String(Math.round(clip.durationSec*fps)),
    '-an','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p',output]);
   const checked=await probeVideo(output);
   if(checked.frames!==Math.round(clip.durationSec*fps)||checked.width!==width||checked.height!==height||checked.codec!=='h264')
    fail('CLIP_RENDER_INVALID');
   sources.push({sha256:digest,startSec:clip.startSec,durationSec:clip.durationSec});
  }
  const concat=join(temp,'concat.txt');
  writeFileSync(concat,clips.map((_,i)=>`file 'clip-${i}.mp4'`).join('\n')+'\n',{mode:0o600});
  const joined=join(temp,'joined.mp4');
  await run('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-protocol_whitelist','file,pipe',
   '-f','concat','-safe','1','-i',concat,'-c','copy','-movflags','+faststart',joined]);
  const video=join(project,'demo.mp4');let narrationSha256=null;
  if(narrationPath!==null){
   const audio=join(temp,'narration.wav');narrationSha256=snapshot(narrationPath,audio,'.wav');
   await run('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-protocol_whitelist','file,pipe',
    '-f','mov','-i',joined,'-protocol_whitelist','file,pipe','-f','wav','-i',audio,
    '-c:v','copy','-c:a','aac','-b:a','128k','-af','apad','-t',String(duration),'-movflags','+faststart',video]);
  }else renameSync(joined,video);
  const checked=await probeVideo(video);
  if(checked.frames!==Math.round(duration*fps)||checked.width!==width||checked.height!==height||checked.codec!=='h264'||
    Math.abs(checked.durationSec-duration)>Math.max(0.15,2/fps))fail('DEMO_RENDER_INVALID');
  if(subtitles)writeFileSync(join(project,'captions.srt'),subtitles,{mode:0o600,flag:'wx'});
  const report={schema:'jem.demo-edit.v1',videoSha256:sha(readFileSync(video)),sources,
   narrationSha256,captionsSha256:subtitles?sha(Buffer.from(subtitles)):null,width,height,fps,frames:checked.frames,
   durationSec:checked.durationSec,codec:checked.codec,sourceRights:'OPERATOR_DECLARATION_NOT_LEGALLY_VERIFIED',
   visualQA:'NOT_INDEPENDENTLY_VERIFIED',publication:'NOT_PERFORMED',modelInference:'NOT_PERFORMED'};
  writeFileSync(join(project,'demo-evidence.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
  return {directory:project,video,captions:subtitles?join(project,'captions.srt'):null,report};
 }catch(error){rmSync(project,{recursive:true,force:true});throw error;}
 finally{rmSync(temp,{recursive:true,force:true});}
}
