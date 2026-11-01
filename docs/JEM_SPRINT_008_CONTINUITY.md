# Jem🌼 Sprint 008 — multi-shot continuity

**Engineering-only**: build on Sprint 007 without changing existing character images, appearance, pose, costume or source symbols.

The new `video/shot-continuity.mjs` module builds a deterministic, source-hashed shot manifest. It pins every character to exactly one original reference SHA-256 and style SHA-256 across shots. Camera movement is limited to an allowlist; duration and shot count are bounded. Duplicate shot IDs, unknown fields and reference/style changes are rejected.

**Important distinction:** a pinned manifest detects inconsistent *declared inputs*, not perceptual changes in a generated video. Real video continuity still requires original-source visual comparison and independent human QA. This feature does not run image-to-video inference or imply a rendered film.

Run: `node --test test/shot-continuity.test.mjs`.

**Roadmap:** next wire this manifest to existing `video/cinema-session.mjs` and its persistent review queue, with explicit signed visual QA before a publishable export. Keep original characters unchanged. GPU inference, rights clearance, billing, app deployment, distribution and publishing remain blocked until independently verified and explicitly authorized.

**Governance:** Architect authority, Zero Trust, Guardian Core, Approval Gateway, ProofGraph, Audit Ledger, FREE_ONLY. No Val Town.
