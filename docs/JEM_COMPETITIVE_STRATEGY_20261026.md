# JEM🌼 — COMPETITOR INTELLIGENCE & PRODUCT SUPERIORITY ROADMAP

**Mission:** IC-ASTRA-JEM-COMPETITOR-INTELLIGENCE-20261026-005
**Audit date:** 2026-10-26 | **Founder:** Alexander Romaskevich / RomaskevicH
**Baseline:** Jem FilmFactory + Sprints 004/005, draft PR #4, checked engineering SHA `5c849dd899c85db7c7053d21515e99f18bfd1fee`.
**Directive:** $0 development, no paid model usage, NO Val Town, no auto-merge, no production upload, release requires founder authority.
**Source of truth:** [Machine-readable evidence matrix](../benchmarks/competitors-2026-10-26.json).

## Executive finding

**Jem does not yet outperform leading commercial AI video platforms.** It has verified real 2D procedural MP4 assembly, six-scene deterministic story templates, original offline music and eSpeak speech, and a secure-but-NOT-CONNECTED image-to-video admission boundary. Its mobile PWA currently only storyboards. A genuine reference-conditioned AI animation model and full character continuity are absent.

The crowded competitive market is **two different markets**:

1. **World-class short generative video models:** independent blind I2V preference rankings place MiniMax H3, Gemini Omni 1.1 Flash, Wan 3.0 and Seedance 2.5 near the leaders (positions vary by site and benchmark category). Runway and Kling compete on professional clip quality, direction and branded workflows.
2. **Prompt/brief → professional creative project:** Luma Agents, LTX Studio, Runway Agent+Workflows, Google Flow, invideo AI Agent and Pika already address orchestration, character assets, sound, editing and/or complete social video creation. **A one-prompt-to-film claim alone is NOT a defensible unique selling proposition.**

This is an opportunity to deliver **character-faithful, controllable, verified, educational series production** with measurable whole-film QA, predictable cost and rights-conscious workflow. That combination is a **target hypothesis**, not yet a demonstrated competitor weakness.

## Competitive threat table

| Direct threat | What the provider already offers or claims | Implication for Jem |
| --- | --- | --- |
| **Kling 3.0 / 4.0 Flash** | Kling 3.0 native audio, character-element references, multi-shot and up to 15s; the 4.0 roadmap/limited rollout describes up to 30s, ten keyframes, 15 combined refs, integrated editing and stereo. 4.0 Flash early access started 2026-09-28; availability not confirmed for all customers. | Need an actual reference-preserving model and at least a 30s continuous-scene performance target, not artificial longer MP4 stitching |
| **Runway Gen-4.5 + Act-Two + Workflows** | 2–10s Gen-4.5 shots, performance transfer, separate audio tools and workflows/agents for multi-clip stories | Need true editable scene orchestration and action/lip performance rather than static presets |
| **Google Flow, Veo 3.1 and Gemini Omni** | Prompt + references + Scenebuilder, native sound on supported models, 50 daily Flow free credits advertised. **Veo 3.1 Preview Gemini API discontinued 2026-10-22**; Flow availability is a separate product. | Never pin Jem to one retiring model endpoint; support replaceable providers with no unsupported import or billing |
| **Luma Agents + Ray3 Modify / Ray3.14** | End-to-end creative agent, shared boards, text/image/video/audio/voice and coordination of models. Ray3 Modify supports character references; Ray3.14 produces fast native 1080p but explicitly lacks Character Reference. | Luma is an agentic-film-workflow competitor, not only a generative clip model. Separate capability claims by model |
| **Pika** | Multiple video models plus character/image/audio/music/speech and workflows on one platform | Adding model adapters without a superior complete-film workflow will not differentiate Jem |
| **LTX Studio** | AI storyboards, consistent Elements, model routing, node flows and audio-to-video. On free plan commercial license is excluded | Our differentiator must be higher verifiable consistency, lower total operator work or better original-IP/project ownership |
| **invideo AI** | Agent-routed short-film/social video production, scripted timelines, editing and model aggregation; official Sept 2026 FAQ cites **Elite $1,000/month** | The previously proposed Jem Signature $999 is NOT more expensive than every major competitor. Quality/value and unit economics take priority over price |
| **Adobe Firefly** | Multi-track online video editor, text-based edit and generated footage | Post-production UX is a mandatory capability, not optional polish |
| **Wan 3.0, MiniMax H3, Seedance 2.5** | High-ranked independent image-to-video/with-audio model outputs; scored by human-blind preference (category and leaderboard-dependent) | Benchmark real footage against these exact independent quality leaders, not just established brand names |
| **Sora (retired)** | Web and app discontinued 2026-04-26; API discontinued 2026-09-24 | Do not present Sora as an active model dependency or current service alternative |

