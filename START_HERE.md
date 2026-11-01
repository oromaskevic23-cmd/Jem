# Jem🌼 — Start Here

The supported source baseline is now **main** rather than an unmerged lab branch. Main incorporates the historically reviewed prototype media implementation from draft branch `fix/character-reference-c56c80854e` without deleting the existing draft branches or altering their commit records.

This is a **local research and engineering source release**, not a production cloud service or native mobile app.

## Requirements

- Node.js 22+.
- FFmpeg + FFprobe, installed and licensed on the operator machine, with H.264/libx264 encoder.
- Optional eSpeak NG if running synthesized voice tests.
- Your own original or appropriately licensed PNG/JPEG input for camera-motion rendering.

## Commands

~~~shell
git clone https://github.com/oromaskevic23-cmd/Jem.git
cd Jem
npm run verify
npm run originals:verify
npm run factory:verify
npm run cinema:verify
npm start
~~~

Visit `http://127.0.0.1:8765`. The local preview PWA can be served by `npm run preview:pwa` at `http://127.0.0.1:8766`. The PWA does not produce iOS/Android native binaries or render MP4 on a phone.

## Truthful output descriptions

- **Camera motion**: FFmpeg moves the virtual camera over a pinned still image. It is not generative actor movement.
- **Procedural 2D**: original drawn cartoon rigs can animate body parts and faces in controlled templates.
- **Local I2V model**: no independently licensed, provisioned GPU/weights/runtime on this main deployment; no claim of actual model inference.
- **CharacterLock**: hashes and signed review protect asset provenance, not automatic visual recognition.
- **Publication & monetization**: denied until rights, safety, Owner Approval and delivery checks are satisfied.

See [engineering architecture](docs/JEM_ENTERPRISE_ARCHITECTURE.md), [release gates](docs/JEM_ENTERPRISE_RELEASE_GATES.md), [draft provenance](docs/JEM_DRAFT_INTEGRATION_20261101.md) and [top-level license](LICENSE).
