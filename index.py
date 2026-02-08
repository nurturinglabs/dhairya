"""Vercel entrypoint — auto-detected as index.py at project root."""

import sys
import os
import traceback

# Ensure project root and voice-agent are in Python path
root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, root)
sys.path.insert(0, os.path.join(root, "voice-agent"))

try:
    from backend.main import app
except Exception as e:
    # If import fails, create a minimal app that shows the error
    from fastapi import FastAPI
    app = FastAPI()
    error_msg = traceback.format_exc()
    print(f"IMPORT ERROR:\n{error_msg}", flush=True)

    @app.get("/{path:path}")
    async def show_error(path: str = ""):
        return {"error": "Import failed", "detail": error_msg}
