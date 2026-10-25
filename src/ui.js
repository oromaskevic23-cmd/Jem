const form=document.querySelector('#render-form');
const button=document.querySelector('#create');
const status=document.querySelector('#status');
const result=document.querySelector('#result');
const video=document.querySelector('#preview');
const report=document.querySelector('#report');
form.addEventListener('submit',async event=>{
 event.preventDefault();
 const photo=document.querySelector('#photo').files?.[0];
 const prompt=document.querySelector('#prompt').value.trim();
 const durationSec=Number(document.querySelector('#duration').value);
 if(!photo||photo.size<32||photo.size>12*1024*1024){
  status.textContent='Please choose a JPG or PNG image smaller than 12 MB.';return;
 }
 if(prompt.length<12||prompt.length>1000){status.textContent='Please enter a story of 12–1000 characters.';return}
 button.disabled=true;result.hidden=true;
 status.textContent='Rendering your cinematic motion film locally. The browser will remain on this page during rendering.';
 try{
  const imageBase64=await new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onerror=()=>reject(Error('PHOTO_READ_FAILED'));
   reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');
   reader.readAsDataURL(photo);
  });
  const response=await fetch('/api/render',{method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({prompt,imageBase64,durationSec})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'RENDER_FAILED');
  status.textContent='MP4 created and verified. You can preview or download it below.';
  video.src='/api/film?version='+Date.now();
  report.textContent=data.report.frames+' frames · '+data.report.durationSec+
   ' seconds · '+data.report.width+'×'+data.report.height+
   ' · original photo SHA-256 bound to all scenes · no AI gestures or voice.';
  result.hidden=false;
 }catch(e){status.textContent='Render failed: '+e.message}
 finally{button.disabled=false}
});
