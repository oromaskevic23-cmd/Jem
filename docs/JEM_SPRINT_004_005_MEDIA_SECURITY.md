# Jem🌼 Sprint 004 + 005 — Image-to-Video Admission / Voice & Dialogue

**Founder:** Alexander Romaskevich — RomaskevicH  
**Product:** Jem🌼 — AI Cartoon & Animation Studio / IMPERIAL Kids  
**Mission:** IC-ASTRA-JEM-I2V-VOICE-S004-S005-20261026  
**Release:** Draft PR, offline lab only, NO PAID SERVICE, NO MODEL CLAIM WITHOUT REAL INFERENCE.

## Sprint 004 — actual implemented engineering

- `video/scene-contract.mjs`: strict JSON input scope; only local 1–6-second scenes, 1–3 explicitly authorized reference-image digests, exact screenplay SHA, identity continuity rules and no production approval field.
- `video/model-registry.mjs`: actual candidate inventory, **RESEARCH_ONLY** (not installed) LTX Video 2B distilled, Wan2.1 I2V 14B and LTX-2. Each needs weight SHA-256, separate commercial/license review, operator runtime approval and local-only provisioning.
- `video/scene-review-queue.mjs`: durable local SQLite job record keyed by mission and shot. Duplicate requests do not rerun; altered same mission key fails. Failed/unavailable worker returns an explicit BLOCKED reason. An injected reference-rendered H.264 video is independently decoded by FFprobe; dimensions, duration, exact frames, local-root path, file size and artifact SHA-256 are checked.
- A successfully decoded output still returns **REVIEW_REQUIRED**. It is **never automatic owner release, independent character identity proof or evidence of real model inference**. A worker assertion about character identity is not a trusted approval.

### Current image-to-video status

**NO REAL IMAGE-TO-VIDEO INFERENCE MODEL IS CONNECTED.** The provider adapter is a contract injection point, not a working local diffusion model. The CI creates synthetic FFmpeg test scenes to confirm accurate refusal/admission boundaries; it does not impersonate diffusion inference. Real photos used in a FilmFactory project still produce a shot plan and a clear BLOCKED result until a true and license-cleared model is installed and separately reviewed.

A secure model-specific worker, source-image byte-level pinning and witness-backed identity/continuity review are further prerequisites for full real-scene use. A user-declared rights confirmation is not legal proof of copyright or subject consent.

Model documentation:
- LTX Video: https://github.com/Lightricks/LTX-Video — small 2B candidate; **checkpoint license varies and needs individual review**.
- Wan2.1: https://github.com/Wan-Video/Wan2.1 — I2V-14B candidate; benchmark hardware and license before use.
- LTX-2: https://github.com/Lightricks/LTX-2 — more capable family but official LTX Desktop requirements indicate **24GB or more VRAM recommended**, unsuitable for an 8GB default machine without separately verified reduced-memory workflow.
- [LTX Desktop local hardware requirements](https://github.com/Lightricks/LTX-Desktop) are substantially above an RTX 2070 SUPER 8GB GPU. Do not promise full local LTX-2 quality on this machine; optimize only after reproducible profiling.

## Sprint 005 — actual implemented engineering

- `voice/dialogue.mjs` invokes locally installed **eSpeak NG** to synthesize **six real English lines** from FilmFactory scene dialogue. It never requests or clones a human voice.
- FFprobe checks each WAV duration against the scene time interval. eSpeak audio is generated without a shell and using bounded dialog text; user prompts do not become executable command arguments.
- FFmpeg mixes six time-aligned spoken WAV files into the existing original score while preserving the verified H.264 video.
- The original moving 2D Pip/Starflower rig now animates the mouth **on the timed speaking segments**. This is a basic mouth activity animation, **not phoneme-aligned high-fidelity lip synchronization**.
- Full film receipt records the new MP4 SHA-256, voice segment timing, video/audio codec, and owner-review state. `voice-proof.json` is a lab integrity receipt and not an independent commercial-rights clearance.
- `--voice yes` is opt-in, requires a film of at least 30 seconds and local installation of FFmpeg, FFprobe and eSpeak NG.

### Example — real offline scripted, spoken 2D film

With Node.js 22+ and local free FFmpeg and eSpeak NG installed:

```bash
node factory/cli.mjs \
  --idea "Pip and Starflower restore the lighthouse and save their friends" \
  --theme lighthouse \
  --seconds 60 \
  --output ./originals-output \
  --voice yes
```

Without `--voice yes`, previous behavior remains unchanged. When `--photo` is provided, the pipeline **does not fake** a 3D or photo-faithful film; it still refuses generation rather than secretly using generic characters. The generated story dialogue is currently English-only; localized text, native voice actors and lip sync require additional licensed/consented production capabilities.

## Security and proof boundaries

No model inference, public upload, customer billing, app-store publishing, uncontrolled file paths, custom shell or general-purpose HTTP fetch. SQLite is an ordinary local journal, not tamper-proof against database administrators. The model registry contains no downloaded weights and no declared trustworthy external production operators. Synthetically provisioned CI manifests are test-only and must not be mistaken for a real approved model.

### Remaining Enterprise requirements

1. A real **licensed local diffusion image-to-video worker** that demonstrably changes the approved subject over consecutive frames instead of using camera motion or synthetic test-video input.
2. Computer-vision and human **character continuity review**; cryptographic source hashing alone does not prove appearance consistency.
3. A robust crash-safe worker with cancellation, timeout, deterministic jobs, source bytes and output-media attestations, and independent sandbox restrictions.
4. Multilingual genuine dialogue and phoneme timing, voice licenses and explicit consent for recognizable real people.
5. End-to-end testing on iPhone, iPad, Android and desktop with an owner-approved hosted trusted render executor.
6. Owner-approved public release, independent licensing/security acceptance, and backend-paid entitlements. Until then pricing proposals remain NOT FOR SALE.

**Build Films. Verify Every Frame.**
