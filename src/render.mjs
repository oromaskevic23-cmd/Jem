/**
 * Jem🌼 local cinematic motion compositor.
 * Offline/no AI inference: creates real MP4 camera-motion video, not articulated character motion.
 * Executable input is never built from prompt or other user text.
 */
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {inspectImage,makeStoryboard} from './storyboard.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
function run(binary,args,{timeoutMs=180000}={}){
 return new Promise((resolveResult,reject)=>{
  const child=spawn(binary,args,{shell:false,stdio:['ignore','pipe','pipe'],windowsHide:true});
  let output='',err='',settled=false;
  const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);
  child.stdout.on('data',b=>{if(output.length<30000)output+=b.toString()});
  child.stderr.on('data',b=>{if(err.length<15000)err+=b.toString()});
  child.on('error',e=>{clearTimeout(timer);if(!settled){settled=true;reject(e)}});
  child.on('close',code=>{
   clearTimeout(timer);
   if(settled)return;settled=true;
   if(code!==0)return reject(Error('MEDIA_PROCESS_FAILED: '+binary+' exit '+code+' '+err.slice(-1300)));
   resolveResult(output);
  });
 });
}
export async function probeVideo(file){
 const raw=await run('ffprobe',['-v','error','-select_streams','v:0',
  '-show_entries','stream=width,height,codec_name,nb_frames,avg_frame_rate:format=duration',
  '-of','json',file],{timeoutMs:10000});
 const obj=JSON.parse(raw);
 const s=obj.streams?.[0],duration=Number(obj.format?.duration);
 if(!s||!Number.isFinite(duration))throw Error('OUTPUT_VIDEO_INVALID');
 return {width:s.width,height:s.height,codec:s.codec_name,frames:Number(s.nb_frames),
  fps:s.avg_frame_rate,durationSec:duration};
}
async function probeImage(file){
 const raw=await run('ffprobe',['-v','error','-select_streams','v:0',
  '-show_entries','stream=width,height','-of','json',file],{timeoutMs:10000});
 const s=JSON.parse(raw).streams?.[0];
 if(!Number.isInteger(s?.width)||!Number.isInteger(s?.height)||
  s.width<32||s.height<32||s.width>4096||s.height>4096||
  s.width*s.height>16000000)throw Error('IMAGE_DIMENSION_DENIED');
 return s;
}
function motionFilter(scene,storyboard){
 const {width,height,fps}=storyboard;
 const n=Math.max(1,scene.frames-1);
 let z,x,y="'(ih-ih/zoom)/2'";
 switch(scene.motion){
  case 'pan_left':
   z="'1.12'";x="'(iw-iw/zoom)*(1-on/"+n+")'";break;
  case 'pan_right':
   z="'1.12'";x="'(iw-iw/zoom)*on/"+n+"'";break;
  case 'gentle_pull_back':
   z="'max(1.02,1.14-0.12*on/"+n+")'";x="'(iw-iw/zoom)/2'";break;
  default:
   z="'min(1.14,1.02+0.12*on/"+n+")'";x="'(iw-iw/zoom)/2'";
 }
 const fade=Math.min(0.22,scene.durationSec/8);
 return [
  'scale='+width+':'+height+':force_original_aspect_ratio=increase',
  'crop='+width+':'+height,
  'zoompan=z='+z+':x='+x+':y='+y+':d=1:s='+width+'x'+height+':fps='+fps,
  'format=yuv420p',
  'fade=t=in:st=0:d='+fade.toFixed(3),
  'fade=t=out:st='+(scene.durationSec-fade).toFixed(3)+':d='+fade.toFixed(3)
 ].join(',');
}
/** ffmpeg and ffprobe must be installed on the local operator computer.
 * Returned MP4 does not contain AI-animated gestures, voices or speech.
 */
export async function renderFilm({prompt,photoPath,outputRoot,durationSec=60,
 fps=12,width=640,height=360}={}){
 if(typeof outputRoot!=='string'||!outputRoot.trim())throw Error('OUTPUT_ROOT_REQUIRED');
 const image=inspectImage(photoPath);
 const story=makeStoryboard({prompt,reference:image,durationSec,fps,width,height});
 await probeImage(photoPath);
 const root=resolve(outputRoot);
 mkdirSync(root,{recursive:true,mode:0o700});
 const project=mkdtempSync(join(root,'jem-lab-'));
 const clips=[];
 for(const scene of story.scenes){
  const file='shot_'+scene.id+'.mp4';
  const args=['-hide_banner','-loglevel','error','-nostdin','-y',
   '-loop','1','-framerate',String(fps),'-i',resolve(photoPath),
   '-vf',motionFilter(scene,story),'-frames:v',String(scene.frames),
   '-an','-c:v','libx264','-preset','ultrafast','-crf','27',
   '-pix_fmt','yuv420p','-r',String(fps),join(project,file)];
  await run('ffmpeg',args,{timeoutMs:180000});
  clips.push(file);
 }
 writeFileSync(join(project,'concat.txt'),clips.map(f=>"file '"+f+"'").join('\n')+'\n');
 const mp4=join(project,'film.mp4');
 await run('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y',
  '-f','concat','-safe','1','-i',join(project,'concat.txt'),
  '-c','copy','-movflags','+faststart',mp4],{timeoutMs:60000});
 const probe=await probeVideo(mp4);
 if(probe.codec!=='h264'||probe.width!==width||probe.height!==height||
  Math.abs(probe.durationSec-durationSec)>Math.max(0.15,2/fps)||
  probe.frames!==durationSec*fps)
  throw Error('FILM_QA_FAILED');
 const filmSha256=sha(readFileSync(mp4));
 const report={schema:'jem_render_receipt_v1',renderer:'FFMPEG_OFFLINE_CAMERA_MOTION',
  storyboardSha256:story.storyboardSha256,referenceSha256:image.sha256,
  filmSha256,frames:probe.frames,durationSec:probe.durationSec,
  width:probe.width,height:probe.height,codec:probe.codec,fps,scenes:story.scenes.length,
  verified:'FFPROBE_DURATION_FRAMES_RESOLUTION_AND_SHA256',
  animation:'CAMERA_MOVEMENT_ONLY',characterArticulation:'NOT_AVAILABLE',
  modelInference:'NOT_PERFORMED',audio:'NOT_GENERATED',
  productionRelease:'NOT_APPROVED'};
 writeFileSync(join(project,'storyboard.json'),JSON.stringify(story,null,2)+'\n');
 writeFileSync(join(project,'render-report.json'),JSON.stringify(report,null,2)+'\n');
 return {directory:project,video:mp4,storyboard:story,report};
}