Official source links:
- Kling 4.0 comparison (2026-09-30): https://kling.ai/blog/kling-4-vs-3
- Kling 3.0 capabilities: https://kling.ai/quickstart/klingai-video-3-model-user-guide
- Runway Gen-4.5: https://help.runwayml.com/hc/en-us/articles/46974685288467-Creating-with-Gen-4-5
- Runway current pricing: https://runway.com/pricing
- Google Flow product: https://labs.google/fx/tools/flow
- Veo 3.1 Gemini API retirement notice: https://ai.google.dev/gemini-api/docs/veo
- Luma Agents overview: https://lumalabs.ai/learning-hub/the-new-luma-app-creative-multimodal-agent
- Luma Ray3.14 limitations: https://lumalabs.ai/news/ray3_14
- Pika catalog and prices: https://pika.art/pricing
- LTX Studio catalog/prices: https://website.ltx.studio/studio/pricing
- Invideo Sept 2026 pricing note: https://invideo.io/faq/which-invideo-pricing-plan-is-best-for-ai-video-creators/
- Adobe editor: https://helpx.adobe.com/firefly/web/firefly-video-editor/about-firefly-video-editor/about-firefly-video-editor.html
- OpenAI Sora discontinuation: https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
- Independent rankings (not equivalent to whole-movie quality): https://arena.ai/leaderboard/video/image-to-video and https://artificialanalysis.ai/video/leaderboard/image-to-video/

## Proposed defensible Jem advantage — Whole-Film Proof Engine

**North Star:** one story prompt plus consented exact reference photos → an editable, 60-second character-faithful 3D/cartoon film, six to twelve narratively linked scenes, consistent cast, character-locked dialogue/music, language localization, QA report and owner-controlled release. Scale to 5–10 minute episodes after real 60-second success. Expand to longer films only when measured quality/cost justify it.

Build five interlocking capabilities:

1. **IdentityLock + Character Bible:** cryptographically pinned original input asset bytes, revision-controlled appearance sheet, clothing, logos and emotion/pose allowances. Automatically detect drift and **withhold or re-render** compromised shots. Image hashing checks asset identity, not perceptual visual identity; human or independently validated visual metrics are still required.
2. **StoryGraph + Director Planner:** causal beats, scene purpose, world continuity, prop/location ledger, recurring character voice, structured screenplay. A rerender of scene 4 must not corrupt scenes 1–3 or 5–6.
3. **Multi-Engine Rendering:** isolated workers for licensed local generative I2V, rigged 2D fallback when explicitly chosen by owner, animation, TTS, lipsync and FFmpeg. Never silently replace a requested owner-supplied 3D character with generic preset art.
4. **Film QA + Proof Passport:** real decoded MP4, shot-level output receipts, aesthetic/motion/identity scoring, blind human review, per-shot correction loops, deterministic bill of materials. No fabricated “AI film generated” label.
5. **IMPERIAL Kids IP Factory:** original family series franchise with repeatable character designs, EN/UK/RU scripts and human editor approval. No use of recognizable child likenesses without lawful rights and consent; user-supplied posters should not go into public code or remote testing.

## Measured superiority protocol — not a marketing score

Sample benchmark pack: **20 owner-authorized story briefs**, each with the same 1–3 reference images across all tested systems (where tools legally accept them). Six scene prompts per story, equal target aspect ratio, consistent available output and detailed failure logging. If a model doesn't support a requested comparison, mark *INCOMPARABLE*, not “Jem wins.” Run at least three independent blind human evaluations with randomized clip labels.

**Experimental score rubric (proposal only; no competitor measurements have been conducted):**

