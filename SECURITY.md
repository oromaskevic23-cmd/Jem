# Jem🌼 Security Policy — Enterprise FilmFactory

Jem is a local media research studio. Do not report source-level CI as a deployed secure cloud service.

## Engineering trust boundaries

- Deny external model execution and publication by default. The local Node browser/server binds to 127.0.0.1 only.
- Media uploads require strict JPEG/PNG validation, size/dimension limits, FFprobe inspection and bounded FFmpeg rendering.
- For browser requests, use same-origin validation. No cross-origin upload API or publicly exposed callback endpoint.
- CharacterLock reference hashes pin exact input bytes. They never prove perceptual identity or lawful likeness consent.
- Human review signatures are cryptographic evidence of signed review ONLY, not an entitlement, platform authorization or professional QA credential.
- No private images, voice samples, wallet keys, Supabase service-role credentials or Owner Ed25519 keys in public source or CI.
- Use no custom proprietary model weights or bundled third-party codecs without verifying license scope and attribution.
- Owner Kill Switch, Guardian Core, Approval Gateway, AI Passport, Audit Ledger, Zero Trust, Public/Private Boundary, CRYPTO IMPERIAL Ecosystem Boundary apply to any future agent runtime.
- Uploaded photographs, actor likenesses, children and voices must be used only with appropriate authority and consent.

## Disclosure

Report vulnerabilities privately using GitHub Security Advisories. Do not post user media, personal data, secrets, bypass payloads or security-sensitive logs in public issues.

## Release

Every feature remains in local research unless independently verified against the documented release gates. Production publishing, payments, distribution and external model calls remain forbidden from this package.
