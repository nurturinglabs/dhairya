"""Pydantic models for the Dhairya backend API."""

from pydantic import BaseModel, Field
import uuid


# --- Story models ---

class StoryBrief(BaseModel):
    """Lightweight story info returned in list endpoints."""
    id: str
    number: int
    category: str  # "survivor" or "celebrity"
    name_kannada: str
    name_english: str
    title_kannada: str
    title_english: str
    cancer_type: str
    age: int
    location: str
    has_audio: bool


class StoryDetail(StoryBrief):
    """Full story detail including the Kannada text."""
    kannada_text: str


# --- Session models ---

class SessionCreate(BaseModel):
    """Request to create a new anonymous session."""
    mode: str = Field(default="conversation", description="conversation | story | courage")


class SessionResponse(BaseModel):
    """Returned when a session is created."""
    session_id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    mode: str
    stories_heard: list[str] = []
    message_count: int = 0


# --- Chat models ---

class ChatRequest(BaseModel):
    """Request body for the chat endpoint."""
    session_id: str
    text: str


class ChatResponse(BaseModel):
    """Response from the chat endpoint."""
    session_id: str
    response_text: str
    mode: str
    audio_base64: str | None = None  # Base64-encoded WAV from TTS
    user_text: str | None = None     # Transcribed text from voice input


# --- Health check ---

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "dhairya-2.0"
