# Jem🌼 — AI Cartoon & Animation Studio

**Founder:** Alexander Romaskevich · RomaskevicH · IMPERIAL Core  
**Engineering release:** v0.1 **local laboratory preview**, not an AI-generated cartoon engine yet.  
**Promise:** Build video. Verify every frame. Preserve the original character reference.  
**Budget:** FREE_ONLY ($0), no paid external providers.

> **This branch contains real working software, not a design mockup.** It turns a text prompt plus one local PNG/JPEG reference into a **real MP4 with animated camera movements**, multiple storyboard shots, scene fades, immutable reference-photo fingerprint, and a reproducible SHA-256 rendering receipt. It does **not** yet make the character walk, gesture, speak, change expressions or interact with generated environments. Do not advertise it as equivalent to Runway, Pika or Luma yet.

## Quick start (local Windows / Linux / macOS)

Install **Node.js 22+** and **FFmpeg/FFprobe** with a working `libx264` encoder (free, locally installed tools). No `npm install` or API key is needed.

```bash
git clone https://github.com/oromaskevic23-cmd/Jem-.git
cd Jem-
# First check out the Sprint 001 feature branch while the Draft PR is unmerged:
git checkout feat/jem-enterprise-studio-v0-1-20261025
npm start
```

Visit **http://127.0.0.1:8765**. Write a story prompt, upload an image you own or have permission to use, set duration (4 / 10 / 30 / 60 seconds), click Render and download `jem-film.mp4`.

Alternatively, with no browser:

```bash
node src/cli.mjs \
  --prompt "A brave astronaut explores a forest and discovers a luminous flower." \
  --photo /local/path/reference.jpg \
  --output ./renders \
  --duration 60
```

An isolated local project folder contains:
- `film.mp4` — real H.264 video
- `storyboard.json` — deterministic timeline, scene durations, prompt and pinned photo hash
- `render-report.json` — verified output frames, dimensions, duration and content SHA-256

**The photo is not edited or replaced.** Camera zoom/crop can change its framing; its original bytes are the same source for each shot.

## Reproducible verification

```bash
npm run check
npm test
npm run test:media
```

Real-media integration tests synthesize a local JPEG fixture, invoke FFmpeg, render an actual 4-second 320×180 MP4, inspect its exact frame count, duration, image-motion difference and H.264 output with FFprobe. GitHub Actions repeats checks in **two separate jobs**. Passing these tests does not mean the model performed AI video inference or that audio was generated.

## Actual feature status

| Feature | v0.1 status |
| --- | --- |
| Input: story prompt + PNG/JPEG | **IMPLEMENTED**, offline |
| Character photo SHA-256 identity anchor | **IMPLEMENTED**, reference provenance only |
| Deterministic storyboard with 60-second option | **IMPLEMENTED** |
| Multiple scenes, pan, push-in/pull-back, fades | **IMPLEMENTED**, camera-motion only |
| Real video export H.264 MP4 + ffprobe verification | **IMPLEMENTED**, local tools required |
| Local responsive upload UI, no external upload | **IMPLEMENTED** |
| Offline CPU image-to-video generative model | **NOT IMPLEMENTED** |
| Articulated motion, expressions, lip-sync | **NOT IMPLEMENTED** |
| Spoken dialogues, voice acting, sound design | **NOT IMPLEMENTED** |
| Multi-reference visual identity consistency across generated shots | **NOT VERIFIED** |
| Actual quality superiority against video competitors | **NOT VERIFIED** |
| Cloud deployment / production isolation | **NOT IMPLEMENTED** |

## Enterprise architecture to build next

1. **Real video generation plug-in** — opt-in local open-weight image-to-video model worker (with verified model hash/license) using an independent process/sandbox, never an online paid provider by default. Generate short clips for individual shots.
2. **Character Bible** — owner-approved multiview references, immutable identity/style manifests and a continuity review process. Prove visual consistency across *newly generated* shots using evaluation, not mere file hashes.
3. **Film Director** — constrained outline → shot list → keyframe references → timed motions → actual shot rendering → stitch; retries based on independent scene QA.
4. **Dialogue / Sound Department** — locally opted-in TTS and speech-to-timing/lip sync, soundscape, subtitles and license-aware music; prohibit cloning a real person's voice without permission.
5. **Render Farm** — bounded job queue, checkpoints, resumability, budgets, CPU/GPU resource limits, cancel/stop, deterministic hashes and proof-backed exports.
6. **Review and delivery** — human moderation, approval gateway, consent and IP/license checks, automated integrity tests, output benchmarking and versioned story assets.

## Security / privacy

- Localhost-only web server, strict upload/size limits, exact JSON schema and restricted file types; no model network use, paid API, telemetry or advertising.
- FFmpeg decodes untrusted media in the user's local process. **This is not a production-hardened sandbox**. Use only trusted photos on a trusted workstation until isolation is implemented.
- Rendered video and raw reference photo are temporarily stored in a local working directory. Do not upload sensitive photos; delete render directories when done.
- No facial alteration, counterfeit likeness replacement or generated speaking gestures are attempted.
- No secrets, private key material or GitHub credentials in source or CI.

## Benchmark policy

Runway emphasizes multi-shot character references, Luma Ray3 has image/video transformations and motion consistency, and Pika supports AI photo-to-video and prompt-controlled clips. Jem v0.1 **does not match these generative capabilities**. Targeting a better final studio is an engineering goal, never a claim without independent side-by-side testing under equivalent conditions.

**Release:** DRAFT PR only, no merge or production release without Owner review.  
**Mission:** IC-ASTRA-JEM-ENTERPRISE-VIDEO-ENGINEERING-20261025-001.
