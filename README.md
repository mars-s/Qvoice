# Qvoice

Local voice-to-text for macOS. Double-tap **Control** to start recording, double-tap again to transcribe and paste — all on-device, no cloud, no subscription.

UI inspired by [glass](https://github.com/pickle-com/glass). Transcription powered by [Whisper](https://github.com/openai/whisper) via [faster-whisper](https://github.com/SYSTRAN/faster-whisper).

![macOS](https://img.shields.io/badge/macOS-12%2B-black?logo=apple) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## How it works

1. Double-tap **Control** — glass panel slides in, recording starts
2. Speak
3. Double-tap **Control** again — transcribes locally, pastes wherever your cursor is

The panel shows a live waveform while recording, then the transcribed text briefly before dismissing itself.

## Requirements

- macOS 12+
- [Node.js](https://nodejs.org) 18+
- [Python](https://python.org) 3.12 (via [uv](https://github.com/astral-sh/uv), installed automatically)
- [uv](https://github.com/astral-sh/uv) — `brew install uv`

## Setup

```bash
git clone https://github.com/your-username/qvoice
cd qvoice
bash setup.sh
```

The setup script:
- Creates a Python 3.12 venv and installs `faster-whisper`
- Generates the menu bar icon
- Runs `npm install`

On **first launch**, Whisper downloads the `base.en` model (~140 MB). This is cached — subsequent launches are instant.

## Run

```bash
npm start
```

The app lives in your menu bar as **Q**. No dock icon.

## Permissions

Two macOS permissions are required:

**Accessibility** (for the global double-Control hotkey)
> System Settings → Privacy & Security → Accessibility → add Terminal (or your IDE)

**Microphone** (prompted automatically on first recording)

## Model size

The default model is `base.en` — fast (~2–3s) and good for English. Swap it via env var:

| Model | Size | Speed | Accuracy |
|---|---|---|---|
| `base.en` (default) | 140 MB | ~2–3s | Good |
| `small.en` | 460 MB | ~4–6s | Better |
| `medium.en` | 1.4 GB | ~10s+ | Best |

```bash
QVOICE_MODEL=small.en npm start
```

## Tech stack

| Layer | Technology |
|---|---|
| App shell | [Electron](https://electronjs.org) |
| Global hotkey | [uiohook-napi](https://github.com/SnosMe/uiohook-napi) |
| Transcription | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) |
| Audio format | 16 kHz mono WAV (encoded in-browser, no ffmpeg needed) |
| Paste | AppleScript `System Events` keystroke |

## License

MIT — see [LICENSE](LICENSE).
