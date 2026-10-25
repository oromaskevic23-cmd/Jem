/** Jem🌼 Originals: real deterministic 2D character-animation film with original instrumental soundtrack. */
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {createPilot,toSrt} from './pilot.mjs';
import {drawFrame} from './draw.mjs';
import {writeWav} from './score.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
function processExit(cmd,args,{stdinFrames,timeoutMs=180000}={}){
 return new Promise(async(ok,no)=>{
  const child=spawn(cmd,args,{shell:false,stdio:['pipe','pipe','pipe']});
  let errors='',out='',settled=false;
  const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);
  child.on('error',e=>{
   if(!settled){settled=true;clearTimeout(timer);no(e)}
  });
  child.stderr.on('data',b=>{if(errors.length<12000)errors+=b.toString()});
  child.stdout.on('data',b=>{if(out.length<12000)out+=b.toString()});
  child.on('close',code=>{
   clearTimeout(timer);if(settled)return;settled=true;
   if(code!==0)return no(Error('MEDIA_EXECUTION_FAILED: '+cmd+' '+errors.slice(-1800)));
   ok(out);
  });
  if(stdinFrames){
   try{
    for(const frame of stdinFrames){
     if(child.stdin.destroyed)throw Error('MEDIA_PIPE_CLOSED');
     if(!child.stdin.write(frame))await once(child.stdin,'drain');
    }
    child.stdin.end();
   }catch(e){child.stdin.destroy();child.kill('SIGKILL')}
  }else child.stdin.end();
 });
}
export async function inspectEpisode(file){
 const raw=await processExit('ffprobe',['-v','error','-show_entries',
  'format=duration:stream=codec_type,codec_name,width,height,nb_frames,r_frame_rate',
  '-of','json',file],{timeoutMs:15000});
 const obj=JSON.parse(raw),video=obj.streams?.find(s=>s.codec_type==='video'),
  audio=obj.streams?.find(s=>s.codec_type==='audio');
 if(!video||!audio)throw Error('AUDIO_VIDEO_STREAM_REQUIRED');
 return {durationSec:Number(obj.format?.duration),frames:Number(video.nb_frames),
  codec:video.codec_name,audioCodec:audio.codec_name,
  width:video.width,height:video.height,fps:video.r_frame_rate};
}
export async function renderOriginals({outputRoot,seconds=60,fps=8,scriptedManifest=null}={}){
 if(typeof outputRoot!=='string'||!outputRoot.trim())throw Error('OUTPUT_ROOT_REQUIRED');
 const manifest=scriptedManifest??createPilot({seconds,fps});
 if(scriptedManifest){
  if(manifest.schema!=='jem_originals_episode_v1'||manifest.seconds!==seconds||
   manifest.fps!==fps||manifest.width!==320||manifest.height!==180||
   !Array.isArray(manifest.acts)||manifest.acts.length!==6||
   manifest.characterBible?.protagonist?.id!=='PIP-001'||
   manifest.characterBible?.companion?.id!=='STARFLOWER-001')
    throw Error('RIG_MANIFEST_DENIED');
  const copy={...manifest};delete copy.manifestSha256;
  if(manifest.manifestSha256!==sha(JSON.stringify(copy))||
   manifest.acts.some((a,i)=>a.startFrame!==i*seconds*fps/6||
    a.frames!==seconds*fps/6||
    typeof a.caption!=='string'||a.caption.length>39||
    !/^[A-Z0-9 !?.'-]+$/.test(a.caption)))
    throw Error('RIG_MANIFEST_INTEGRITY_DENIED');
 }
 mkdirSync(resolve(outputRoot),{recursive:true,mode:0o700});
 const folder=mkdtempSync(join(resolve(outputRoot),'jem-originals-'));
 const film=join(folder,'jem-originals-pip-starflower.mp4'),
  wav=join(folder,'original-score.wav');
 const sound=writeWav(wav,{seconds});
 writeFileSync(join(folder,'episode.json'),JSON.stringify(manifest,null,2)+'\n');
 writeFileSync(join(folder,'subtitles.srt'),toSrt(manifest));
 function* frames(){for(let i=0;i<seconds*fps;i++)yield drawFrame(manifest,i)}
 await processExit('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y',
  '-f','rawvideo','-pixel_format','rgb24','-video_size',
  manifest.width+'x'+manifest.height,
  '-framerate',String(fps),'-i','pipe:0',
  '-i',wav,'-c:v','libx264','-preset','veryfast','-crf','24',
  '-pix_fmt','yuv420p','-r',String(fps),
  '-c:a','aac','-b:a','96k','-movflags','+faststart','-shortest',film],
  {stdinFrames:frames(),timeoutMs:180000});
 const probe=await inspectEpisode(film);
 if(probe.codec!=='h264'||probe.audioCodec!=='aac'||probe.frames!==seconds*fps||
  probe.width!==320||probe.height!==180||
  Math.abs(probe.durationSec-seconds)>.18)throw Error('ORIGINAL_FILM_QA_FAILED');
 const receipt={schema:'jem_originals_proof_v1',
  episodeId:manifest.episodeId,
  manifestSha256:manifest.manifestSha256,
  filmSha256:sha(readFileSync(film)),
  durationSec:probe.durationSec,frames:probe.frames,
  videoCodec:probe.codec,audioCodec:probe.audioCodec,
  originalScore:sound,sceneCount:manifest.acts.length,
  protagonistId:manifest.characterBible.protagonist.id,
  companionId:manifest.characterBible.companion.id,
  actualAnimatedMotion:'PROCEDURAL_2D_POSE_AND_LIMB_ANIMATION',
  generatedVoices:'NOT_IMPLEMENTED',generativeModel:'NOT_USED',
  humanCreativeReview:'REQUIRED',distribution:'DENIED_UNTIL_OWNER_APPROVAL'};
 writeFileSync(join(folder,'proof-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
 return {folder,film,manifest,receipt};
}
