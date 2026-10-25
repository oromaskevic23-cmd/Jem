import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertCompetitiveMatrix} from '../benchmarks/validate.mjs';
const data=JSON.parse(readFileSync(new URL('../benchmarks/competitors-2026-10-26.json',import.meta.url),'utf8'));
const fresh=()=>structuredClone(data);
test('source-backed, versioned competitor matrix passes schema without claiming leadership',()=>{
 const result=assertCompetitiveMatrix(data);
 assert(result.competitors>=10);
 assert(result.qualityGates>=10);
 assert.equal(result.superiorityClaim,'NOT_PROVEN');
 assert.equal(result.commercialLaunch,'DENIED');
});
test('Kling 4 rollout and independent quality leaders must be in scope',()=>{
 const ids=new Set(data.competitors.map(x=>x.id));
 for(const key of ['kling-40','kling-30','minimax-h3','wan-30','seedance-25','ltx-studio','invideo'])
  assert(ids.has(key));
 const kling4=data.competitors.find(x=>x.id==='kling-40');
 assert.equal(kling4.singleClipSecondsMax,30);
 assert(kling4.priceNote.includes('limited')||kling4.priceNote.includes('early'));
});
test('a $999 Jem plan is NOT declared higher than every enterprise and Elite service',()=>{
 assert(data.pricingWarning.includes('$1000'));
 assert(data.competitors.some(x=>x.id==='invideo'&&x.priceUsdPerMonthExample===1000));
 assert.equal(data.jemVerifiedAtPR4.status,'OPEN_DRAFT_NOT_RELEASED');
 assert(data.jemVerifiedAtPR4.notCapabilities.includes('published paid service'));
});
test('retired Sora cannot be presented as an active API/provider',()=>{
 assert.equal(data.competitors.find(x=>x.id==='sora-retired').mobileApp,'DISCONTINUED');
 const fake=fresh();fake.competitors.find(x=>x.id==='sora-retired').mobileApp='ACTIVE';
 assert.throws(()=>assertCompetitiveMatrix(fake),/RETIRED_DEPENDENCY_INVALID/);
});
test('a fake unsupported product claim or missing sources fails evidence validation',()=>{
 for(const mutation of [
   x=>x.competitors.push({...x.competitors[0]}),
   x=>x.competitors[0].source=[],
   x=>x.competitors[0].source=['http://localhost/tamper'],
   x=>x.competitors[0].priceUsdPerMonthExample=-100,
   x=>x.gates[0].criterion='win',
   x=>x.jemVerifiedAtPR4.status='SHIPPED',
   x=>x.pricingWarning='Everyone else is cheaper'
 ]){
  const d=fresh();mutation(d);
  assert.throws(()=>assertCompetitiveMatrix(d));
 }
});
