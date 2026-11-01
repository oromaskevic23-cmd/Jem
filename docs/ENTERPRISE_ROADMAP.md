# Jem🌼 — Enterprise Animation Studio, verified roadmap

**Mission:** IC-ASTRA-JEM-ENTERPRISE-VIDEO-ENGINEERING-20261025-001  
**Owner:** Alexander Romaskevich / RomaskevicH / IMPERIAL Core  
**Hard constraints:** FREE_ONLY ($0); correct photo continuity; genuine films, not photo slides; evidence-first, no model claim before actual inference.  
**Current:** v0.1 offline local camera-motion film renderer — **NOT character-generative AI**.

## North Star

Given a story prompt and one or more user-authorized reference photos, Jem should generate a **complete 60-second cartoon**, with **real moving characters**, visual continuity, consistent identities, synchronized dialogue and audio, coherent shot-to-shot action, and reproducible source/provenance. At the end, export MP4 and a proof-backed report.

This must not be confused with a 60-second zoompan montage. Today's implementation is a deterministic studio **foundation**, not the North Star.

## Architecture

```text
Local User / Authorized Browser
     -> Consent & Source Inspector -> Immutable Reference Asset SHA-256
     -> Story Director -> Timed Scene Graph + Character Bible
     -> Per-shot Generative I2V Worker [NOT CONNECTED]
           -> independent model weight + license pinning
           -> reference conditioning, motion prompts, fixed seed
           -> isolated video clip output, QA receipts
     -> Character/Background/Shot Continuity Gate [PLANNED]
     -> Dialogue + Voice + Lip Sync [PLANNED]
     -> Scene Composer [v0.1 REAL: FFmpeg camera-motion baseline]
     -> MP4 / frame QA / timeline receipt [v0.1 REAL]
     -> Owner Review / Publish [NOT AUTOMATED]
```

## Competitor reference matrix (official product statements, not independent benchmarking)

| Capability | Runway Gen-4 | Luma Ray3 | Pika 2.5 | Jem v0.1 |
| --- | --- | --- | --- | --- |
| Reference-character consistency across generated shots | Advertised | Advertised | Not independently assessed here | **NO; same original image only** |
| Generative image-to-video character motion | Advertised | Advertised | Advertised | **NO** |
| Prompt-guided clip generation | Advertised | Advertised | Advertised | **NO** |
| 60-second story timeline | Via editing workflows; verify independently | Via editing workflows; verify independently | Via editing workflows; verify independently | **YES, with non-generative camera motion** |
| Local-only privacy without cloud uploads | Depends on product/workflow | Depends on product/workflow | Depends on product/workflow | **YES, localhost and offline FFmpeg** |
| Signed media/render integrity receipt | Not evaluated | Not evaluated | Not evaluated | **SHA-256 receipt; not externally signed** |
| Dialogue, lip-sync and full film soundtrack | Not evaluated | Not evaluated | Not evaluated | **NOT IMPLEMENTED** |

Competitor information: https://runway.com/research/introducing-runway-gen-4 , https://lumalabs.ai/ray3 , https://creation.pika.art/apps/pika-2-5 . The matrix must be revisited before any superiority claim, with equal reference assets, prompt, duration, cost, measured score and human preference evaluation.

## Engineering roadmap and acceptance gates

### Gate A — actual baseline (Sprint 001)
- [x] Reproducible prompt → multi-shot scene timeline → video composer pipeline, explicit v0.1 limitations.
- [x] Character reference bytes pinned with SHA-256 in every shot.
- [x] Real FFmpeg video export, free local toolchain, frames/duration/resolution checks.
- [x] Local desktop browser and CLI.
- [x] Restricted Node HTTP local-only server; file size limits; input type and duration checks.
- [x] Unit/negative tests and real rendered MP4 E2E test committed. **Mark QA PASS only when CI run succeeds.**

### Gate B — first true generative character animation (highest priority next)
- [ ] Select open-weight local image-to-video architecture using verified redistribution license, model SHA, VRAM/CPU memory, and offline operation.
- [ ] Implement a bounded, opt-in local model worker; require genuine inference traces and a clip containing **motion independent of camera transform**.
- [ ] Add actual per-shot reference-conditioning, identity source chain and output checks.
- [ ] Verify three distinct sequences depicting coherent **physical action**, not just moving an image window.
- [ ] Compare model effect to a camera-motion-only baseline on identical input.
- [ ] Add persistent job-state, controlled retries, cancellation and crash recovery.

### Gate C — complete 60-second cartoon with consistent characters
- [ ] Coherent introduction / action / conflict / resolution across at least six distinct shots.
- [ ] Same character design, clothing, colors and identity; quantifiable identity drift tests plus human QA.
- [ ] Automated clip assembly and transition continuity; no silent character substitution.
- [ ] Character motion QA on action verbs: walking, running, turning, interacting and speaking.
- [ ] Story scoring, timeline and shot-to-shot causality checks.

### Gate D — sound and enterprise operations
- [ ] Opt-in, license-audited local TTS; separate explicit user consent for impersonating a real person's voice.
- [ ] Lip sync, multitrack audio, subtitles and sound effects; loudness and timing checks.
- [ ] Safe offline render queue, logs, quotas, multi-worker scheduling, caching, backpressure and rollback.
- [ ] Deterministic manifest, signed release evidence, privacy cleanup and redacted telemetry (opt in).
- [ ] GPU and CPU benchmarks on published hardware conditions, with latency/cost budgets and reproducibility.

### Gate E — competition and market claims
- [ ] Blind human-rating tests vs comparable competitor clips for identical text+reference, equal seconds/quality/asset access.
- [ ] Character continuity and temporal consistency metrics, lip sync accuracy, narrative coherence and user editability.
- [ ] Publish actual hardware cost, time, crash rate, reject rate, third-party licensing, test references and successful output clips.
- [ ] Call Jem better than a competitor **only in specific measured metrics** where repeatable independent evidence exists.

## Current security limitations

Node/FFmpeg processes are **not** an execution sandbox; malicious image vulnerabilities are possible. Localhost is the only supported transport. No production multiuser identity/auth, geographic distributed workers or remote public upload. Original photos must be owned/authorized. Source photo and rendered media may remain in local temporary directories until cleanup. No facial editing, speech generation, paid cloud API or AI inference is used by v0.1.

## STOP conditions

No external actions, credential access, paid subscriptions, fake demo videos, unsanctioned real-person voice cloning or claims of world-leading AI without evidence. Owner-controlled release only. 
