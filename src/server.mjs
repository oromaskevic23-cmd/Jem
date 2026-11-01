/** Local-only Jem🌼 studio. No public upload API, external calls or job auto-deployment. */
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,createReadStream,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {renderFilm} from './render.mjs';
import {validateImageBytes} from './storyboard.mjs';

const MAX_BODY=17*1024*1024;
const BASE='http://127.0.0.1';
const assetDir=dirname(fileURLToPath(import.meta.url));
const page=readFileSync(join(assetDir,'ui.html'),'utf8');
const uiScript=readFileSync(join(assetDir,'ui.js'),'utf8');
function reply(res,code,obj){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(JSON.stringify(obj));}
function acceptBody(req){
 return new Promise((ok,fail)=>{
  let bytes=0,parts=[],blocked=false;
  req.on('data',b=>{bytes+=b.length;if(bytes>MAX_BODY){blocked=true;parts=[];req.destroy();return}parts.push(b)});
  req.on('end',()=>blocked?fail(Error('UPLOAD_TOO_LARGE')):ok(Buffer.concat(parts)));
  req.on('error',fail);
 });
}
function exact(x,keys){return x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.getPrototypeOf(x)===Object.prototype&&Object.keys(x).length===keys.length&&
 keys.every(k=>Object.hasOwn(x,k))}
export function makeApp(){
 let current=null,busy=false,working=null;
 const server=http.createServer(async(req,res)=>{
  const host=req.headers.host||'';
  if(!/^127\.0\.0\.1(:[0-9]+)?$/.test(host)&&!/^localhost(:[0-9]+)?$/.test(host))
   return reply(res,403,{error:'LOCAL_HOST_ONLY'});
  const pathname=new URL(req.url,BASE).pathname;
  if(req.method==='GET'&&pathname==='/'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
   return res.end(page);
  }
  if(req.method==='GET'&&pathname==='/app.js'){
   res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   return res.end(uiScript);
  }
  if(req.method==='GET'&&pathname==='/api/status'){
   return reply(res,200,{schema:'jem_lab_status_v1',mode:'OFFLINE_CAMERA_MOTION',busy,
    available:!!current,render:current?current.report:null,
    production:'NOT_DEPLOYED'});
  }
  if(req.method==='GET'&&pathname==='/api/film'){
   if(!current)return reply(res,404,{error:'NO_FILM_YET'});
   const file=current.video,size=statSync(file).size;
   res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':size,
    'Content-Disposition':'attachment; filename="jem-film.mp4"',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   return createReadStream(file).pipe(res);
  }
  if(req.method==='POST'&&pathname==='/api/render'){
   if(busy)return reply(res,409,{error:'RENDER_IN_PROGRESS'});
   if(req.headers['content-type']!=='application/json')
    return reply(res,415,{error:'JSON_ONLY'});
   if(Number(req.headers['content-length']||0)>MAX_BODY)
    return reply(res,413,{error:'UPLOAD_TOO_LARGE'});
   busy=true;
   let folder=null;
   try{
    const body=JSON.parse((await acceptBody(req)).toString('utf8'));
    if(!exact(body,['prompt','imageBase64','durationSec']))
     throw Error('REQUEST_SCHEMA_DENIED');
    if(typeof body.imageBase64!=='string'||body.imageBase64.length>16*1024*1024||
     !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.imageBase64))
     throw Error('IMAGE_ENCODING_DENIED');
    const bytes=Buffer.from(body.imageBase64,'base64');
    if(bytes.toString('base64')!==body.imageBase64)throw Error('IMAGE_ENCODING_DENIED');
    const image=validateImageBytes(bytes);
    folder=mkdtempSync(join(tmpdir(),'jem-studio-'));
    const photoPath=join(folder,'reference.'+(image.format==='png'?'png':'jpg'));
    writeFileSync(photoPath,bytes,{mode:0o600});
    const film=await renderFilm({prompt:body.prompt,photoPath,outputRoot:folder,
     durationSec:body.durationSec});
    if(working)rmSync(working,{recursive:true,force:true});
    working=folder;folder=null;
    current=film;
    return reply(res,200,{status:'DONE',report:film.report,downloadUrl:'/api/film'});
   }catch(e){
    if(!res.headersSent&&!res.destroyed)
     return reply(res,400,{status:'FAILED',error:/^(PROMPT_|DURATION_|REFERENCE_|IMAGE_|REQUEST_)/.test(e.message)?e.message:'RENDER_FAILED'});
   }finally{busy=false;if(folder)rmSync(folder,{recursive:true,force:true})}
  }
  return reply(res,404,{error:'NOT_FOUND'});
 });
 return {server,close:()=>{server.close();if(working)rmSync(working,{recursive:true,force:true})}};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const {server}=makeApp();
 const port=Number(process.env.JEM_PORT||8765);
 if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('PORT_DENIED');
 server.listen(port,'127.0.0.1',()=>{
  process.stdout.write('Jem🌼 local studio available at http://127.0.0.1:'+port+'\n');
 });
}
