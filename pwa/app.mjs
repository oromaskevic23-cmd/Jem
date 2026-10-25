import {createPortableStoryboard} from './portable-storyboard.mjs';

const $=id=>document.getElementById(id);
let latest=null,imageUrl=null,installPrompt=null;

function status(message){$('status').textContent=message}
function newSceneCard(scene){
 const li=document.createElement('li');
 const title=document.createElement('strong');
 title.textContent=scene.id+' · '+scene.stage.replaceAll('_',' ');
 const text=document.createElement('span');
 text.textContent=scene.text;
 const stats=document.createElement('span');
 stats.textContent=scene.durationSec.toFixed(2)+' seconds · '+scene.frames+' frames · '+scene.motion.replaceAll('_',' ');
 li.append(title,text,stats);
 return li;
}
$('photo').addEventListener('change',()=>{
 const file=$('photo').files?.[0],image=$('photo-preview');
 if(imageUrl){URL.revokeObjectURL(imageUrl);imageUrl=null}
 image.hidden=true;
 if(!file)return;
 if(file.size>12*1024*1024||file.size<32){status('Invalid photo size: choose JPG/PNG under 12 MB.');return}
 imageUrl=URL.createObjectURL(file);
 image.src=imageUrl;
 image.hidden=false;
});
$('make-story').addEventListener('submit',async e=>{
 e.preventDefault();
 latest=null;$('results').hidden=true;
 const file=$('photo').files?.[0];
 if(!file){status('Please select an authorized JPG or PNG photo.');return}
 const button=$('plan');button.disabled=true;
 try{
  status('Preparing scenes on this device; photo is not uploaded.');
  const imageBytes=new Uint8Array(await file.arrayBuffer());
  latest=await createPortableStoryboard({
   prompt:$('prompt').value.trim(),imageBytes,
   durationSec:Number($('duration').value),fps:12,width:640,height:360
  });
  const list=$('scene-list');list.replaceChildren(...latest.scenes.map(newSceneCard));
  $('scene-heading').textContent='Scene plan · '+latest.scenes.length+' shots';
  $('integrity').textContent='Photo SHA-256: '+latest.reference.sha256+
   ' · Storyboard SHA-256: '+latest.storyboardSha256+
   ' · '+latest.scenes.reduce((n,s)=>n+s.frames,0)+' scheduled frames. Video motion NOT generated.';
  $('results').hidden=false;
  status('Storyboard verified on-device. Export the JSON for desktop rendering; this mobile PWA does NOT create MP4 video yet.');
 }catch(error){
  status('Storyboard not created: '+(error?.message||'INVALID_INPUT'));
 }finally{button.disabled=false}
});
$('export').addEventListener('click',()=>{
 if(!latest)return;
 const blob=new Blob([JSON.stringify(latest,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='jem-storyboard.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),5000);
});
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();installPrompt=event;$('install').style.display='inline-flex';
});
$('install').addEventListener('click',async()=>{
 if(!installPrompt){status('Install using your browser menu. On iPhone/iPad Safari choose Share → Add to Home Screen.');return}
 const p=installPrompt;installPrompt=null;
 await p.prompt();
 $('install').style.display='none';
});
if('serviceWorker' in navigator&&isSecureContext){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'})
  .catch(()=>status('Online preview available; offline installation was not available in this browser.')));
}
