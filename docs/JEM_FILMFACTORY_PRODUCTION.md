# Jem🌼 FilmFactory — Idea → Script → Shots → Verified MP4

**Mission:** IC-JEM-FILMFACTORY-SCREENPLAY-TO-FILM-20261026-001
**Founder:** Alexander Romaskevich / RomaskevicH / IMPERIAL Core
**Codebase:** Jem Originals; Sprint 003 stacked on Sprint 002
**Status:** real reproducible 2D technical film pipeline. Production release denied.

## What is automated today?

1. A story **idea** triggers a genre/world selector (workshop, mountain, garden, forest, ocean, lighthouse or music).
2. A **six-act original screenplay draft** is generated from a controlled narrative template. Six captions, six action descriptions, emotions, a moral, six dialogue draft lines and music cues are produced as real JSON. This does **not** mean an AI model wrote it.
3. A deterministic **shot plan** and immutable Pip/Starflower **character Bible** are generated, with scene IDs and frame windows.
4. Optionally, a **local Ollama** model can rewrite the six scene captions, action drafts and dialogue text. The endpoint is fixed to 127.0.0.1:11434, no cloud fallback or paid APIs, and no model gets execution authority. This adapter has contract tests, but full live LLM inference is NOT yet independently validated.
5. With **no external photo references**, validated screenplays compile to our existing original 2D rig and automatically render a real MP4 film with moving limbs/poses, music and SRT captions through FFmpeg. No lip sync or voiced dialogues.
6. A **production report** binds screenplay SHA-256, manifest SHA-256, film SHA-256, duration and independent FFprobe codec/frame QA.
7. The film remains **OWNER_REVIEW_REQUIRED** and is never auto-published, marketed as an AI-generated 3D movie or offered for sale.

### Run FilmFactory for the original Pip/Starflower rigs

Prerequisites: Node.js 22+, local FFmpeg with H.264 and AAC encoders.

~~~bash
npm run factory:test
npm run factory:qa

node factory/cli.mjs \
  --idea "Friends repair the garden after a storm and help every little creature" \
  --theme garden \
  --seconds 60 \
  --output ./originals-output
~~~

This creates an actual 60-second 2D film from the six-act script (not from user-supplied photo) along with the script, scene shot plan, design Bible, SRT subtitles, original WAV instrumental and proof receipts.

### Optional *real* local AI screenplay drafting (requires owner-installed Ollama)

~~~bash
node factory/cli.mjs \
  --idea "Pip and Starflower restore the harbor lighthouse for little travelers" \
  --theme lighthouse \
  --seconds 60 \
  --output ./originals-output \
  --ollama-model qwen2.5:3b
~~~

This does not install Ollama or a model for you. A user must separately install a suitable locally licensed free model. The feature requires a real running local endpoint; CI tests use a synthetic HTTP stub and therefore do not count as true inference evidence. Malformed, oversize, non-JSON, unsafe or improperly scoped model output is rejected, not silently granted production control.

### User-uploaded photos: deliberately protected boundary

~~~bash
node factory/cli.mjs \
  --idea "The young mountain rescuers save a little animal during a snowy storm" \
  --theme mountain \
  --seconds 60 \
  --output ./originals-output \
  --photo "/local/photo.jpg" \
  --confirm-photo-rights yes
~~~

In this mode the program **does** create a screenplay JSON, shot list, character design/rights manifest and a report, **but it refuses to fake a cartoon starring those exact people**. The report status is `BLOCKED_IMAGE_TO_VIDEO_MODEL_NOT_CONNECTED`; no film exists. The supplied photos are read locally for format, size and hash verification; bytes are not uploaded or committed to GitHub. The `--confirm-photo-rights yes` flag records a local operator declaration, not an independent legal rights audit.

An authentic free image-to-video model, safe local execution worker, actual visual continuity QA, consent and model/license controls are required to animate the people and animals depicted in the reference photos.

## Output contract

- `screenplay.json` — plot, selected world, protagonist Bible, scene-by-scene actions and dialogue text.
- `shot-plan.json` — timeline, camera/scene intent, original references and continuity constraints.
- `character-bible.json` — stable fictional characters and any source-image hashes.
- `production-report.json` — exact statuses and permitted outcomes.
- Supported 2D rig cases additionally include nested MP4, score WAV, SRT, episode manifest and render SHA-256 proof receipt.

Never report a 3D film as finished if only the storyboard is generated or if a generic 2D rig was substituted for submitted characters.

## Reference to founder-supplied IMPERIAL Kids concept images

See [seven-series universe slate](IMPERIAL_KIDS_FILMFACTORY_SLATE.md) for the specific posters and proposed stories: Workshop on Wheels, Mountain Rescuers, Garden Trackers, Forest Rescuers, Ocean of Kind Friends, Cloud Lighthouse Crew and Secret of Singing Gardens. Actual reference posters remain outside this public repository until explicit distribution consent.

## Next mandatory Enterprise milestones

- Real open-weight image-to-video worker with measured GPU/CPU memory, price $0 for development, safe license and pinned model hash.
- True prompt-conditioned act motion: characters walk, climb, interact, talk and stay visually consistent across generated shots.
- Permission-aware, language-localized writer (EN/RU/UK), actor casting, reference continuity and character voice/speech with consent.
- Sound designer, ambience, original multi-track score, lip-sync and caption alignment.
- Crash-safe render queue/checkpoints, 5–10 minute serial production, human director QA and independent 30–90 minute feasibility tests.
- Same project accessible on iPhone, iPad, Android and PC with trusted render service; signed App Store/Play Store launch only after approval.
- Premium subscription entitlements after a genuinely valuable working product, customer testing, store policy and finance approval.

**Security boundaries:** local-only assets, fail-closed photo and model adapters, no payment, no user privacy leak, owner approval for distribution. QA does not certify independent IP ownership, publication rights or market superiority.

**IMPERIAL Core · Jem🌼 — Build Films. Verify Everything.**
