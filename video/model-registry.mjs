/** Documented model CANDIDATES; no weights installed or paid APIs configured. */
export const VIDEO_MODEL_CANDIDATES=Object.freeze([
 {id:'ltx-video-2b-distilled',repository:'https://github.com/Lightricks/LTX-Video',
  weights:'ltxv-2b-0.9.8-distilled',
  licensing:'MODEL_SPECIFIC_LICENSE_REVIEW_REQUIRED',
  deployment:'LOCAL_ONLY_OPTIONAL',imageToVideo:true,
  capacity:'MEASURED_LOCAL_HARDWARE_CHECK_REQUIRED',weightsSha256:null,status:'RESEARCH_ONLY'},
 {id:'wan2.1-i2v-14b',repository:'https://github.com/Wan-Video/Wan2.1',
  weights:'Wan2.1-I2V-14B',
  licensing:'CHECKPOINT_SPECIFIC_LICENSE_REVIEW_REQUIRED',
  deployment:'LOCAL_ONLY_OPTIONAL',imageToVideo:true,
  capacity:'LIKELY_EXCEEDS_8_GB_VRAM',weightsSha256:null,status:'RESEARCH_ONLY'},
 {id:'ltx-2',repository:'https://github.com/Lightricks/LTX-2',
  weights:'LTX-2',
  licensing:'CHECKPOINT_SPECIFIC_LICENSE_REVIEW_REQUIRED',
  deployment:'LOCAL_ONLY_OPTIONAL',imageToVideo:true,
  capacity:'LTX_DESKTOP_RECOMMENDS_24_GB_OR_MORE',weightsSha256:null,status:'RESEARCH_ONLY'}
]);
export function verifyRuntimeModel(manifest){
 const ks=['id','weightsSha256','licenseReviewed','commercialUseReviewed',
  'localOnly','runtimeOperatorApproved'];
 if(!manifest||typeof manifest!=='object'||Object.keys(manifest).sort().join('|')!==ks.sort().join('|')||
  !VIDEO_MODEL_CANDIDATES.some(m=>m.id===manifest.id)||
  !/^[a-f0-9]{64}$/.test(manifest.weightsSha256||'')||
  manifest.licenseReviewed!==true||manifest.commercialUseReviewed!==true||
  manifest.localOnly!==true||manifest.runtimeOperatorApproved!==true)
  throw Error('MODEL_NOT_APPROVED_OR_UNPINNED');
 return {...manifest};
}
