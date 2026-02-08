"""Vercel serverless entry point — exposes the FastAPI app."""

import os
import sys

# Ensure project root and voice-agent are importable
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root)
sys.path.insert(0, os.path.join(root, "voice-agent"))

from backend.main import app
