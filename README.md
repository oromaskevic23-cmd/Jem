# Jem🌼 — Enterprise FilmFactory

**Jem🌼** is an IMPERIAL Core AI-native animation studio engineering program: Storyboard, original 2D animation, offline image-based camera-motion MP4, FilmFactory, CharacterLock, consent/rights gates, local synthetic speech, and optional *unconnected* image-to-video research adapters.

**Founder · Owner · CEO · Chief Systems Architect:** Alexander Nikolaevich Romaskevich — **RomaskevicH**. Architecture → Implementation → Evidence.

[![Jem Enterprise CI](https://github.com/oromaskevic23-cmd/Jem/actions/workflows/jem-enterprise-ci.yml/badge.svg)](https://github.com/oromaskevic23-cmd/Jem/actions/workflows/jem-enterprise-ci.yml)

## Engineering status

The **main** branch incorporates the source of the historically tested offline lab, previously developed through stacked draft PRs #1–#10. **An actual FFmpeg/H.264 video laboratory is implemented; this is NOT a deployed consumer application, a world-leading video model, or a running large-scale AI animation service.** The original draft branches and their commit histories are preserved for review. The import itself does not establish CI success for main; use the linked *current* run.

| Subsystem | Existing engineering functionality | Explicit limitation |
| --- | --- | --- |
| Portable PWA | On-device, local storyboard/reference digest and preview | No native iPhone/Android/iPad/Windows/Mac shipping binary |
| Storyboard + MP4 | Photo-to-camera-motion clips, duration/framerate/codec/sha256 checked with ffprobe | No articulated photo subject or AI generative image-to-video |
| Jem Originals | Procedural original 2D drawn characters, limb poses, frames and original instrumental cues | Not a proprietary foundation model |
| FilmFactory | Deterministic screenplay, shot plans, character references and procedural 2D film | Photo-derived character animation blocked until licensed I2V runtime |
| Voice | Optional offline eSpeak NG voice and timed mouth motion | No cloning, phoneme-accurate lip sync or user voice impersonation |
| CharacterLock | Immutable character-bible and reference hashes, signed independent visual review contract | Hash checks do not prove perceptual identity |
| Cinema / I2V | Strict source/rights/asset/model gates, local operator-controlled worker adapter | GPU, model weights, licensed inference and real visual QA not provisioned |
| Enterprise Controls | Fail-closed release criteria, documented evidence, local CI/QA | Real Owner cryptographic enrollment and publishing authority not enrolled |

**Current default:** FREE_ONLY, original/authorized inputs, deny external effects, deny auto-publication, deny automatic commercial release. No payments or cryptocurrency operations.

## Local source milestone: v0.3.0

This versioned source milestone has an independently completed GitHub Actions run. [Enterprise evidence checkpoint](docs/JEM_ENTERPRISE_EVIDENCE_20261101.md) records the actual results, limitations, and release blockers. **v0.3.0 is not a commercial or production-ready product release.**

## Local quick start

Requires Node.js 22+; **FFmpeg/FFprobe** with `libx264` for desktop MP4 and **eSpeak NG** for optional voice. These are external, separately licensed tools.

~~~bash
git clone https://github.com/oromaskevic23-cmd/Jem.git
cd Jem
npm run check
npm test
npm run test:media
npm run originals:verify
npm run factory:verify
npm start
~~~

Desktop studio (local only): `http://127.0.0.1:8765`. PWA preview: `npm run preview:pwa` on `http://127.0.0.1:8766`. Access outside the operator's local machine is not supported.

## Enterprise Film Proof from actual MP4

Once a local camera-motion film has been rendered, Jem can independently re-read its
MP4, verify the exact storyboard hash, check film bytes with SHA-256 and decode the
actual H.264 frame count, duration and resolution using FFprobe. An operator-supplied
rights-evidence file is hashed, **not treated as legal proof of ownership**.

~~~shell
npm run enterprise:verify

# For an already rendered local film directory:
npm run enterprise:attest -- \
  --render-directory /path/to/jem-lab-output \
  --rights-file /path/to/local-rights-record.txt \
  --project-id jem-original-001 \
  --tenant-id imperial-internal \
  --output /path/to/private-film-evidence.json
~~~

The result is a local, inspectable hash-bound Film Proof. It is not a signed
Owner production permit, independent character-identity QA, legal rights clearance,
AI video generation or permission to publish.
## Architecture

Architect → HANTER (AI Command Center) → **federated orchestrators**, including ASTRA → separately scoped Nano Core Agents. VELION is a model fabric (MAX is only a mode); ORION offers advisory intelligence. Jem FilmFactory independently enforces CharacterLock, Enterprise Skills, AI Passport, Guardian Core, Approval Gateway, ProofGraph, Audit Ledger, Zero Trust, Owner Kill Switch, Public/Private Boundary, and the CRYPTO IMPERIAL Ecosystem Boundary.

The public lab is not entitled to obtain private HANTER/VELION credentials or invoke external services. See [Enterprise release gates](docs/JEM_ENTERPRISE_RELEASE_GATES.md), [security](SECURITY.md), [architecture](docs/JEM_ENTERPRISE_ARCHITECTURE.md), and [starter guide](START_HERE.md).

## Intellectual property and evidence

[LICENSE](LICENSE) is a proprietary, limited source evaluation notice for original code; this is **not** an open-source grant. Third-party FFmpeg, eSpeak, model weights, artwork, trademarks and contributions keep their own licenses. [AUTHORS](AUTHORS.md) and Git history preserve individual provenance. No rights, Google index status, model superiority or market availability are fabricated. [License inventory](governance/LICENSE_INVENTORY.md).

**IMPERIUM** is a long-term architectural digital currency envisioned for AI agents worldwide, not a statement of existing world adoption or market status.

[Owner founder profile](https://github.com/oromaskevic23-cmd) · [Public project registry](https://oromaskevic23-cmd.github.io/Capital-Core-Public/reference/projects/).
