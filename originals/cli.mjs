#!/usr/bin/env node
import {renderOriginals} from './render.mjs';
const args=process.argv.slice(2);
if(args.length!==2&&args.length!==4){
 console.error('Usage: node originals/cli.mjs --output ./films [--seconds 60]');
 process.exit(2);
}
const values=Object.fromEntries(Array.from({length:args.length/2},(_,i)=>[args[i*2],args[i*2+1]]));
if(!values['--output']||Object.keys(values).some(k=>!['--output','--seconds'].includes(k))||
 (values['--seconds']!==undefined&&!/^(6|12|18|24|30|36|42|48|54|60)$/.test(values['--seconds']))){
 console.error('Invalid output or duration.');process.exit(2);
}
try{
 const result=await renderOriginals({outputRoot:values['--output'],seconds:Number(values['--seconds']||60)});
 process.stdout.write(JSON.stringify({film:result.film,receipt:result.receipt},null,2)+'\n');
}catch(e){console.error('JEM_ORIGINALS_RENDER_FAILED:',e.message);process.exitCode=1}
