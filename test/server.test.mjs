import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import {makeApp} from '../src/server.mjs';
test('localhost studio serves its real UI and blocks remote-host authority',async()=>{
 const app=makeApp();const {server}=app;
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const port=server.address().port,base='http://127.0.0.1:'+port;
 try{
  let r=await fetch(base+'/');assert.equal(r.status,200);
  assert((await r.text()).includes('Jem'));
  assert(r.headers.get('content-security-policy')?.includes("script-src 'self'"));
  r=await fetch(base+'/app.js');assert.equal(r.status,200);
  assert((await r.text()).includes('api/render'));
  r=await fetch(base+'/api/status');const status=await r.json();
  assert.equal(status.busy,false);assert.equal(status.production,'NOT_DEPLOYED');
  r=await fetch(base+'/api/film');assert.equal(r.status,404);
  r=await fetch(base+'/api/render',{method:'POST',
   headers:{'Content-Type':'text/plain'},body:'hello'});
  assert.equal(r.status,415);
  r=await fetch(base+'/api/render',{method:'POST',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'unsafe'})});
  assert.equal(r.status,400);
  const rejected=await new Promise((resolve,reject)=>{
   const x=http.get(base+'/api/status',{headers:{Host:'evil.example'}},r=>{
    r.resume();r.on('end',()=>resolve(r.statusCode));
   });x.on('error',reject);
  });
  assert.equal(rejected,403);
 }finally{app.close()}
});
