import { createHash } from 'node:crypto';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const allowed = new Set(['shotId', 'characterId', 'referenceSha256', 'styleSha256', 'durationFrames', 'camera', 'prompt']);
const hex = /^[a-f0-9]{64}$/;
const id = /^[a-zA-Z0-9_-]{1,64}$/;
const cameras = new Set(['static', 'pan-left', 'pan-right', 'zoom-in', 'zoom-out']);

export function lockShotSequence(shots, { maxShots = 24, maxFrames = 720 } = {}) {
  if (!Array.isArray(shots) || shots.length < 1 || shots.length > maxShots) throw new Error('INVALID_SHOT_COUNT');
  const identities = new Map();
  const seen = new Set();
  let total = 0;
  const locked = shots.map((shot) => {
    if (!shot || typeof shot !== 'object' || Array.isArray(shot) || Object.keys(shot).some(k => !allowed.has(k)))
      throw new Error('UNTRUSTED_SHOT_FIELDS');
    const { shotId, characterId, referenceSha256, styleSha256, durationFrames, camera, prompt } = shot;
    if (![shotId, characterId].every(x => typeof x === 'string' && id.test(x))) throw new Error('INVALID_ID');
    if (seen.has(shotId)) throw new Error('DUPLICATE_SHOT_ID');
    seen.add(shotId);
    if (![referenceSha256, styleSha256].every(x => typeof x === 'string' && hex.test(x))) throw new Error('UNPINNED_REFERENCE');
    if (!Number.isInteger(durationFrames) || durationFrames < 1 || durationFrames > 240) throw new Error('INVALID_DURATION');
    total += durationFrames;
    if (total > maxFrames) throw new Error('FILM_FRAME_BUDGET_EXCEEDED');
    if (!cameras.has(camera)) throw new Error('UNSUPPORTED_CAMERA');
    if (typeof prompt !== 'string' || prompt.length > 500 || /[\u0000-\u001f]/.test(prompt)) throw new Error('INVALID_PROMPT');
    const binding = referenceSha256 + ':' + styleSha256;
    if (identities.has(characterId) && identities.get(characterId) !== binding)
      throw new Error('CHARACTER_OR_STYLE_CHANGED');
    identities.set(characterId, binding);
    return Object.freeze({ shotId, characterId, referenceSha256, styleSha256, durationFrames, camera, prompt });
  });
  const manifest = { schema: 'jem-shot-sequence-v1', frames: total, shots: locked };
  return Object.freeze({ ...manifest, manifestSha256: sha(JSON.stringify(manifest)), release: 'BLOCKED_PENDING_VISUAL_QA' });
}
