# Jem🌼 Originals — Original Animation & Film Studio

**Mission:** IC-JEM-ORIGINALS-PILOT-20261025-003  
**Founder and Original Architect:** Alexander Romaskevich — RomaskevicH  
**Organization:** IMPERIAL Core  
**Product:** Jem🌼 Originals, original in-house film production division  
**Release:** DRAFT / OWNER REVIEW REQUIRED / FREE_ONLY DEVELOPMENT.

## Business model: two connected divisions

1. **Jem🌼 Studio platform** — future premium commercial storytelling and animation software for creators. Premium pricing is a proposal, not active billing. Work on generative video and billing remains incomplete.
2. **Jem🌼 Originals** — creator-owned original film concepts, characters, shorts, serials and later feature films. Original releases may showcase actual tool capabilities, but cannot establish licensed or monetizable status by themselves. Any sales, YouTube publication, streaming placement or IP transfer requires separate owner approval and rights verification.

## First episode — Pip and the Starflower

- **ID:** JEM-PILOT-001
- **Format:** 60-second family-friendly pilot with six 10-second acts, 480 frames at 8 fps, 320×180 original pixel canvas.
- **Video:** H.264 MP4 with **genuinely moving procedural 2D characters**, blinking and mouth motion, separately rendered background environment (static within acts). **Not a still-image camera pan.**
- **Sound:** completely synthetic local instrumental from code, AAC track. **No vocals, spoken lines, lip sync or generated speech.**
- **Captions:** six synchronized English SRT segments.
- **Original characters:** Pip (`PIP-001`) the lilac robot, Starflower (`STARFLOWER-001`) the magical blossom.
- **Episode arc:** discovery → search → storm → rescue → return → illuminated valley.
- **Provenance:** episode manifest, one immutable character-design source, reproducible deterministic timeline, MP4 SHA-256 integrity receipt and independent `ffprobe` verification.
- **Visibility:** code can be reviewed on GitHub; original film file is generated offline in an ignored local output directory. **No public video release performed.**

### Reproduce locally

Prerequisites: Node.js 22+, locally installed free FFmpeg and FFprobe with H.264 / AAC encoding.

```bash
npm run originals:test
npm run originals:qa
npm run originals:film
```

The final command writes:

```
originals-output/jem-originals-<random>/
├── jem-originals-pip-starflower.mp4
├── original-score.wav
├── subtitles.srt
├── episode.json
└── proof-receipt.json
```

No cloud accounts or AI inference providers are used. The video is generated with Node's procedural pixel rasterizer and offline FFmpeg H.264/AAC encoder. You can enlarge the pixel-art output for preview with FFmpeg's nearest-neighbor scaler; this **does not increase the underlying artistic resolution**.

## Cinema-production workflow for future episodes

| Team / NCA role | Actual task | Acceptance gate |
| --- | --- | --- |
| Creative Producer — ASTRA | Approve episode brief, mission ID, budget, authorized source materials | Owner intent and scope verified |
| Writer / Story Director — VELION | Develop original script, story beats, character motivations, episode continuity | Human creative acceptance |
| Character Lead — NCA | Character Bible, original artwork, reference sheets and independent rights checks | Stable identity and license provenance |
| Animation Director — Jem | Scene motion, genuine character actions, camera/background changes, shot timing | Rendered scene QA, not storyboard only |
| Sound Designer — NCA | Composed soundtrack, voice rights checks, clean mixes, subtitles | Timing and rights tests |
| Editor — CONSTRUCTOR AI | Clip assembly, export, technical consistency | MP4 decode, duration, frames, audio and hashes |
| Security / QA — CYBER HAK | Media safety, leak and dependency checks | Independent reproducible checks |
| Distributor — owner-approved operator | Publish trailers, full films, offers or streaming deals | Separate explicit signed owner approval |

These roles describe **future workflow responsibilities**, not presently active autonomous agents. A successful CI run does not prove that a multi-agent team actually produced the film.

## Engineering release gates

- **Gate A / Proven:** first actual 60-second procedurally animated 2D original, independent audio/video file QA and reproducible character motion.
- **Gate B / NOT IMPLEMENTED:** genuine open-weight image-to-video model creates *new action* from text and character-reference photos. Verify identity retention with independent QA, compare to procedural baseline.
- **Gate C / NOT IMPLEMENTED:** original 5–10 minute episodes with speech, voice acting, multi-character scenes and reliable visual continuity.
- **Gate D / NOT IMPLEMENTED:** feature films 30–90 minutes: plot continuity, editorial review, scalable render farm, post-production, multichannel sound, localization and distribution rights.
- **Gate E / NOT IMPLEMENTED:** commercial rights review, formal original-IP registrations as appropriate, insurance/agreements where required, channel permissions and customer monetization.

## Measurable editorial standards

Before any official publication: independent human review of plot and age rating; motion/face continuity; subtitles and audio synchronization; no borrowed artwork, identifiable third-party characters or copied music; no unauthorized person's real likeness or voice; content and music ownership evidence; output performance across iPhone/Android/web players; explicit owner publish permit; correct platform disclosures for synthesized media when required.

**Neither local hashes nor an engineer's assertion independently prove copyrights or regulatory compliance.** Original-code provenance is a helpful first step, not legal clearance.

## Constraints and explicit nonclaims

- No subscription charges, API key purchases, Val Town usage or advertising spend.
- No publication to YouTube, app stores, streaming sites or remote servers without scope-limited owner authorization.
- The pilot does not use AI image/video inference, and it does not demonstrate cinema-quality animation or superiority to any leading video model.
- No real voices, background crowd motion, realistic expressions, advanced rigging or HD native animation engine yet.
- The current 60-second MP4 proof is a **technical production proof-of-concept**, not a finished commercial feature film.

**Build Software. Animate Original Stories. Verify Everything.**
