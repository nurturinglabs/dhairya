"""
Pre-generate Kannada audio for Dhairya stories using Sarvam Bulbul TTS.

Usage:
    python voice-agent/generate_audio.py                        # generate all
    python voice-agent/generate_audio.py --category survivors   # survivors only
    python voice-agent/generate_audio.py --category celebrities # celebrities only
    python voice-agent/generate_audio.py --category all         # both (default)
    python voice-agent/generate_audio.py --story 1              # only story #1 (survivors)
    python voice-agent/generate_audio.py --force                # overwrite existing files
"""

import os
import sys
import re
import io
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
    STORY_VOICE,
    CELEB_VOICE,
    DEFAULT_TTS_PITCH,
    DEFAULT_TTS_LOUDNESS,
)
from story_engine import load_all_survivors, load_all_celebrities, Story


def _split_into_chunks(text: str, max_chars: int = 400) -> list[str]:
    """Split Kannada text into chunks of at most max_chars, breaking at sentence boundaries.

    Kannada sentences end with '.' or '।'. We split on those, then group
    consecutive sentences into chunks that fit within the character limit.
    """
    # Split on sentence-ending punctuation, keeping the delimiter
    sentences = re.split(r'(?<=[.।?!])\s+', text.strip())
    # Also split on newlines (paragraph breaks)
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

    # Safety: if any single chunk is still too long, hard-split it
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
    """Properly merge multiple WAV audio chunks into a single valid WAV file.

    Each TTS response returns a complete WAV file. Simply concatenating raw bytes
    creates an invalid file where only the first chunk plays. This function strips
    the WAV headers from each chunk, combines the PCM data, and writes a single
    proper WAV with the correct total length.
    """
    if not chunks_b64:
        return b""

    decoded = [base64.b64decode(c) for c in chunks_b64]

    # Read WAV params from first chunk and collect all PCM frames
    all_frames = b""
    params = None
    for chunk_bytes in decoded:
        buf = io.BytesIO(chunk_bytes)
        with wave.open(buf, "rb") as w:
            if params is None:
                params = w.getparams()
            all_frames += w.readframes(w.getnframes())

    # Write a single combined WAV
    output = io.BytesIO()
    with wave.open(output, "wb") as w:
        w.setparams(params)
        w.writeframes(all_frames)

    return output.getvalue()


def generate_story_audio(client: SarvamAI, story: Story, force: bool = False) -> str:
    """Generate a .wav file for a single story. Returns the output path."""
    output_path = story.audio_path
    if os.path.exists(output_path) and not force:
        print(f"  Skipping {story.id} — audio already exists. Use --force to overwrite.")
        return output_path

    # Look up voice direction from the appropriate config
    if story.category == "celebrity":
        voice = CELEB_VOICE.get(story.id, {})
    else:
        voice = STORY_VOICE.get(story.id, {})
    speaker = voice.get("speaker", "anushka")
    pace = voice.get("pace", 0.85)
    pitch = voice.get("pitch", DEFAULT_TTS_PITCH)
    loudness = voice.get("loudness", DEFAULT_TTS_LOUDNESS)
    model = voice.get("model", TTS_MODEL)  # Per-story model override (v3 for celebs)

    print(f"  Generating audio for {story.id} (model={model}, speaker={speaker}, pace={pace}, pitch={pitch}, loudness={loudness})...")

    # Bulbul TTS has a character limit per request (~500 chars).
    # Split story into small chunks (1-2 sentences each) to avoid truncation.
    chunks = _split_into_chunks(story.kannada_text, max_chars=400)

    print(f"    Split into {len(chunks)} chunks")

    audio_chunks_b64 = []
    is_v3 = "v3" in model
    for i, chunk in enumerate(chunks):
        tts_kwargs = dict(
            text=chunk,
            target_language_code=LANGUAGE_CODE,
            model=model,
            speaker=speaker,
            pace=pace,
            enable_preprocessing=True,
        )
        # Bulbul v3 does not support pitch/loudness
        if not is_v3:
            tts_kwargs["pitch"] = pitch
            tts_kwargs["loudness"] = loudness
        response = client.text_to_speech.convert(**tts_kwargs)
        if hasattr(response, "audios") and response.audios:
            audio_chunks_b64.append(response.audios[0])
        print(f"    Chunk {i + 1}/{len(chunks)} done ({len(chunk)} chars)")
        time.sleep(0.3)  # small delay to avoid rate limiting

    # Properly merge WAV chunks into one valid WAV file
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
    print(f"  Saved: {output_path} ({size_kb:.0f} KB, {duration_s:.1f}s)")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Generate Dhairya story audio via Sarvam Bulbul TTS")
    parser.add_argument("--category", choices=["survivors", "celebrities", "all"], default="all",
                        help="Which category to generate (default: all)")
    parser.add_argument("--story", type=int, help="Generate only this story number (within the category)")
    parser.add_argument("--force", action="store_true", help="Overwrite existing audio files")
    args = parser.parse_args()

    if not SARVAM_API_KEY:
        print("Error: SARVAM_API_KEY not set. Copy .env.example to .env and add your key.")
        sys.exit(1)

    client = SarvamAI(api_subscription_key=SARVAM_API_KEY)

    # Load stories based on category
    stories = []
    if args.category in ("survivors", "all"):
        stories.extend(load_all_survivors())
    if args.category in ("celebrities", "all"):
        stories.extend(load_all_celebrities())

    if args.story:
        stories = [s for s in stories if s.number == args.story]
        if not stories:
            print(f"Error: Story #{args.story} not found in category '{args.category}'.")
            sys.exit(1)

    print(f"Generating audio for {len(stories)} stories (category: {args.category})...\n")

    for story in stories:
        label = "survivor" if story.category == "survivor" else "celebrity"
        total = 10 if label == "survivor" else 5
        print(f"[{label} {story.number}/{total}] {story.title_english or story.name_english}")
        generate_story_audio(client, story, force=args.force)
        print()

    print("Done! Audio files are in stories/audio/survivors/ and stories/audio/celebrities/")


if __name__ == "__main__":
    main()
