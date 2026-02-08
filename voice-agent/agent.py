"""
Dhairya Voice Agent — Main Pipecat pipeline.

Pipeline: Audio In (VAD) → Saarika STT → Sarvam-M Chat → Bulbul TTS → Audio Out

Supports three modes:
  1. ಕಥೆ ಕೇಳಿ  — Play a pre-generated survivor story
  2. ನನ್ನ ಮಾತು ಕೇಳಿ — Empathetic conversation
  3. ಧೈರ್ಯ ಕೊಡಿ — Affirmation / encouragement

Usage:
    python voice-agent/agent.py
"""

import os
import sys
import asyncio
import base64

from sarvamai import SarvamAI

sys.path.insert(0, os.path.dirname(__file__))

from config import (
    SARVAM_API_KEY,
    DAILY_API_KEY,
    STT_MODEL,
    CHAT_MODEL,
    TTS_MODEL,
    LANGUAGE_CODE,
    SPEAKERS,
    DEFAULT_TTS_PACE,
    DEFAULT_TTS_PITCH,
    DEFAULT_TTS_LOUDNESS,
)
from prompts import DHAIRYA_SYSTEM_PROMPT, AFFIRMATION_SYSTEM_PROMPT, WELCOME_MESSAGE
from story_engine import get_stories, get_random_story, has_audio

# ---------------------------------------------------------------------------
# Keyword detection helpers
# ---------------------------------------------------------------------------

STORY_TRIGGERS = ["ಕಥೆ", "ಕಥೆ ಹೇಳಿ", "ಕಥೆ ಕೇಳಿ", "story"]
COURAGE_TRIGGERS = ["ಧೈರ್ಯ", "ಧೈರ್ಯ ಕೊಡಿ", "courage", "affirmation"]


def detect_mode(text: str) -> str:
    """Detect which mode the user is requesting based on keywords."""
    text_lower = text.lower().strip()
    for trigger in STORY_TRIGGERS:
        if trigger in text_lower:
            return "story"
    for trigger in COURAGE_TRIGGERS:
        if trigger in text_lower:
            return "courage"
    return "conversation"


# ---------------------------------------------------------------------------
# Core pipeline functions (Sarvam API wrappers)
# ---------------------------------------------------------------------------

def transcribe(client: SarvamAI, audio_bytes: bytes) -> str:
    """Convert speech to text using Saarika STT."""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = client.speech_to_text.transcribe(
            file=open(tmp_path, "rb"),
            model=STT_MODEL,
            language_code=LANGUAGE_CODE,
        )
        return result.transcript
    finally:
        os.unlink(tmp_path)


def chat(client: SarvamAI, messages: list[dict]) -> str:
    """Get a response from Sarvam-M chat model."""
    response = client.chat.completions(
        model=CHAT_MODEL,
        messages=messages,
    )
    return response.choices[0].message.content


def synthesize(client: SarvamAI, text: str, speaker: str = "anushka",
               pace: float = DEFAULT_TTS_PACE) -> bytes:
    """Convert text to speech using Bulbul TTS. Returns raw audio bytes."""
    response = client.text_to_speech.convert(
        text=text,
        target_language_code=LANGUAGE_CODE,
        model=TTS_MODEL,
        speaker=speaker,
        pitch=DEFAULT_TTS_PITCH,
        pace=pace,
        loudness=DEFAULT_TTS_LOUDNESS,
        enable_preprocessing=True,
    )
    if hasattr(response, "audios") and response.audios:
        return base64.b64decode(response.audios[0])
    return b""


# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------

class DhairyaSession:
    """Holds per-session conversation state."""

    def __init__(self):
        self.messages: list[dict] = [
            {"role": "system", "content": DHAIRYA_SYSTEM_PROMPT}
        ]
        self.stories_heard: list[str] = []
        self.mode: str = "conversation"  # conversation | story | courage

    def add_user_message(self, text: str):
        self.messages.append({"role": "user", "content": text})

    def add_assistant_message(self, text: str):
        self.messages.append({"role": "assistant", "content": text})

    def switch_to_affirmation(self):
        """Swap system prompt to affirmation mode."""
        self.messages[0] = {"role": "system", "content": AFFIRMATION_SYSTEM_PROMPT}
        self.mode = "courage"

    def switch_to_conversation(self):
        """Swap back to empathetic companion mode."""
        self.messages[0] = {"role": "system", "content": DHAIRYA_SYSTEM_PROMPT}
        self.mode = "conversation"


# ---------------------------------------------------------------------------
# Main agent loop (console-based for local testing)
# ---------------------------------------------------------------------------

