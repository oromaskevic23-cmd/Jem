/* Jem🌼 offline static-shell cache. NEVER caches user photos, JSON plans, video or API requests. */
const CACHE='jem-shell-v2-20261025';
const STATIC=['./','./index.html','./app.mjs','./portable-storyboard.mjs',
 './manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x.startsWith('jem-shell-')&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||req.mode==='navigate'&&new URL(req.url).pathname!==new URL('./',self.registration.scope).pathname&&
  new URL(req.url).pathname!==new URL('./index.html',self.registration.scope).pathname)return;
 const url=new URL(req.url),root=new URL(self.registration.scope);
 if(url.origin!==root.origin)return;
 const paths=STATIC.map(file=>new URL(file,root).pathname);
 if(!paths.includes(url.pathname)||url.search)return;
 event.respondWith(caches.match(req,{ignoreSearch:false}).then(cached=>
  cached||fetch(req).then(response=>{
   if(response.ok&&response.type==='basic'){
    const cloned=response.clone();caches.open(CACHE).then(cache=>cache.put(req,cloned));
   }
   return response;
  })));
});
