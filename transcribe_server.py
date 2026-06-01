#!/usr/bin/env python3
"""
Persistent Whisper transcription server.
Reads JSON lines from stdin, writes JSON lines to stdout.
Keeps the model loaded between requests for fast transcription.
"""
import sys
import json
import os

MODEL_SIZE = os.environ.get("QVOICE_MODEL", "base.en")

print(f"Loading Whisper model '{MODEL_SIZE}'...", file=sys.stderr, flush=True)

from faster_whisper import WhisperModel

model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

print("Model ready.", file=sys.stderr, flush=True)
print(json.dumps({"status": "ready"}), flush=True)

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        audio_path = req["audio_path"]

        segments, _ = model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 300},
        )
        text = " ".join(seg.text.strip() for seg in segments).strip()
        print(json.dumps({"status": "ok", "text": text}), flush=True)

    except Exception as exc:
        print(json.dumps({"status": "error", "error": str(exc)}), flush=True)
