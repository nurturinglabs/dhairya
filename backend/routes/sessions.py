"""Session management routes — anonymous, no PII stored."""

import os
import sys
import uuid
import base64
import tempfile

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "voice-agent"))

from backend.models import SessionCreate, SessionResponse, ChatRequest, ChatResponse
from prompts import DHAIRYA_SYSTEM_PROMPT, AFFIRMATION_SYSTEM_PROMPT
from story_engine import get_stories, get_random_story
from config import (
    SARVAM_API_KEY,
    CHAT_MODEL,
    STT_MODEL,
    TTS_MODEL,
    LANGUAGE_CODE,
    SPEAKERS,
    DEFAULT_TTS_PACE,
    DEFAULT_TTS_PITCH,
    DEFAULT_TTS_LOUDNESS,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# In-memory session store (no persistence — anonymous by design)
_sessions: dict[str, dict] = {}


def _get_client():
    """Lazy-create Sarvam client."""
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY not configured")
    from sarvamai import SarvamAI
    return SarvamAI(api_subscription_key=SARVAM_API_KEY)


def _synthesize_response(client, text: str) -> str | None:
    """Convert response text to speech, return base64-encoded audio."""
    try:
        response = client.text_to_speech.convert(
            text=text[:500],  # Limit to avoid TTS truncation
            target_language_code=LANGUAGE_CODE,
            model=TTS_MODEL,
            speaker=SPEAKERS["female"],
            pitch=DEFAULT_TTS_PITCH,
            pace=DEFAULT_TTS_PACE,
            loudness=DEFAULT_TTS_LOUDNESS,
            enable_preprocessing=True,
        )
        if hasattr(response, "audios") and response.audios:
            return response.audios[0]
    except Exception as e:
        print(f"TTS error: {e}")
    return None


def _transcribe(client, audio_bytes: bytes) -> str:
    """Convert speech to text using Saarika STT."""
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


def _chat_logic(session: dict, user_text: str, client) -> tuple[str, str]:
    """Shared chat logic. Returns (response_text, mode)."""
    session["messages"].append({"role": "user", "content": user_text})
    session["message_count"] += 1

    text_lower = user_text.lower()

    # Celebrity story triggers
    if any(t in text_lower for t in ["celebrity", "famous", "ಸ್ಫೂರ್ತಿ", "ಸೆಲೆಬ್ರಿಟಿ"]):
        stories = get_stories(category="celebrity")
        story = get_random_story(stories, exclude_ids=session["stories_heard"])
        session["stories_heard"].append(story.id)
        response_text = f"ಇದು {story.name_kannada} ಅವರ ಸ್ಫೂರ್ತಿ ಕಥೆ.\n\n{story.kannada_text}"
        session["messages"].append({"role": "assistant", "content": response_text})
        return response_text, "story"

    # Default story triggers → survivor stories
    if any(t in text_lower for t in ["ಕಥೆ", "story", "ಕಥೆ ಹೇಳಿ"]):
        stories = get_stories(category="survivor")
        story = get_random_story(stories, exclude_ids=session["stories_heard"])
        session["stories_heard"].append(story.id)
        response_text = f"ಈ ಕಥೆ {story.name_kannada} ಅವರದ್ದು.\n\n{story.kannada_text}"
        session["messages"].append({"role": "assistant", "content": response_text})
        return response_text, "story"

    if any(t in text_lower for t in ["ಧೈರ್ಯ", "courage", "ಧೈರ್ಯ ಕೊಡಿ"]):
        session["messages"][0] = {"role": "system", "content": AFFIRMATION_SYSTEM_PROMPT}
        mode = "courage"
    else:
        session["messages"][0] = {"role": "system", "content": DHAIRYA_SYSTEM_PROMPT}
        mode = "conversation"

    response = client.chat.completions(
        messages=session["messages"],
    )
    response_text = response.choices[0].message.content
    session["messages"].append({"role": "assistant", "content": response_text})

    # Always reset to conversation prompt after courage mode
    session["messages"][0] = {"role": "system", "content": DHAIRYA_SYSTEM_PROMPT}

    return response_text, mode


@router.post("/", response_model=SessionResponse)
async def create_session(body: SessionCreate):
    """Create a new anonymous session."""
    session_id = uuid.uuid4().hex
    _sessions[session_id] = {
        "mode": body.mode,
        "messages": [{"role": "system", "content": DHAIRYA_SYSTEM_PROMPT}],
        "stories_heard": [],
        "message_count": 0,
    }
    return SessionResponse(
        session_id=session_id,
        mode=body.mode,
        stories_heard=[],
        message_count=0,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get session info."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(
        session_id=session_id,
        mode=session["mode"],
        stories_heard=session["stories_heard"],
        message_count=session["message_count"],
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(body: ChatRequest):
    """Send a text message and get a response with TTS audio."""
    session = _sessions.get(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Create one first.")

    client = _get_client()
    response_text, mode = _chat_logic(session, body.text, client)

    # Generate TTS for the response
    audio_b64 = _synthesize_response(client, response_text)

    return ChatResponse(
        session_id=body.session_id,
        response_text=response_text,
        mode=mode,
        audio_base64=audio_b64,
    )


@router.post("/chat-voice", response_model=ChatResponse)
async def chat_voice_endpoint(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
):
    """Voice-in, voice-out: accept audio, return text + TTS audio."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Create one first.")

    client = _get_client()

    # 1. STT: transcribe user audio
    audio_bytes = await audio.read()
    user_text = _transcribe(client, audio_bytes)

    if not user_text.strip():
        return ChatResponse(
            session_id=session_id,
            response_text="ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಮಾತು ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೆ ಹೇಳಿ.",
            mode="conversation",
            audio_base64=None,
        )

    # 2. Chat: get AI response
    response_text, mode = _chat_logic(session, user_text, client)

    # 3. TTS: synthesize response
    audio_b64 = _synthesize_response(client, response_text)

    return ChatResponse(
        session_id=session_id,
        response_text=response_text,
        mode=mode,
        audio_base64=audio_b64,
        user_text=user_text,
    )


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """End a session and clear its data."""
    if session_id in _sessions:
        del _sessions[session_id]
    return {"status": "ok", "message": "Session ended"}
