"""Story API routes — list, detail, and audio serving."""

import os
import sys
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

# Add voice-agent to path so we can reuse story_engine
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "voice-agent"))

from story_engine import get_stories, get_story_by_number, has_audio
from backend.models import StoryBrief, StoryDetail

router = APIRouter(prefix="/api/stories", tags=["stories"])


def _story_to_brief(s) -> StoryBrief:
    return StoryBrief(
        id=s.id,
        number=s.number,
        category=s.category,
        name_kannada=s.name_kannada,
        name_english=s.name_english,
        title_kannada=s.title_kannada,
        title_english=s.title_english,
        cancer_type=s.cancer_type,
        age=s.age,
        location=s.location,
        has_audio=has_audio(s),
    )


@router.get("/", response_model=list[StoryBrief])
async def list_stories(category: Optional[str] = Query(None, description="Filter: survivor or celebrity")):
    """Return stories with brief info. Optionally filter by category."""
    stories = get_stories(category=category)
    return [_story_to_brief(s) for s in stories]


@router.get("/survivors", response_model=list[StoryBrief])
async def list_survivors():
    """Return all survivor stories."""
    return [_story_to_brief(s) for s in get_stories(category="survivor")]


@router.get("/celebrities", response_model=list[StoryBrief])
async def list_celebrities():
    """Return all celebrity inspiration stories."""
    return [_story_to_brief(s) for s in get_stories(category="celebrity")]


@router.get("/{category}/{story_number}", response_model=StoryDetail)
async def get_story(category: str, story_number: int):
    """Return full story detail including Kannada text."""
    if category not in ("survivor", "celebrity"):
        raise HTTPException(status_code=400, detail="Category must be 'survivor' or 'celebrity'")
    stories = get_stories(category=category)
    story = get_story_by_number(stories, story_number, category=category)
    if not story:
        raise HTTPException(status_code=404, detail=f"{category} story #{story_number} not found")
    return StoryDetail(
        id=story.id,
        number=story.number,
        category=story.category,
        name_kannada=story.name_kannada,
        name_english=story.name_english,
        title_kannada=story.title_kannada,
        title_english=story.title_english,
        cancer_type=story.cancer_type,
        age=story.age,
        location=story.location,
        has_audio=has_audio(story),
        kannada_text=story.kannada_text,
    )


@router.get("/{category}/{story_number}/audio")
async def get_story_audio(category: str, story_number: int):
    """Serve the pre-generated .wav audio file for a story."""
    if category not in ("survivor", "celebrity"):
        raise HTTPException(status_code=400, detail="Category must be 'survivor' or 'celebrity'")
    stories = get_stories(category=category)
    story = get_story_by_number(stories, story_number, category=category)
    if not story:
        raise HTTPException(status_code=404, detail=f"{category} story #{story_number} not found")
    if not has_audio(story):
        raise HTTPException(
            status_code=404,
            detail=f"Audio not yet generated for {category} story #{story_number}. Run: python voice-agent/generate_audio.py --category {'survivors' if category == 'survivor' else 'celebrities'}",
        )
    return FileResponse(
        story.audio_path,
        media_type="audio/wav",
        filename=f"{story.id}.wav",
    )
