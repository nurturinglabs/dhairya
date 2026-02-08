"""
Dhairya 2.0 — FastAPI Backend

Serves story content, manages anonymous sessions, and provides
a chat API backed by Sarvam-M.

Usage:
    uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
"""

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

# Ensure voice-agent modules are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "voice-agent"))

from backend.models import HealthResponse
from backend.routes.stories import router as stories_router
from backend.routes.sessions import router as sessions_router
from backend.routes.community import router as community_router

app = FastAPI(
    title="Dhairya 2.0 API",
    description="Kannada voice companion for cancer patients",
    version="2.0.0",
)

# CORS — allow the webapp to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(stories_router)
app.include_router(sessions_router)
app.include_router(community_router)


@app.get("/")
async def root():
    return RedirectResponse("/index.html")


@app.get("/api/health", response_model=HealthResponse)
async def api_health():
    return HealthResponse(status="ok", service="dhairya-2.0")
