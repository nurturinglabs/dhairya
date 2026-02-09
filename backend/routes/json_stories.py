"""JSON-based story routes — serves stories from dhairya_27_stories_data.json."""

import os
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/json-stories", tags=["json-stories"])

# ─── Load JSON data at startup ────────────────────────────────────────
_BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "stories")
_JSON_PATH = os.path.join(_BASE_DIR, "dhairya_27_stories_data.json")
_AUDIO_DIR = os.path.join(_BASE_DIR, "audio")

_data: dict[str, list[dict]] = {}

if os.path.exists(_JSON_PATH):
    with open(_JSON_PATH, "r", encoding="utf-8") as f:
        _data = json.load(f)


def _has_audio(category: str, story_id: str) -> bool:
    return os.path.isfile(os.path.join(_AUDIO_DIR, category, f"{story_id}.wav"))


def _enrich(category: str, story: dict) -> dict:
    """Add computed fields to a story dict for the frontend."""
    return {
        **story,
        "category": category,
        "has_audio": _has_audio(category, story["id"]),
    }


@router.get("/categories")
async def list_categories():
    """Return available JSON story categories."""
    return [
        {"key": k, "count": len(v)}
        for k, v in _data.items()
    ]


@router.get("/{category}")
async def list_stories(category: str):
    """Return all stories in a JSON category."""
    if category not in _data:
        raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
    return [_enrich(category, s) for s in _data[category]]


@router.get("/{category}/{story_id}")
async def get_story(category: str, story_id: str):
    """Return a single story by category and ID."""
    if category not in _data:
        raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
    for s in _data[category]:
        if s["id"] == story_id:
            return _enrich(category, s)
    raise HTTPException(status_code=404, detail=f"Story '{story_id}' not found in '{category}'")


@router.get("/{category}/{story_id}/audio")
async def get_story_audio(category: str, story_id: str):
    """Serve the pre-generated .wav audio file for a JSON story."""
    if category not in _data:
        raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
    audio_path = os.path.join(_AUDIO_DIR, category, f"{story_id}.wav")
    if not os.path.isfile(audio_path):
        raise HTTPException(status_code=404, detail=f"Audio not found for '{story_id}'")
    return FileResponse(audio_path, media_type="audio/wav", filename=f"{story_id}.wav")
