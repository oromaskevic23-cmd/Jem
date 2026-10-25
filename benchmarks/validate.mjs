/** Check the competitive evidence dataset; never infer model superiority from a vendor claim. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const path=fileURLToPath(new URL('./competitors-2026-10-26.json',import.meta.url));
export function assertCompetitiveMatrix(doc){
 if(doc?.schema!=='jem_competitive_intelligence_v1'||doc.checkedAt!=='2026-10-26'||
  typeof doc.evidencePolicy!=='string'||!doc.evidencePolicy.includes('not independently benchmarked')||
  !Array.isArray(doc.competitors)||doc.competitors.length<10||
  !Array.isArray(doc.gates)||doc.gates.length<10)
  throw Error('COMPETITION_MATRIX_SCHEMA_DENIED');
 const ids=new Set();
 for(const c of doc.competitors){
  if(!c||typeof c.id!=='string'||ids.has(c.id)||typeof c.company!=='string'||
   typeof c.product!=='string'||typeof c.risk!=='string'||c.risk.length<25||
   !Array.isArray(c.source)||!c.source.length||
   c.source.some(url=>typeof url!=='string'||!url.startsWith('https://')||
    /localhost|127\.0\.0\.1|[ <>\n]/.test(url))||
   c.priceUsdPerMonthExample!==null&&
    (!Number.isFinite(c.priceUsdPerMonthExample)||c.priceUsdPerMonthExample<0))
   throw Error('COMPETITOR_EVIDENCE_DENIED');
  if(c.category==='historical_not_current'&&c.mobileApp!=='DISCONTINUED')
   throw Error('RETIRED_DEPENDENCY_INVALID');
  ids.add(c.id);
 }
 if(!ids.has('kling-40')||!ids.has('sora-retired')||
  !ids.has('ltx-studio')||!ids.has('invideo')||!ids.has('minimax-h3'))
  throw Error('CURRENT_THREAT_COVERAGE_INCOMPLETE');
 const gates=new Set();
 for(const g of doc.gates){
  if(typeof g.id!=='string'||gates.has(g.id)||g.critical!==true&&g.critical!==false||
   typeof g.criterion!=='string'||g.criterion.length<60)
   throw Error('BENCHMARK_GATE_INVALID');
  gates.add(g.id);
 }
 if(doc.jemVerifiedAtPR4?.status!=='OPEN_DRAFT_NOT_RELEASED'||
  !doc.jemVerifiedAtPR4.notCapabilities.includes('real image-to-video model connected')||
  !doc.pricingWarning.includes('$1000')||
  !doc.referenceBenchmarks.notComparable.includes('not full animated-film'))
  throw Error('INVALID_SUCCESS_OR_PRICE_CLAIM');
 return {competitors:ids.size,qualityGates:gates.size,checkedAt:doc.checkedAt,
  superiorityClaim:'NOT_PROVEN',commercialLaunch:'DENIED'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{
  const result=assertCompetitiveMatrix(JSON.parse(readFileSync(path,'utf8')));
  process.stdout.write(JSON.stringify(result)+'\n');
 }catch(error){console.error(error.message);process.exitCode=1}
}
