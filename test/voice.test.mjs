import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeScreenplay} from '../factory/screenplay.mjs';
import {validateDialogue} from '../voice/dialogue.mjs';
import {drawFrame} from '../originals/draw.mjs';
import {createPilot} from '../originals/pilot.mjs';
const sc=writeScreenplay({idea:'Friends help a little forest explorer find a place to call home.'});
const h=x=>createHash('sha256').update(x).digest('hex');
test('dialogue validates exactly six independent screenplay utterances',()=>{
 const lines=validateDialogue(sc);
 assert.equal(lines.length,6);
 assert(lines.every(x=>x.dialogue.text.length>=3&&x.toSec>x.fromSec));
});
test('malicious dialogue cannot launch audio synthesis, and no language impersonation',()=>{
 const s=structuredClone(sc);s.shots[0].dialogue.text='A'.repeat(130);
 assert.throws(()=>validateDialogue(s),/DIALOGUE_SCHEMA_DENIED/);
 s.shots[0].dialogue.text='safe phrase';
 s.shots[1].dialogue.text='hello\n--stdout';
 assert.throws(()=>validateDialogue(s),/DIALOGUE_SCHEMA_DENIED/);
});
test('timeline-bound speech makes 2D mouth frames change without mutating character identity',()=>{
 const pilot=createPilot(),baseline=drawFrame(pilot,0);
 const closed=drawFrame(pilot,0,{voiceCues:[]});
 const spoken=drawFrame(pilot,0,{voiceCues:[{fromSec:0,endSec:0.7}]});
 assert.equal(baseline.length,closed.length);
 assert.notEqual(h(closed),h(spoken));
 assert.deepEqual(pilot.characterBible.protagonist.id,'PIP-001');
 assert.equal(h(spoken),h(baseline));
});
