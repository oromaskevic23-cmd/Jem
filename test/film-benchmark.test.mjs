import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const benchmark=JSON.parse(readFileSync(new URL('../benchmarks/film-benchmark-v1.json',import.meta.url),'utf8'));
test('20 cases are unique, six-act story briefs with no leaked customer photos',()=>{
 assert.equal(benchmark.schema,'jem_film_benchmark_v1');
 assert.equal(benchmark.status,'NOT_BENCHMARKED');
 assert.equal(benchmark.cases.length,20);
 assert.equal(new Set(benchmark.cases.map(x=>x.id)).size,20);
 assert(benchmark.cases.every(x=>x.sceneCount===6&&x.durationSec===60));
 assert(benchmark.cases.every(x=>x.referenceImageHashes.length===0));
 assert(benchmark.cases.every(x=>x.jemEvidence.length===0&&x.competitorEvidence.length===0));
 assert.equal(benchmark.actualReferenceAssets,0);
 assert.equal(benchmark.actualModelRuns,0);
});
test('independent metric rubric sums to 100 and bars claims before actual comparison',()=>{
 assert.equal(Object.values(benchmark.scoringWeights).reduce((a,b)=>a+b,0),100);
 assert.equal(benchmark.minimumIdentityPassRate,0.95);
 assert.equal(benchmark.humanReviewersRequired,3);
 assert.equal(benchmark.publishedClaims,'DENIED');
 assert(benchmark.cases.every(x=>x.status==='NOT_BENCHMARKED'&&x.metrics===null));
});
