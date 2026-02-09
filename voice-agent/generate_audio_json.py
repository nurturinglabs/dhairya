"""
Pre-generate Kannada audio from a JSON stories file using Sarvam Bulbul TTS.

This is the JSON counterpart of generate_audio.py (which reads markdown files).
Use this when stories are stored as a JSON array with a `story_text` field.

Usage:
    python voice-agent/generate_audio_json.py                                           # generate all
    python voice-agent/generate_audio_json.py --input stories/my_stories.json           # custom JSON
    python voice-agent/generate_audio_json.py --category bharatada_spoorthi             # one category
    python voice-agent/generate_audio_json.py --id sanjay_dutt                          # single story
    python voice-agent/generate_audio_json.py --speaker kavya --pace 0.9                # override voice
    python voice-agent/generate_audio_json.py --force                                   # overwrite existing
    python voice-agent/generate_audio_json.py --dry-run                                 # preview without calling TTS

Expected JSON format:
    {
      "category_name": [
        { "id": "story_id", "name_en": "Name", "story_text": "ಕನ್ನಡ ಪಠ್ಯ...", ... },
        ...
      ],
      ...
    }
"""

import os
import sys
import re
import io
import json
import wave
import argparse
import base64
import time

from sarvamai import SarvamAI

# Allow running from project root or from voice-agent/
sys.path.insert(0, os.path.dirname(__file__))

from config import (
    SARVAM_API_KEY,
    TTS_MODEL,
    LANGUAGE_CODE,
    AUDIO_DIR,
)

# ─── Default JSON path ────────────────────────────────────────────────
DEFAULT_JSON = os.path.join(
    os.path.dirname(__file__), "..", "stories", "dhairya_27_stories_data.json"
)

# ─── Per-story voice overrides (optional) ─────────────────────────────
# Key = story id from JSON. If not listed, defaults apply.
# Only speaker and pace are supported on Bulbul V3.
VOICE_OVERRIDES = {
    # bharatada_spoorthi — Indian celebrities
    "sanjay_dutt":        {"speaker": "shubh",  "pace": 1.0},
    "lisa_ray":           {"speaker": "kavya",  "pace": 1.0},
    "tahira_kashyap":     {"speaker": "kavya",  "pace": 1.0},
    "rakesh_roshan":      {"speaker": "shubh",  "pace": 1.0},
    "anurag_basu":        {"speaker": "shubh",  "pace": 1.0},
    "mumtaz":             {"speaker": "kavya",  "pace": 1.0},
    "chhavi_mittal":      {"speaker": "kavya",  "pace": 1.0},
    "mahima_chaudhry":    {"speaker": "kavya",  "pace": 1.0},
    "nafisa_ali":         {"speaker": "kavya",  "pace": 1.0},
    "manisha_koirala_v2": {"speaker": "kavya",  "pace": 1.0},
    # vishwa_spoorthi — International celebrities
    "robert_deniro":      {"speaker": "shubh",  "pace": 1.0},
    "michael_douglas":    {"speaker": "shubh",  "pace": 1.0},
    "ben_stiller":        {"speaker": "shubh",  "pace": 1.0},
    "mark_ruffalo":       {"speaker": "shubh",  "pace": 1.0},
    "christina_applegate": {"speaker": "kavya", "pace": 1.0},
    "sheryl_crow":        {"speaker": "kavya",  "pace": 1.0},
    "fran_drescher":      {"speaker": "kavya",  "pace": 1.0},
    "robin_roberts":      {"speaker": "kavya",  "pace": 1.0},
    "sharon_osbourne":    {"speaker": "kavya",  "pace": 1.0},
    "rod_stewart":        {"speaker": "shubh",  "pace": 1.0},
    "kylie_minogue":      {"speaker": "kavya",  "pace": 1.0},
    "martina_navratilova": {"speaker": "kavya", "pace": 1.0},
    "mr_t":               {"speaker": "shubh",  "pace": 1.0},
    "kathy_bates":        {"speaker": "kavya",  "pace": 1.0},
    "sofia_vergara":      {"speaker": "kavya",  "pace": 1.0},
    "cynthia_nixon":      {"speaker": "kavya",  "pace": 1.0},
    "jeff_bridges":       {"speaker": "shubh",  "pace": 1.0},
    "michael_c_hall":     {"speaker": "shubh",  "pace": 1.0},
}

DEFAULT_SPEAKER = "kavya"
DEFAULT_PACE = 1.0


# ─── Reusable TTS helpers (same logic as generate_audio.py) ──────────

def _split_into_chunks(text: str, max_chars: int = 400) -> list[str]:
    """Split Kannada text at sentence boundaries, max_chars per chunk."""
    sentences = re.split(r'(?<=[.।?!])\s+', text.strip())
    expanded = []
    for s in sentences:
        parts = [p.strip() for p in s.split("\n") if p.strip()]
        expanded.extend(parts)

    chunks = []
    current = ""
    for sentence in expanded:
        if not sentence:
            continue
        if current and len(current) + len(sentence) + 1 > max_chars:
            chunks.append(current.strip())
            current = sentence
        else:
            current = current + " " + sentence if current else sentence
    if current.strip():
        chunks.append(current.strip())

    final = []
    for chunk in chunks:
        if len(chunk) <= max_chars:
            final.append(chunk)
        else:
            for i in range(0, len(chunk), max_chars):
                part = chunk[i:i + max_chars].strip()
                if part:
                    final.append(part)
    return final


