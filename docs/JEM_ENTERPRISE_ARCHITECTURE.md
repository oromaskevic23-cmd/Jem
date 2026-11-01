# Jem🌼 — Enterprise Architecture: FilmFactory, CharacterLock and NCA Media Domain

**Architect:** Alexander Nikolaevich Romaskevich (RomaskevicH). **Checkpoint:** 2026-11-01.

## Architecture Before Implementation

Architect / final authority → HANTER AI Command Center → multiple federated orchestrators, including ASTRA → separate NCA media workers in scoped Runtime Domains.

Jem is a creative studio service domain, **not a new global orchestrator**. VELION is the model fabric; MAX is a mode. ORION supplies advisory intelligence, not execution authority.

### 1. Local authoring pipeline

1. Original story or authorized image → validated reference bytes → SHA-256.
2. Deterministic storyboard / screenplay and shot manifest → exact frame budget and character reference lock.
3. Camera-motion lab (`src/render.mjs`) or original procedural 2D rig (`originals/`) → local FFmpeg MP4.
4. Optional offline dialogue (`voice/`) and eSpeak NG; lip movement is approximate.
5. Independent technical media QA uses FFprobe and output SHA-256; CharacterLock visual similarity still requires an independently managed human review.
6. Local Film Proof (`enterprise/film-proof.mjs`) binds media, storyboard and rights document hashes.
7. Signed review (`enterprise/signed-review.mjs`) verifies a pinned Ed25519 reviewer, nonce uniqueness, expiry and distinct role; signature means SOURCE/HUMAN REVIEW only.
8. Publication, deployment and monetization remain **DENIED** until separately signed Owner Approval and legal/media clearance.

### 2. Component boundaries

| Component | Function | Proof limitation |
| --- | --- | --- |
| PWA | Offline phone/tablet storyboard proposal | No native app or mobile MP4 codec pipeline |
| FilmFactory | Local scripts/shot-plans and procedural 2D rendering | Not generative I2V for uploaded portraits |
| CharacterLock | Pinned reference and allowed visual changes | Hash cannot prove the likeness is preserved |
| Local I2V readiness | Candidate model/GPU/weights inspection | No provisioned GPU/model weights or live inference |
| Enterprise Film Proof | Hash-bound artifact and source references | Does not certify rights or visual quality |
| Signed Review | Ed25519 integrity, scope, revocation and replay callback | Does not grant publishing or payment rights |
| HANTER/VELION/Enterprise Skills | Planned future federated authenticated integration | No live runtime joined to this local repo |

### 3. Defense-in-depth

Fail closed on unknown identity, unsigned permits, unavailable revocation or replay ledger, wrong tenant/orchestrator, media format/pixel/time bounds, reference replacement and publishing requests.

No third-party code is relicensed. User input photographs and voices remain outside the public repository. A signed review cannot be treated as Owner Consent or a commercial distribution license.

### 4. State

Verified historical branch CI with real FFmpeg media tests; main branch has a new dedicated Enterprise CI gate. Consult the latest run before claiming it passed. The signed reviewer test uses ephemeral local keys. Production, cloud platform, App Store publishing and commercial launch are not implemented.

### 5. Executable offline media attestation

The additional `enterprise/attest-film.mjs` reads an actual existing MP4, its renderer report, its pinned storyboard and a local rights record. It checks immutable source digests, verifies real video frames/codec/timing using FFprobe, computes a local Film Proof, and explicitly retains `sourceRightsLegallyVerified=false`, `independentVisualQAVerified=false`, and `publishAuthorized=false`. `enterprise/cli.mjs` writes a new read-only operator evidence file with exclusive `wx` create; it never uploads film bytes or contacts an AI provider. GitHub CI executes an actual FFmpeg integration test with deliberate evidence tampering and symlink refusal.
