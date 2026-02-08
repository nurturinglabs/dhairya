.PHONY: setup audio agent backend webapp clean

# Install dependencies
setup:
	pip install -r requirements.txt
	cp -n .env.example .env || true
	@echo "Edit .env with your API keys"

# Pre-generate story audio files
audio:
	python voice-agent/generate_audio.py

# Run voice agent
agent:
	python voice-agent/agent.py

# Run backend server
backend:
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Run webapp dev server
webapp:
	cd webapp && npx serve .

# Clean generated audio
clean:
	rm -f stories/audio/*.wav
