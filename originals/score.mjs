/** Original deterministic instrumental synthesis: zero recordings, no music licensing dependency. */
import {writeFileSync} from 'node:fs';
const NOTES=[261.626,293.665,329.628,392,440,392,329.628,293.665,261.626,329.628,392,523.251];
export function makePcmScore({seconds=60,sampleRate=16000}={}){
 if(!Number.isInteger(seconds)||seconds<6||seconds>60||
  !Number.isInteger(sampleRate)||sampleRate!==16000)throw Error('AUDIO_SETTINGS_DENIED');
 const samples=seconds*sampleRate,pcm=Buffer.alloc(samples*2);
 for(let i=0;i<samples;i++){
  const t=i/sampleRate,act=Math.min(5,Math.floor(t/(seconds/6)));
  const note=NOTES[Math.floor(t*2)%NOTES.length],tick=t*2-Math.floor(t*2);
  const envelope=Math.exp(-4*tick)*Math.min(1,t/.7)*Math.min(1,(seconds-t)/.7);
  const bell=Math.sin(t*Math.PI*2*note)*.13*envelope+
    Math.sin(t*Math.PI*4*note)*.04*envelope;
  const softPad=Math.sin(t*Math.PI*2*(act===2?155.56:130.81))*.018;
  const sparkle=(act===5?Math.sin(t*2*Math.PI*659.25)*.026:0)*envelope;
  const value=Math.max(-32768,Math.min(32767,Math.round(32767*(bell+softPad+sparkle))));
  pcm.writeInt16LE(value,i*2);
 }
 return {pcm,sampleRate,samples,channels:1,policy:'ORIGINAL_SYNTH_INSTRUMENTAL_NO_SPEECH'};
}
export function writeWav(filepath,opts){
 const {pcm,sampleRate,samples,channels}=makePcmScore(opts),head=Buffer.alloc(44);
 head.write('RIFF',0);head.writeUInt32LE(36+pcm.length,4);head.write('WAVEfmt ',8);
 head.writeUInt32LE(16,16);head.writeUInt16LE(1,20);head.writeUInt16LE(channels,22);
 head.writeUInt32LE(sampleRate,24);head.writeUInt32LE(sampleRate*2,28);
 head.writeUInt16LE(2,32);head.writeUInt16LE(16,34);
 head.write('data',36);head.writeUInt32LE(pcm.length,40);
 writeFileSync(filepath,Buffer.concat([head,pcm]),{mode:0o600});
 return {sampleRate,samples,channels,durationSec:samples/sampleRate,format:'WAV_PCM16'};
}
