import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createPwaPreviewServer} from '../src/pwa-server.mjs';
import {createPortableStoryboard,planStoryCore,validatePortableImage,portableSha256} from '../pwa/portable-storyboard.mjs';
import {makeStoryboard} from '../src/storyboard.mjs';
const here=new URL('../pwa/',import.meta.url);
const file=n=>readFileSync(new URL(n,here),'utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
const img=new Uint8Array(Buffer.concat([
 Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(90)]));
const prompt='A brave girl explores a magical forest, meets a friendly robot and returns home.';
const ref={format:'png',sha256:sha(img)};
test('portable photo signature and digest reproducibly match Node digest',async()=>{
 assert.equal(validatePortableImage(img),'png');
 assert.equal(await portableSha256(img),ref.sha256);
 assert.throws(()=>validatePortableImage(new Uint8Array(55)),/FORMAT_DENIED/);
});
test('iPhone/Android/desktop portable storyboard matches Node scene timeline',async()=>{
 const mobile=await createPortableStoryboard({prompt,imageBytes:img,durationSec:60});
 const desktop=makeStoryboard({prompt,reference:ref,durationSec:60});
 assert.deepEqual(mobile,desktop);
 assert.equal(mobile.scenes.length,6);
 assert.equal(mobile.scenes.reduce((n,x)=>n+x.frames,0),720);
 assert(mobile.scenes.every(x=>x.characterRefSha256===ref.sha256));
});
test('multiple playback durations always preserve frame accounting offline',async()=>{
 for(const length of [2,4,10,30,60]){
  const p=planStoryCore({prompt,reference:ref,durationSec:length,fps:12});
  assert.equal(p.scenes.reduce((n,x)=>n+x.frames,0),length*12);
 }
});
test('malicious or altered prompt and identity reference denied on device',()=>{
 assert.throws(()=>planStoryCore({prompt:'bad',reference:ref}),/PROMPT_INVALID/);
 assert.throws(()=>planStoryCore({prompt,reference:{format:'png',sha256:'x'.repeat(64)}}),/REFERENCE_NOT_LOCKED/);
 assert.throws(()=>planStoryCore({prompt,reference:ref,width:4096}),/RESOLUTION_NOT_SUPPORTED/);
});
test('PWA manifest is installable-protocol shaped and scoped only to its own subdirectory',()=>{
 const manifest=JSON.parse(file('manifest.webmanifest'));
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'./');
 assert.equal(manifest.scope,'./');
 assert.equal(manifest.theme_color,'#0a0d1b');
 assert(manifest.icons.some(i=>i.type==='image/svg+xml'));
});
test('responsive iPhone iPad Android and desktop declarations actually exist',()=>{
 const html=file('index.html');
 assert(html.includes('viewport-fit=cover'));
 assert(html.includes('max-width:790px'));
 assert(html.includes('max-width:480px'));
 assert(html.includes('safe-area-inset-bottom'));
 assert(html.includes('image/jpeg,image/png'));
 assert(html.includes('manifest.webmanifest'));
 assert(html.includes('Standalone')===false);
});
test('PWA keeps photo hashing client-side without upload or external network APIs',()=>{
 const client=file('app.mjs'),service=file('sw.js');
 assert(client.includes('file.arrayBuffer()'));
 assert(client.includes('createPortableStoryboard('));
 assert(!client.includes('fetch('));
 assert(!client.includes('XMLHttpRequest'));
 assert(service.includes("req.method!=='GET'"));
 assert(!service.includes('api/render'));
 assert(!service.includes('imageBase64'));
});
test('paid flagship pricing is a proposal; transactions and payment issuer not connected',()=>{
 const prices=JSON.parse(readFileSync(new URL('../commerce/pricing.proposal.json',import.meta.url),'utf8'));
 assert.equal(prices.paymentCollection,'DISABLED');
 assert.equal(prices.launchStatus,'NOT_FOR_SALE');
 assert(prices.pricing.some(p=>p.plan==='SIGNATURE'&&p.proposedMonthlyUsd===999&&p.status==='DRAFT_UNAVAILABLE'));
 assert(prices.pricing.every(p=>p.status==='DRAFT_UNAVAILABLE'));
});
test('local PWA preview serves portable app but never accepts uploads or network requests',async()=>{
 const server=createPwaPreviewServer();
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const origin='http://127.0.0.1:'+server.address().port;
 try{
  for(const [path,mime] of [['/','text/html'],['/app.mjs','text/javascript'],
   ['/portable-storyboard.mjs','text/javascript'],['/manifest.webmanifest','application/manifest+json'],
   ['/sw.js','text/javascript'],['/icon.svg','image/svg+xml']]){
   const r=await fetch(origin+path);
   assert.equal(r.status,200,path);
   assert(r.headers.get('content-type').includes(mime),path);
   assert((await r.text()).length>10);
  }
  let r=await fetch(origin+'/api/render',{method:'POST',body:'hi'});
  assert.equal(r.status,405);
  r=await fetch(origin+'/../../etc/passwd');
  assert.equal(r.status,404);
  r=await fetch(origin+'/nonexistent.css');
  assert.equal(r.status,404);
  r=await fetch(origin+'/');
  assert.equal(r.headers.get('cache-control'),'no-store');
  assert(r.headers.get('content-security-policy').includes("connect-src 'none'"));
 }finally{await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()))}
});
