# Jem demo editor — local evidence, 17 November 2026

Owner: Alexander Nikolaevich Romaskevich. Baseline source:
`21e52d7cf84e1aab51d72a6800b1980cf6405f9c`.

This developer-run local verification used synthetic generated color clips and
a sine-wave WAV. It did not use customer footage, make a submission, publish a
video, call an AI model, or establish legal rights or independent visual QA.

| Check | Outcome | Scope |
| --- | --- | --- |
| `npm run demo:test` | 2 tests passed | Two MP4 sources assembled into a four-second H.264 file; WAV narration encoded as AAC; SRT and source/output hashes checked. Invalid ranges, symlinks, missing rights declaration and unexpected fields rejected. |
| `npm test` | 19 tests passed | Existing storyboard, local server and PWA tests. |
| `npm run test:media` | 4 tests passed | Existing camera-motion render and reference-integrity tests, including a 60-second synthetic render. |
| Syntax checks | passed | Existing `npm run check`, plus `node --check` for the new editor and CLI. |

The demo test produced 32 frames at 8 fps, 320 × 180, with four seconds of
output. This test resolution is not a claim about a finished submission. The
editor also supports 640 × 360 and 1280 × 720. Environment: Node.js 24.22.1,
FFmpeg 7.1.5 and FFprobe, Linux. No CI run or cloud deployment was started.

The final demonstration still requires real, authorized screen recordings,
reviewed narration, current competition instructions and independent content
review. The editor's `rightsDeclaration` is an operator statement, not proof
of rights; content accuracy and economic claims remain the operator's
responsibility.
