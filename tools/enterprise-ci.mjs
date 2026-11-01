/** Offline CI test runner: syntax + all non-integration unit tests, no external calls. */
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
function enumerate(dir){
 return readdirSync(dir,{withFileTypes:true}).flatMap(e=>
  e.isDirectory()?enumerate(join(dir,e.name)):
  e.isFile()&&e.name.endsWith('.mjs')?[join(dir,e.name)]:[]);
}
const dirs=['src','video','factory','originals','voice','enterprise','tools','pwa'];
const source=dirs.flatMap(enumerate);
for(const name of source){
 const check=spawnSync(process.execPath,['--check',name],{timeout:10000,stdio:'inherit'});
 if(check.status!==0)throw Error('SYNTAX_FAILED:'+name);
}
const tests=readdirSync('test').filter(x=>x.endsWith('.test.mjs')&&!x.endsWith('.integration.test.mjs'))
 .map(x=>join('test',x)).sort();
if(tests.length<18)throw Error('TEST_COVERAGE_SHRUNK');
const result=spawnSync(process.execPath,['--experimental-sqlite','--test',...tests],
 {timeout:240000,stdio:'inherit'});
if(result.status!==0)throw Error('JEM_ENTERPRISE_UNIT_TEST_FAILURE');
console.log('JEM_ENTERPRISE_SOURCE_PASS',JSON.stringify({sourceFiles:source.length,
 unitSuites:tests.length,actualModelInference:false,
 productionAuthorized:false}));
