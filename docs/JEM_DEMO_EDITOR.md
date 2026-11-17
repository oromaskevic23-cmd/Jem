# Jem local demo editor

Jem can assemble a short demo from MP4 screen recordings supplied by the
operator, optionally add one WAV narration track, and write a separate SRT
caption file. FFmpeg produces the video locally; the tool does not record a
screen, generate a voice, contact a model, upload, or publish. Project owner:
Alexander Nikolaevich Romaskevich.

The editor snapshots each input and records its SHA-256 in `demo-evidence.json`.
It normalizes every shot to the selected 16:9 canvas without cropping source
content, joins the clips, and checks H.264 codec, dimensions, frame count and
duration. Captions are a separate file; they are not burned into the video.
Source clip audio is removed; provide a WAV narration track if audio is needed.
Process only trusted local media: the editor does not provide an operating-system
sandbox for FFmpeg or perform independent content and rights verification.

## Usage

Use Node.js 22+, FFmpeg with libx264, and FFprobe. Prepare an ordinary JSON
manifest with absolute paths to locally recorded MP4 clips. Each selected range
must fit inside its source. The operator is responsible for using footage,
narration and music they are allowed to use.

```json
{
  "clips": [
    {"path": "/absolute/path/recording.mp4", "startSec": 0, "durationSec": 8},
    {"path": "/absolute/path/second.mp4", "startSec": 2, "durationSec": 8}
  ],
  "captions": [
    {"startMs": 0, "endMs": 5000, "text": "A real problem and a verifiable demonstration."}
  ],
  "narrationPath": "/absolute/path/narration.wav",
  "rightsDeclaration": "I_CONFIRM_AUTHORIZATION_FOR_ALL_INPUTS",
  "width": 1280,
  "height": 720,
  "fps": 24
}
```

Omit `narrationPath` for a silent video and omit `captions` when none are
available. The explicit rights declaration is required; it is recorded as an
operator assertion, not verified legal evidence. The editor creates a new
private subdirectory under the output path.

```sh
npm run demo:assemble -- --manifest /absolute/path/demo.json --output /absolute/path/output
npm run demo:test
```

The report describes byte and media checks. It does not establish legal rights,
accuracy of claims in a recording, independent visual review, audience
acceptance, competition submission, or permission to publish. The 300-second
and 12-clip processing bounds are Jem implementation limits, not a competition
requirement. Do not depict synthetic tests as customer results or a deployed
service. Review the current organizer instructions before preparing the final
submission.
