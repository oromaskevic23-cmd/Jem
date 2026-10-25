/** Jem🌼 FilmFactory screenplay drafts. Deterministic authored templates, NOT LLM inference. */
import {createHash} from 'node:crypto';
import {createPilot,DESIGN} from '../originals/pilot.mjs';
const h=x=>createHash('sha256').update(x).digest('hex');
const worlds={
 workshop:['Workshop on Wheels','harbor town',[
 'THE TOWN NEEDS OUR HELP','THE TEAM FINDS ITS TOOLS','A STORM HITS THE WORKSHOP',
 'PIP REPAIRS THE BRIDGE','THE LIGHTS TURN ON AGAIN','EVERYONE CELEBRATES TOGETHER']],
 mountain:['Mountain Rescuers','mountain trail',[
 'A FRIEND IS LOST IN THE FOG','PIP FINDS A MOUNTAIN TRAIL','A STORM COVERS THE PASS',
 'PIP CROSSES THE STREAM','THE FRIEND IS SAFE AT LAST','COURAGE LIGHTS THE MOUNTAINS']],
 garden:['Garden Trackers','flower garden',[
 'THE GARDEN NEEDS WATER','THE FRIENDS LOOK FOR A STREAM','WIND SCATTERS THE SEEDS',
 'PIP SAVES THE LITTLE FLOWERS','THE GARDEN BLOOMS AGAIN','NATURE THANKS ITS FRIENDS']],
 forest:['Forest Rescuers','enchanted forest',[
 'A SMALL FRIEND NEEDS HELP','PIP FINDS A GLOWING CLUE','THE FOREST TURNS STORMY',
 'FRIENDS CROSS THE STREAM','EVERYONE FINDS THE WAY HOME','KINDNESS BRIGHTENS THE FOREST']],
 ocean:['Ocean of Kind Friends','ocean reef',[
 'THE OCEAN SENDS A MESSAGE','PIP FOLLOWS A SEA STAR','A WAVE HIDES THE PASSAGE',
 'THE FRIENDS SAVE A TURTLE','THE REEF SHINES ONCE AGAIN','EVERY WAVE BRINGS KINDNESS']],
 lighthouse:['Cloud Lighthouse Crew','cloud islands',[
 'THE LIGHTHOUSE GOES DARK','THE TEAM FOLLOWS THE WIND','CLOUDS BLOCK THE BEACON',
 'PIP FIXES THE BROKEN LIGHT','TRAVELERS FIND THEIR WAY HOME','THE SKY CELEBRATES TOGETHER']],
 music:['Secret of Singing Gardens','magical musical valley',[
 'THE VALLEY LOSES ITS SONG','A FLOWER HUMS A MELODY','THE WIND TAKES THE MUSIC',
 'PIP FINDS THE MISSING NOTE','THE GARDENS SING AGAIN','THE FRIENDS DANCE AT SUNSET']]
};
const stages=['DISCOVER','WALK','CHASE','RESCUE','CELEBRATE','FINALE'];
const arcs=['A new mystery calls our friends.','The team gathers clues and begins the journey.',
 'A challenge threatens their progress.','Pip and Starflower find a solution together.',
 'The situation improves through teamwork.','Everyone celebrates and learns a lesson.'];
