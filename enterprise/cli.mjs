/** Explicit local-only Enterprise media evidence CLI, never a publisher. */
import {writeFileSync} from 'node:fs';
import {attestLocalCameraFilm} from './attest-film.mjs';
const argv=process.argv.slice(2);
const names=['--render-directory','--rights-file','--project-id','--tenant-id','--output'];
try {
 if(argv.length!==names.length*2||!names.every((n,i)=>argv[2*i]===n)
  ||argv.some(x=>typeof x!=='string'||x.length<2))
  throw Error('EXACT_FIVE_ARGUMENTS_REQUIRED');
 const result=await attestLocalCameraFilm({renderDirectory:argv[1],
  rightsFile:argv[3],projectId:argv[5],tenantId:argv[7]});
 // Existing paths are never overwritten; permissions limited to operator.
 writeFileSync(argv[9],JSON.stringify(result,null,2)+'\n',{encoding:'utf8',
  flag:'wx',mode:0o600});
 console.log(JSON.stringify({stage:'LOCAL_EVIDENCE_RECORDED',
  dossierSha256:result.dossier.dossierSha256,
  productionAuthorized:false,publishAuthorized:false,independentVisualQAVerified:false}));
}catch {
 console.error('JEM_ENTERPRISE_ATTESTATION_FAILED_DENY_BY_DEFAULT');
 process.exitCode=1;
}