| Axis | Weight | What to measure |
| --- | ---: | --- |
| Character/design continuity | 35% | Same face/costume/colors/logo/approved accessory across all shots; number of illegal substitutions |
| Genuine motion & visual quality | 25% | Articulation beyond camera pan, physics/artifacts, movement and independent preference |
| Narrative coherence across film | 15% | Causality, story beats, retained scene intent, beginning-middle-end |
| Dialogue/audio synchronization | 10% | Sound and speech clarity, assignment to correct speaker, phoneme alignment vs timestamps |
| Editability, control and recovery | 10% | Correct one-shot re-render, provenance, regeneration of broken segment, recovery after interrupt |
| Measured cost and reproducibility | 5% | Real compute/credits/storage/QA labor per *accepted finished minute*, not per attempt |

**Claim gate:** a benchmarked “better than X at Y” requires identical legitimate user inputs and budgets, real outputs by both products, independently adjudicated results with confidence interval, repeatability, and timestamp/model-version disclosure. “Best worldwide” demands far broader independent cross-market evidence and must not be printed automatically.

### Proposed acceptance thresholds for internal development

- At least **95% of shot outputs** across the test pack retain all mandatory visually significant immutable details **according to blind human QA**; otherwise `REVIEW_REQUIRED`.
- **100% of releases** blocked on missing source rights, model weights/license provenance, owner approval or failing video decode.
- For 20 scripts, **100%** contain beginning, challenge, resolution and a real exported film or a truthful BLOCKED result.
- Each successful film contains **real scene-specific character action**, speech/music tracks with measured sync, correct subtitles, no duplicate/absent frames.
- Before any $999/month customer offer: **blindly validated preference or workflow superiority on at least one commercially important dimension** over paid alternatives and pilot-customer demand for the price.
- No raw mobile device/render feature gets an `IMPLEMENTED` status until real iPhone/iPad/Android hardware smoke tests and a supported deployment path pass.

These are **targets**, not verified Jem accomplishments.

## Engineering priorities (P0 before high-end cosmetic UI)

| Priority | Feature | Next testable milestone |
| --- | --- | --- |
| P0-A | Real open-licensed image-to-video model, local GPU memory test and commercial license review | Real 3–6s reference-subject moving clip with pinning and independently reviewed identity |
| P0-B | Character-identity QA independent from model worker | Visual continuity across 6 generated clips; fail closed on mismatch |
| P0-C | Long-form director and timeline | 60s coherent *generative* film, scene replacement and editable project |
| P1-A | Real speech, phoneme lip sync, RU/UK/EN | No voice impersonation; measured speech timing and semantic speaker mapping |
| P1-B | Multi-device full project | PWA iOS/Android and desktop project load/edit parity with trusted rendering backend |
| P1-C | Economic validation, premium billing | Cost per accepted minute and real paid pilots before price finalization |

## Price position — correction required

The old aspirational pricing ($149 Creator, $399 Studio, **$999 Signature**, Enterprise from $2,499) remains **DRAFT, NOT FOR SALE**. Current benchmark:

- Runway Max **$95/mo monthly** or $76/mo equivalent billed annually.
- Pika Fancy **$95–$880/mo** depending on credits.
- Luma Pro/Plus/Ultra **$30/$90/$300** by its official agent FAQ.
- LTX Studio Lite/Standard/Pro **$12/$28/$100/mo equivalent if billed yearly**.
- Invideo high-volume Elite **$1,000/mo** referenced in its Sept 2026 FAQ; current dynamic site may show different plan names and seat configuration.
- Bespoke Enterprise pricing of multiple vendors is **unknown**.

Thus no universal claim “Jem costs more than the most expensive competitor.” The market already sells at similar/high subscription values without requiring users to pay a 3D-feature-film premium. We should validate **gross margin, reliability, differentiated outcome and willingness to pay**, then decide price. Compute use on a low-memory GPU may be insufficient for high-quality commercial I2V; the $0 development constraint remains and does **not** mean free cost per delivered customer minute.

## Next branch/owner policy

No real paid service, network injection, private asset upload, model download or GitHub merge is authorized by competitor research alone. Competitor research and scorecard may be published in Jem source; separate security approval, owner release and lawful media rights required for output distribution.

**Build Movies. Preserve Characters. Prove Superiority.**
