/** Jem🌼 static offline cross-platform PWA preview (localhost only). */
import http from 'node:http';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..','pwa');
const types=new Map([
 ['/', ['index.html','text/html; charset=utf-8']],
 ['/index.html',['index.html','text/html; charset=utf-8']],
 ['/app.mjs',['app.mjs','text/javascript; charset=utf-8']],
 ['/portable-storyboard.mjs',['portable-storyboard.mjs','text/javascript; charset=utf-8']],
 ['/sw.js',['sw.js','text/javascript; charset=utf-8']],
 ['/icon.svg',['icon.svg','image/svg+xml']],\n ['/icon-192.png',['icon-192.png','image/png']],\n ['/icon-512.png',['icon-512.png','image/png']],
 ['/manifest.webmanifest',['manifest.webmanifest','application/manifest+json']]
]);
const content=Object.fromEntries([...types].map(([url,[file,type]])=>[url,{
 bytes:readFileSync(join(root,file)),type
}]));
const security={
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'Cache-Control':'no-store',
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};
export function createPwaPreviewServer(){
 return http.createServer((req,res)=>{
  const host=req.headers.host||'';
  if(!/^localhost(:[0-9]+)?$/.test(host)&&!/^127\.0\.0\.1(:[0-9]+)?$/.test(host)){
   res.writeHead(403,{...security,'Content-Type':'text/plain'});return res.end('LOCAL_HOST_ONLY');
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){
   res.writeHead(405,{...security,'Allow':'GET, HEAD'});return res.end();
  }
  let path;
  try{path=new URL(req.url,'http://localhost').pathname}catch{res.writeHead(400,security);return res.end()}
  const asset=content[path];
  if(!asset){res.writeHead(404,security);return res.end()}
  res.writeHead(200,{...security,'Content-Type':asset.type,'Content-Length':asset.bytes.byteLength});
  return req.method==='HEAD'?res.end():res.end(asset.bytes);
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const server=createPwaPreviewServer();
 const port=Number(process.env.JEM_PWA_PORT||8766);
 if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('PWA_PORT_DENIED');
 server.listen(port,'127.0.0.1',()=>{
  process.stdout.write('Jem🌼 cross-platform preview: http://127.0.0.1:'+port+'\n');
 });
}