const speech=[
 ['Pip','Someone needs our help!'],['Pip','We can find a way together!'],
 ['Starflower','Look out! A storm is coming!'],['Pip','We will not leave anyone behind!'],
 ['Starflower','It worked! We did it together!'],['Pip','Small hearts can make big changes!']
];
const cues=['bright discovery','playful travel','tense winds','hopeful rescue','gentle relief','joyful finale'];
const disallowed=/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/u;
export function selectWorld(idea,theme='auto'){
 if(theme!=='auto'){if(!Object.hasOwn(worlds,theme))throw Error('THEME_INVALID');return theme}
 const pairs=[
 ['ocean',/ocean|dolphin|underwater|океан|море/iu],
 ['mountain',/mountain|climb|горн|спасател/iu],
 ['workshop',/workshop|repair|мастерск|ремонт/iu],
 ['lighthouse',/lighthouse|cloud|маяк|облак/iu],
 ['music',/music|song|singing|мелод|музык/iu],
 ['garden',/garden|flowers|сад|цвет/iu]
 ];
 return pairs.find(([,re])=>re.test(idea))?.[0]??'forest';
}
export function verifyReferences(refs=[]){
 if(!Array.isArray(refs)||refs.length>12)throw Error('REFERENCE_SCHEMA_DENIED');
 const seen=new Set();
 return refs.map((r,i)=>{
  if(!r||Object.keys(r).sort().join(',')!=='authorized,kind,sha256'||
   r.authorized!==true||r.kind!=='image'||typeof r.sha256!=='string'||
   !/^[a-f0-9]{64}$/.test(r.sha256)||seen.has(r.sha256))
   throw Error('REFERENCE_NOT_AUTHORIZED');
  seen.add(r.sha256);
  return {id:'REF'+(i+1),sha256:r.sha256,
   use:'SHOT_CONCEPT_ONLY_NOT_RENDERED'};
 });
}
export function writeScreenplay({idea,theme='auto',language='en',durationSec=60,references=[]}={}){
 if(typeof idea!=='string'||idea!==idea.trim()||idea.length<12||idea.length>2000||
  disallowed.test(idea))throw Error('IDEA_INVALID');
 if(language!=='en')throw Error('LANGUAGE_NOT_IMPLEMENTED');
 if(!Number.isInteger(durationSec)||durationSec<6||durationSec>60||durationSec%6!==0)
  throw Error('DURATION_DENIED');
 const world=selectWorld(idea,theme),[title,location,captions]=worlds[world];
 const assets=verifyReferences(references),sceneSec=durationSec/6;
 const shots=captions.map((caption,i)=>({
  shotId:'SHOT'+(i+1),act:i+1,stage:stages[i],
  fromSec:i*sceneSec,toSec:(i+1)*sceneSec,caption,
  action:arcs[i],location,
  characters:[DESIGN.protagonist.id,DESIGN.companion.id],
  emotion:['curious','hopeful','worried','brave','relieved','joyful'][i],
  dialogue:{speaker:speech[i][0],text:speech[i][1],state:'TEXT_ONLY_NOT_VOICED'},
  musicCue:cues[i],referenceIds:assets.map(x=>x.id),
  animationInstruction:'TWO_DIMENSIONAL_PIP_STARFLOWER_RIG',
  shotPrompt:location+'; '+arcs[i]+'; '+idea.slice(0,240),
  continuity:'SAME_FIXED_CHARACTER_BIBLE_ALL_SCENES'
 }));
 const draft={schema:'jem_screenplay_v1',producer:'IMPERIAL Core — Jem🌼 Originals',
  series:'IMPERIAL Kids',title,world,idea,language,
  format:'TEMPLATE_GENERATED_SIX_ACT_CARTOON',generator:'DETERMINISTIC_NOT_LLM',
  seconds:durationSec,fps:8,logline:title+': '+idea,
  moral:'Friends solve big challenges through kindness, courage and teamwork.',
  characterBible:DESIGN,referenceAssets:assets,
  photoMode:assets.length?'PREPRODUCTION_ONLY_NO_IMAGE_TO_VIDEO_MODEL':'NO_EXTERNAL_PHOTO',
  shots,subtitles:'SHOT_CAPTIONS_ONLY',
  spokenDialogue:'NOT_GENERATED',videoModel:'NOT_CONNECTED',
  publicRelease:'OWNER_APPROVAL_REQUIRED'};
 return {...draft,screenplaySha256:h(JSON.stringify(draft))};
}
export function compileRigFilm(screenplay){
 if(screenplay.schema!=='jem_screenplay_v1'||screenplay.language!=='en'||
  screenplay.referenceAssets.length)throw Error('IMAGE_TO_VIDEO_PROVIDER_NOT_CONNECTED');
 if(!Array.isArray(screenplay.shots)||screenplay.shots.length!==6)throw Error('INVALID_SHOTS');
 const original=createPilot({seconds:screenplay.seconds,fps:8});
 const acts=original.acts.map((act,i)=>({
  ...act,title:screenplay.shots[i].stage,
  caption:screenplay.shots[i].caption,
  action:screenplay.shots[i].action
 }));
 const m={...original,title:screenplay.title,
  episodeId:'JEM-FACTORY-'+screenplay.screenplaySha256.slice(0,12),
  acts,screenplaySha256:screenplay.screenplaySha256,
  filmFactoryMode:'PRESET_2D_RIG_WITH_GENERATED_CAPTIONS'};
 delete m.manifestSha256;
 return {...m,manifestSha256:h(JSON.stringify(m))};
}