async def handle_turn(client: SarvamAI, session: DhairyaSession, user_text: str) -> str:
    """Process one conversational turn and return the assistant's response text."""
    mode = detect_mode(user_text)

    if mode == "story":
        stories = get_stories()
        story = get_random_story(stories, exclude_ids=session.stories_heard)
        session.stories_heard.append(story.id)

        if has_audio(story):
            return f"[PLAY_AUDIO:{story.audio_path}] {story.title_kannada}"

        # If no pre-generated audio, respond with the story text for live TTS
        intro = f"ಈ ಕಥೆ {story.name_kannada} ಅವರದ್ದು.\n\n"
        return intro + story.kannada_text

    if mode == "courage":
        session.switch_to_affirmation()
        session.add_user_message(user_text)
        response_text = chat(client, session.messages)
        session.add_assistant_message(response_text)
        session.switch_to_conversation()
        return response_text

    # Default: empathetic conversation
    session.add_user_message(user_text)
    response_text = chat(client, session.messages)
    session.add_assistant_message(response_text)
    return response_text


async def console_loop():
    """Simple console-based loop for local testing (text in → text out)."""
    if not SARVAM_API_KEY:
        print("Error: SARVAM_API_KEY not set. Copy .env.example to .env and add your key.")
        sys.exit(1)

    client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
    session = DhairyaSession()

    print("=" * 60)
    print("ಧೈರ್ಯ — Dhairya Voice Agent (Console Mode)")
    print("=" * 60)
    print()
    print(f"ಧೈರ್ಯ: {WELCOME_MESSAGE}")
    print()
    print("Type in Kannada or English. Type 'quit' to exit.")
    print("-" * 60)

    while True:
        try:
            user_input = input("\nನೀವು: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nಧನ್ಯವಾದ. ಧೈರ್ಯ ಇಟ್ಕೊಳ್ಳಿ.")
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "bye"):
            print("\nಧೈರ್ಯ: ಧನ್ಯವಾದ. ನಿಮಗೆ ಒಳ್ಳೆಯದಾಗಲಿ. ಧೈರ್ಯ ಇಟ್ಕೊಳ್ಳಿ.")
            break

        response = await handle_turn(client, session, user_input)
        print(f"\nಧೈರ್ಯ: {response}")


# ---------------------------------------------------------------------------
# Pipecat pipeline (for real-time voice via Daily/LiveKit)
# ---------------------------------------------------------------------------

async def run_pipecat_agent():
    """
    Launch the Pipecat real-time voice pipeline.
    Requires DAILY_API_KEY or LiveKit credentials in .env.
    """
    try:
        from pipecat.frames.frames import TextFrame, EndFrame
        from pipecat.pipeline.pipeline import Pipeline
        from pipecat.pipeline.runner import PipelineRunner
        from pipecat.pipeline.task import PipelineTask
        from pipecat.services.sarvam import SarvamSTTService, SarvamTTSService, SarvamLLMService
        from pipecat.transports.services.daily import DailyParams, DailyTransport
    except ImportError:
        print("Pipecat not installed. Install with: pip install pipecat-ai[sarvam,daily]")
        print("Falling back to console mode...\n")
        await console_loop()
        return

    if not DAILY_API_KEY:
        print("DAILY_API_KEY not set. Falling back to console mode...\n")
        await console_loop()
        return

    # Configure Sarvam services for Pipecat
    stt = SarvamSTTService(
        api_key=SARVAM_API_KEY,
        model=STT_MODEL,
        language_code=LANGUAGE_CODE,
    )

    llm = SarvamLLMService(
        api_key=SARVAM_API_KEY,
        model=CHAT_MODEL,
    )

    tts = SarvamTTSService(
        api_key=SARVAM_API_KEY,
        model=TTS_MODEL,
        language_code=LANGUAGE_CODE,
        speaker=SPEAKERS["female"],
        pace=DEFAULT_TTS_PACE,
    )

    # Daily transport for WebRTC
    transport = DailyTransport(
        room_url="",  # Will be created dynamically
        token="",
        bot_name="ಧೈರ್ಯ",
        params=DailyParams(audio_out_enabled=True, audio_in_enabled=True),
    )

    # Build pipeline: Transport In → STT → LLM → TTS → Transport Out
    pipeline = Pipeline([
        transport.input(),
        stt,
        llm,
        tts,
        transport.output(),
    ])

    # Set the system prompt
    messages = [{"role": "system", "content": DHAIRYA_SYSTEM_PROMPT}]

    task = PipelineTask(pipeline)
    runner = PipelineRunner()

    print("Pipecat voice agent starting...")
    print("Waiting for user to join the Daily room...")

    await runner.run(task)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main():
    """Start the agent — tries Pipecat first, falls back to console."""
    print("\n🫶 ಧೈರ್ಯ — Dhairya 2.0\n")

    if DAILY_API_KEY and SARVAM_API_KEY:
        print("Starting Pipecat voice agent...")
        asyncio.run(run_pipecat_agent())
    else:
        print("Starting in console mode (set DAILY_API_KEY for voice mode)...")
        asyncio.run(console_loop())


if __name__ == "__main__":
    main()
