<p align="center"><img src="assets/jem-flower.svg" alt="Jem flower" width="120"></p>

# Jem🌼 — Start Here

**AI Cartoon & Animation Studio** · An IMPERIAL Core project by Alexander Romaskevich (RomaskevicH)

Jem is being developed as a creative studio for turning stories and character references into animated films. The current tested laboratory is a starting point for that vision.

## What exists today

The default branch contains project documentation. The working laboratory is in draft development branches:

- A local desktop renderer creates a real H.264 MP4 from an image and a storyboard, using camera movement, cuts and fades. It does **not** create articulated character motion or generative video.
- A portable storyboard client can plan scenes and hash a reference image on-device; it does not render MP4 on a phone.
- The latest reference-integrity change pins the same original image bytes for every rendered shot and removes its temporary snapshot after a completed or failed render. A hash proves input-byte consistency, not visual identity in a generated clip.

The local FFmpeg prototype passed 19 contract and UI tests and 4 real-media tests on 29 October 2026, including a 60-second, 480-frame video. See the [reference-integrity change and verification](https://github.com/oromaskevic23-cmd/Jem-/pull/10) and its [GitHub Actions run](https://github.com/oromaskevic23-cmd/Jem-/actions/runs/40943632381). Results apply to the specific development commit, not a deployed service.

## Try the local laboratory

Install Node.js 22+ and FFmpeg/FFprobe with the `libx264` encoder. No paid service or API key is required.

```bash
git clone https://github.com/oromaskevic23-cmd/Jem-.git
cd Jem-
git checkout fix/character-reference-c56c80854e
npm run verify
npm start
```

Open `http://127.0.0.1:8765` on the same computer. Supply a story and a PNG/JPEG reference you have permission to use. The browser interface generates a local camera-motion video; it does not animate facial expressions or speech.

## Development path

1. Improve input integrity, deterministic storyboards and export verification.
2. Add opt-in local image-to-video inference with a pinned, licensed model and isolated execution.
3. Evaluate character continuity across generated shots using independent human review.
4. Add sound, dialogue, consent controls and production-ready delivery only after they are implemented and tested.

The [Sprint 009 draft](https://github.com/oromaskevic23-cmd/Jem-/pull/8) and [reference-integrity draft](https://github.com/oromaskevic23-cmd/Jem-/pull/10) are part of a stack of unmerged changes. No paid subscription, public deployment, generative video capability or competitive-superiority claim is implied.