def _merge_wav_chunks(chunks_b64: list[str]) -> bytes:
    """Merge multiple base64-encoded WAV chunks into a single WAV file."""
    if not chunks_b64:
        return b""

    decoded = [base64.b64decode(c) for c in chunks_b64]
    all_frames = b""
    params = None
    for chunk_bytes in decoded:
        buf = io.BytesIO(chunk_bytes)
        with wave.open(buf, "rb") as w:
            if params is None:
                params = w.getparams()
            all_frames += w.readframes(w.getnframes())

    output = io.BytesIO()
    with wave.open(output, "wb") as w:
        w.setparams(params)
        w.writeframes(all_frames)
    return output.getvalue()


# ─── JSON loading ─────────────────────────────────────────────────────

def load_json_stories(json_path: str, category: str | None = None) -> list[tuple[str, dict]]:
    """Load stories from JSON. Returns list of (category_name, story_dict) tuples."""
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    results = []
    for cat_name, stories in data.items():
        if category and cat_name != category:
            continue
        for story in stories:
            results.append((cat_name, story))
    return results


# ─── Audio generation ─────────────────────────────────────────────────

def generate_audio_for_story(
    client: SarvamAI,
    category: str,
    story: dict,
    output_dir: str,
    speaker_override: str | None = None,
    pace_override: float | None = None,
    force: bool = False,
    dry_run: bool = False,
) -> str:
    """Generate a .wav file for a single JSON story entry. Returns output path."""
    story_id = story["id"]
    text = story["story_text"]
    name = story.get("name_en", story_id)

    output_path = os.path.join(output_dir, category, f"{story_id}.wav")

    if os.path.exists(output_path) and not force:
        print(f"  Skipping {story_id} — audio exists. Use --force to overwrite.")
        return output_path

    # Resolve voice settings: CLI override > per-story config > defaults
    voice_cfg = VOICE_OVERRIDES.get(story_id, {})
    speaker = speaker_override or voice_cfg.get("speaker", DEFAULT_SPEAKER)
    pace = pace_override or voice_cfg.get("pace", DEFAULT_PACE)

    chunks = _split_into_chunks(text, max_chars=400)

    print(f"  [{category}] {name} ({story_id})")
    print(f"    speaker={speaker}, pace={pace}, chunks={len(chunks)}, chars={len(text)}")

    if dry_run:
        print(f"    [dry-run] Would generate → {output_path}")
        return output_path

    audio_chunks_b64 = []
    for i, chunk in enumerate(chunks):
        response = client.text_to_speech.convert(
            text=chunk,
            target_language_code=LANGUAGE_CODE,
            model=TTS_MODEL,
            speaker=speaker,
            pace=pace,
            enable_preprocessing=True,
        )
        if hasattr(response, "audios") and response.audios:
            audio_chunks_b64.append(response.audios[0])
        print(f"    Chunk {i + 1}/{len(chunks)} done ({len(chunk)} chars)")
        time.sleep(0.3)

    combined = _merge_wav_chunks(audio_chunks_b64)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(combined)

    size_kb = len(combined) / 1024
    duration_s = 0
    try:
        with wave.open(io.BytesIO(combined), "rb") as w:
            duration_s = w.getnframes() / w.getframerate()
    except Exception:
        pass
    print(f"    Saved: {output_path} ({size_kb:.0f} KB, {duration_s:.1f}s)")
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Generate Dhairya story audio from JSON using Sarvam Bulbul TTS"
    )
    parser.add_argument(
        "--input", default=DEFAULT_JSON,
        help=f"Path to JSON stories file (default: {DEFAULT_JSON})"
    )
    parser.add_argument(
        "--category",
        help="Only generate for this JSON category key (e.g. bharatada_spoorthi)"
    )
    parser.add_argument(
        "--id",
        help="Only generate for this story ID (e.g. sanjay_dutt)"
    )
    parser.add_argument("--speaker", help="Override speaker for all stories (kavya or shubh)")
    parser.add_argument("--pace", type=float, help="Override pace for all stories (0.5-2.0)")
    parser.add_argument("--force", action="store_true", help="Overwrite existing audio files")
    parser.add_argument("--dry-run", action="store_true", help="Preview without calling TTS API")
    parser.add_argument(
        "--output-dir", default=AUDIO_DIR,
        help=f"Base output directory for audio (default: {AUDIO_DIR})"
    )
    args = parser.parse_args()

    if not args.dry_run and not SARVAM_API_KEY:
        print("Error: SARVAM_API_KEY not set. Copy .env.example to .env and add your key.")
        sys.exit(1)

    if not os.path.exists(args.input):
        print(f"Error: JSON file not found: {args.input}")
        sys.exit(1)

    entries = load_json_stories(args.input, category=args.category)

    if args.id:
        entries = [(cat, s) for cat, s in entries if s["id"] == args.id]
        if not entries:
            print(f"Error: Story ID '{args.id}' not found in {args.input}")
            sys.exit(1)

    print(f"JSON source: {args.input}")
    print(f"Stories to generate: {len(entries)}")
    print(f"Output directory: {args.output_dir}")
    print()

    client = None
    if not args.dry_run:
        client = SarvamAI(api_subscription_key=SARVAM_API_KEY)

    success = 0
    failed = 0
    for i, (cat, story) in enumerate(entries, 1):
        print(f"[{i}/{len(entries)}]")
        try:
            generate_audio_for_story(
                client=client,
                category=cat,
                story=story,
                output_dir=args.output_dir,
                speaker_override=args.speaker,
                pace_override=args.pace,
                force=args.force,
                dry_run=args.dry_run,
            )
            success += 1
        except Exception as e:
            print(f"    ERROR: {e}")
            failed += 1
        print()

    print(f"Done! {success} succeeded, {failed} failed.")
    print(f"Audio files are in {args.output_dir}/<category>/")


if __name__ == "__main__":
    main()
