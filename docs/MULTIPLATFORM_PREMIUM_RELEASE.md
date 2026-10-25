# Jem🌼 — Multi-Device Distribution & Premium Product

**Mission:** IC-JEM-MULTIPLATFORM-COMMERCIAL-20261025-002
**Owner:** Alexander Romaskevich / RomaskevicH / IMPERIAL Core
**Release state:** Draft PR; NOT DEPLOYED; payment checkout DISABLED.

## Device coverage

| Target | Implemented in v0.2 code | Not yet verified |
| --- | --- | --- |
| iPhone / iPad | Responsive portable PWA with local photo hashing, storyboard planning, iOS home-screen metadata | Actual iPhone/iPad tests, hosted HTTPS URL, signed native iOS app |
| Android phone / tablet | Responsive PWA, 192px and 512px install icons, offline shell, exported scene JSON | Physical-device Android installation and Play Store APK/AAB |
| Windows | Portable web interface; separate FFmpeg desktop MP4 compositor | Signed desktop installer, unified local rendering backend |
| macOS | Portable web interface; separate FFmpeg desktop MP4 compositor | macOS native app, notarization |
| Linux | Portable web interface; separate FFmpeg desktop MP4 compositor | Native packages |

**Portable PWA (v0.2 lab):** Offline prompt+photo storyboard; original image SHA-256; JSON project export. On phones and tablets **video generation and MP4 export are NOT IMPLEMENTED**. PWA uses on-device browser crypto and never uploads the photo.

**Desktop v0.1 lab:** Actual Node+FFmpeg MP4 video, 60 seconds, with camera pans, zooms and fades. **No generated character action, gestures, speech or scene-to-scene AI continuity**.

One project means unified standards and progressive sharing of story/character assets across supported platforms, not the false claim that every rendering feature already runs on every device.

## Try the portable edition locally

Install Node 22+ on a desktop machine and run:

    npm run preview:pwa

Then visit http://127.0.0.1:8766 in the desktop browser. This is a **local preview**, not a public deployment. To enable installation on iPhone, iPad or Android, publish the static pwa directory under an **owner-approved HTTPS URL**. On iOS use Safari > Share > Add to Home Screen; on Android use your browser's Install app or Add to Home Screen command, when offered.

No native .ipa, .apk, .aab, .dmg or .exe packages were produced. Native store launch, policies, developer account fees and approval require separate owner authorization. Development remains FREE_ONLY ($0); an Apple Developer subscription is not authorized under that restriction.

## Founder-directed commercial positioning

The released customer product shall eventually be a **paid premium studio**. Benchmark its performance against leaders before launching prices.

| Proposed plan | Proposed monthly price USD | Status |
| --- | --- | --- |
| Creator | $149 | DRAFT, NOT FOR SALE |
| Studio | $399 | DRAFT, NOT FOR SALE |
| Signature (flagship) | **$999** | DRAFT, NOT FOR SALE |
| Enterprise | From $2,499 | DRAFT, NOT FOR SALE |

At the October 25, 2026 comparison checkpoint, Runway's official Max monthly plan was **$95** and Pika's published Fancy plans reached **$880/month**. Jem's proposed Signature $999/mo exceeds these published self-service tiers, **not** unknown custom enterprise contracts. Market leadership is not established solely by charging more.

Official sources: https://runway.com/pricing and https://pika.art/pricing

The pricing proposal is stored in commerce/pricing.proposal.json. It is **not** an order form. No payments have been processed, no customer subscription is active, and no payment backend exists. In particular, an offline PWA cannot serve as a trustworthy paid-license enforcement boundary.

### Commercial gates — must PASS before subscriptions

1. Actual generative image-to-video character actions, not photo camera-motion.
2. Complete 60-second coherent cartoon, articulated motion, dialogue/lip sync and consistent characters verified independently.
3. Fair side-by-side Runway/Pika/Luma comparison with identical reference images, prompt, duration and realistic hardware/cost conditions.
4. Real measured inference cost, cloud/on-device compute, storage, margin and support budget.
5. Secure payment account, verified settlement webhooks, server-issued account entitlements, idempotency, refunds/cancellation and audit.
6. Legal review of iOS and Google Play digital content payment policies, taxes, commercial licensing and rights to uploaded media.
7. Owner security, legal, operational and production deployment approval.

Until these gates pass, Jem should advertise no active paid plans and should collect no money.

## Next engineering steps

- Installable HTTPS PWA deployment, device emulation and real device testing with owner approval.
- Shared photo/character/project artifact format and zero-trust synchronization.
- Native iOS/Android wrappers only when genuinely needed, safe and approved.
- Secure portable rendering architecture: desktop local GPU/CPU node or authenticated trusted render worker, never unauthenticated public FFmpeg endpoints.
- Real AI character animation model, signed model weights and image consistency benchmarks.
- Server-side payment integration only after product quality and service maturity are independently proven.

**Founder strategy:** build a better integrated filmmaking product first; justify premium pricing with quality and customer value. No artificial superiority claims.
