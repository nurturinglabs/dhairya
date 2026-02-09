"""Community stories — record, transcribe, and share cancer journey stories."""

import os
import sys
import uuid
import base64
import tempfile

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "voice-agent"))

from config import (
    SARVAM_API_KEY,
    STT_MODEL,
    TTS_MODEL,
    LANGUAGE_CODE,
    SPEAKERS,
    DEFAULT_TTS_PACE,
)

router = APIRouter(prefix="/api/community", tags=["community"])

# In-memory store for community stories (ephemeral — MVP for contest demo)
_community_stories: list[dict] = []


def _get_client():
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY not configured")
    from sarvamai import SarvamAI
    return SarvamAI(api_subscription_key=SARVAM_API_KEY)


@router.post("/transcribe")
async def transcribe_story(audio: UploadFile = File(...)):
    """Transcribe a recorded story using Saarika STT."""
    client = _get_client()
    audio_bytes = await audio.read()

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = client.speech_to_text.transcribe(
            file=open(tmp_path, "rb"),
            model=STT_MODEL,
            language_code=LANGUAGE_CODE,
        )
        return {"transcript": result.transcript}
    finally:
        os.unlink(tmp_path)


@router.post("/submit")
async def submit_story(
    transcript: str = Form(...),
    name: str = Form(default="\u0C85\u0CA8\u0CBE\u0CAE\u0CBF\u0C95"),
    relation: str = Form(default=""),
    cancer_type: str = Form(default=""),
):
    """Submit a community story. Generates Bulbul V3 audio from transcript."""
    client = _get_client()
    story_id = uuid.uuid4().hex[:8]

    # Generate Bulbul V3 audio from transcript
    audio_b64 = None
    try:
        response = client.text_to_speech.convert(
            text=transcript[:400],
            target_language_code=LANGUAGE_CODE,
            model=TTS_MODEL,
            speaker=SPEAKERS["female"],
            pace=DEFAULT_TTS_PACE,
            enable_preprocessing=True,
        )
        if hasattr(response, "audios") and response.audios:
            audio_b64 = response.audios[0]
    except Exception as e:
        print(f"TTS error for community story: {e}")

    story = {
        "id": story_id,
        "name": name,
        "relation": relation,
        "cancer_type": cancer_type,
        "transcript": transcript,
        "transcript_preview": transcript[:100] + ("..." if len(transcript) > 100 else ""),
        "audio_base64": audio_b64,
    }
    _community_stories.append(story)

    return {"success": True, "story_id": story_id}


@router.get("/")
async def list_community_stories():
    """List all community stories."""
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "relation": s["relation"],
            "cancer_type": s["cancer_type"],
            "transcript_preview": s["transcript_preview"],
            "has_audio": s["audio_base64"] is not None,
        }
        for s in _community_stories
    ]


@router.get("/{story_id}")
async def get_community_story(story_id: str):
    """Get a specific community story with full transcript."""
    for s in _community_stories:
        if s["id"] == story_id:
            return {
                "id": s["id"],
                "name": s["name"],
                "relation": s["relation"],
                "cancer_type": s["cancer_type"],
                "transcript": s["transcript"],
                "has_audio": s["audio_base64"] is not None,
            }
    raise HTTPException(status_code=404, detail="Community story not found")


@router.get("/{story_id}/audio")
async def get_community_audio(story_id: str):
    """Serve community story audio as WAV binary."""
    for s in _community_stories:
        if s["id"] == story_id and s["audio_base64"]:
            audio_bytes = base64.b64decode(s["audio_base64"])
            return Response(content=audio_bytes, media_type="audio/wav")
    raise HTTPException(status_code=404, detail="Audio not found")
