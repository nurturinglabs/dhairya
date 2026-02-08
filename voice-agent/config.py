import os
from dotenv import load_dotenv

load_dotenv()

# --- Sarvam AI ---
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")

# --- Realtime transport ---
DAILY_API_KEY = os.getenv("DAILY_API_KEY", "")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "")

# --- Sarvam model IDs ---
STT_MODEL = "saarika:v2.5"
CHAT_MODEL = "sarvam-m"
TTS_MODEL = "bulbul:v3"       # Bulbul V3 for all runtime TTS (#TheMicIsYours contest)
TTS_MODEL_V3 = "bulbul:v3"    # Kept for backward compat with generate_audio.py
TRANSLATE_MODEL = "saaras:v2"

# --- Language ---
LANGUAGE_CODE = "kn-IN"

# --- TTS speakers (Bulbul V3) ---
# V3 speakers: kavya (female), shubh (male)
SPEAKERS = {
    "female": "kavya",
    "male": "shubh",
}

# Per-story voice direction — Bulbul v3 with shubh (male) / kavya (female)
# Survivors: first-person, emotional narration
STORY_VOICE = {
    "story_01_meena":       {"speaker": "kavya", "pace": 0.85, "model": "bulbul:v3"},
    "story_02_raju":        {"speaker": "shubh", "pace": 0.80, "model": "bulbul:v3"},
    "story_03_priya":       {"speaker": "kavya", "pace": 1.00, "model": "bulbul:v3"},
    "story_04_shankarappa": {"speaker": "shubh", "pace": 0.75, "model": "bulbul:v3"},
    "story_05_lakshmi":     {"speaker": "kavya", "pace": 0.85, "model": "bulbul:v3"},
    "story_06_arun":        {"speaker": "shubh", "pace": 0.90, "model": "bulbul:v3"},
    "story_07_saraswati":   {"speaker": "kavya", "pace": 0.85, "model": "bulbul:v3"},
    "story_08_vinay":       {"speaker": "shubh", "pace": 0.95, "model": "bulbul:v3"},
    "story_09_fatima":      {"speaker": "kavya", "pace": 0.85, "model": "bulbul:v3"},
    "story_10_mahesh":      {"speaker": "shubh", "pace": 0.80, "model": "bulbul:v3"},
}

# Celebrities: third-person documentary narration using Bulbul v3 (shubh/kavya)
# Note: Bulbul v3 does NOT support pitch/loudness params — only speaker + pace
# Using natural pace (1.0) to match dashboard voice quality
CELEB_VOICE = {
    "celeb_01_shivarajkumar": {"speaker": "shubh", "pace": 1.0, "model": "bulbul:v3"},
    "celeb_02_yuvraj":        {"speaker": "shubh", "pace": 1.0, "model": "bulbul:v3"},
    "celeb_03_sonali":        {"speaker": "kavya", "pace": 1.0, "model": "bulbul:v3"},
    "celeb_04_manisha":       {"speaker": "kavya", "pace": 1.0, "model": "bulbul:v3"},
    "celeb_05_gautami":       {"speaker": "kavya", "pace": 1.0, "model": "bulbul:v3"},
}

# --- Defaults ---
DEFAULT_TTS_PACE = 0.85
DEFAULT_TTS_PITCH = 0.0
DEFAULT_TTS_LOUDNESS = 1.0

# --- Paths ---
_BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "stories")
STORIES_DIR = _BASE_DIR  # kept for backward compat
SURVIVORS_DIR = os.path.join(_BASE_DIR, "survivors")
CELEBRITIES_DIR = os.path.join(_BASE_DIR, "celebrities")
AUDIO_DIR = os.path.join(_BASE_DIR, "audio")
SURVIVORS_AUDIO_DIR = os.path.join(AUDIO_DIR, "survivors")
CELEBRITIES_AUDIO_DIR = os.path.join(AUDIO_DIR, "celebrities")
