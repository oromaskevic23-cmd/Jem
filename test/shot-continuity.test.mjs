import test from 'node:test';
import assert from 'node:assert/strict';
import { lockShotSequence } from '../video/shot-continuity.mjs';

const h = 'a'.repeat(64), s = 'b'.repeat(64);
const shot = (id, extra = {}) => ({
  shotId: id, characterId: 'jem-hero', referenceSha256: h, styleSha256: s,
  durationFrames: 48, camera: 'static', prompt: 'Friendly cartoon character in an office.', ...extra,
});

test('multi-shot continuity pinned and deterministic', () => {
  const a = lockShotSequence([shot('s1'), shot('s2', {camera:'zoom-in'})]);
  const b = lockShotSequence([shot('s1'), shot('s2', {camera:'zoom-in'})]);
  assert.equal(a.manifestSha256, b.manifestSha256);
  assert.equal(a.frames, 96);
  assert.equal(a.release, 'BLOCKED_PENDING_VISUAL_QA');
});
test('same character cannot switch reference', () =>
  assert.throws(() => lockShotSequence([shot('s1'), shot('s2', {referenceSha256: 'c'.repeat(64)})]), /CHARACTER_OR_STYLE_CHANGED/));
test('same character cannot switch style', () =>
  assert.throws(() => lockShotSequence([shot('s1'), shot('s2', {styleSha256: 'c'.repeat(64)})]), /CHARACTER_OR_STYLE_CHANGED/));
test('unknown fields rejected', () =>
  assert.throws(() => lockShotSequence([shot('s1', {apiKey:'secret'})]), /UNTRUSTED_SHOT_FIELDS/));
test('duplicate shot rejected', () =>
  assert.throws(() => lockShotSequence([shot('s1'), shot('s1')]), /DUPLICATE_SHOT_ID/));
test('unbounded frames rejected', () =>
  assert.throws(() => lockShotSequence([shot('s1', {durationFrames:240}), shot('s2', {durationFrames:240}), shot('s3', {durationFrames:240}), shot('s4', {durationFrames:240})]), /FILM_FRAME_BUDGET_EXCEEDED/));
test('bad reference hash rejected', () =>
  assert.throws(() => lockShotSequence([shot('s1', {referenceSha256:'unpinned'})]), /UNPINNED_REFERENCE/));
test('invalid camera rejected', () =>
  assert.throws(() => lockShotSequence([shot('s1', {camera:'teleport'})]), /UNSUPPORTED_CAMERA/));
test('control characters rejected', () =>
  assert.throws(() => lockShotSequence([shot('s1', {prompt:'a\nb'})]), /INVALID_PROMPT/));
test('empty sequence rejected', () =>
  assert.throws(() => lockShotSequence([]), /INVALID_SHOT_COUNT/));
