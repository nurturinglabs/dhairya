# ಧೈರ್ಯ — Dhairya 2.0

**A Kannada voice companion for cancer patients, built with Sarvam AI Bulbul V3.**

> ಸಾವು ಕೂಡ ನಿಮ್ಮನ್ನ ನೋಡಿದರೆ ಹೆದರಬೇಕು.
> *Even death should fear looking at you.*

---

## The Mission

Cancer is isolating. For Kannada-speaking patients in Karnataka, the emotional support gap is even wider — most mental health resources are in English, and cultural stigma keeps people silent.

**Dhairya** (ಧೈರ್ಯ = courage) is an AI companion that listens, speaks, and stands beside cancer patients in their own language. It doesn't give medical advice. It doesn't promise everything will be okay. It simply says: *"ನಾನೂ ಇಲ್ಲೇ ಇದ್ದೀನಿ"* — I'm right here.

Built for the [Sarvam AI #TheMicIsYours Bulbul V3 Challenge](https://www.sarvam.ai).

---

## Three Experiences

### 1. ಕಥೆ ಕೇಳಿ — Listen to Stories
Hear stories of survivors and celebrities who fought cancer, narrated in Kannada with emotionally-directed voices. Each story has a unique speaker, pace, and tone — crafted using Sarvam Bulbul V3 TTS with per-story voice direction.

- **10 survivor stories** — first-person narratives inspired by real experiences (Meena, Raju, Priya, Shankarappa, Lakshmi, and more)
- **5 celebrity stories** — real cancer journeys of Shivarajkumar, Yuvraj Singh, Sonali Bendre, Manisha Koirala, Gautami
- **Community stories** — listen to stories shared by other patients and families

### 2. ಮಾತಾಡಿ — Talk to Dhairya
A voice companion that listens to you in Kannada and responds with empathy. Speak or type — Dhairya hears you, understands your pain, and responds like a caring elder sister (ಅಕ್ಕ).

- Voice input via browser microphone (Sarvam Saarika STT)
- Empathetic conversation powered by Sarvam-M LLM
- Spoken responses via Bulbul V3 TTS
- Text input fallback for accessibility
- No toxic positivity, no false promises — just real emotional support
- Crisis support: routes to iCall helpline when needed

### 3. ಧೈರ್ಯ ಕೊಡಿ — Share Your Courage
Record your cancer story in Kannada. Your voice gets transcribed, and your story joins the community — becoming someone else's source of courage.

- 30-second voice recording via browser
- Automatic transcription (Sarvam Saarika v2.5 STT)
- Review and edit before sharing
- TTS audio generation for your story (Bulbul V3)
- Anonymous by default — share with a name, or don't

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **TTS** | Sarvam Bulbul V3 — Kannada text-to-speech with speaker direction (kavya/shubh) |
| **STT** | Sarvam Saarika v2.5 — Kannada speech-to-text |
| **Chat** | Sarvam-M — empathetic Kannada conversation LLM |
| **Backend** | Python / FastAPI — REST API with stories, sessions, community routes |
| **Frontend** | React (CDN) with in-browser Babel — no build step |
| **Audio** | 15 pre-generated WAV files (~75MB) with per-story voice direction |

---

## Project Structure

```
dhairya-2.0/
├── public/                  # Frontend (served as static files)
│   ├── index.html
│   ├── app.jsx              # React app (all three experiences)
│   └── styles.css
├── backend/                 # FastAPI backend
│   ├── main.py              # App entry point, CORS, routers
│   ├── models.py            # Pydantic models
│   └── routes/
│       ├── stories.py       # Story content + audio serving
│       ├── sessions.py      # Voice companion (STT → Chat → TTS)
│       └── community.py     # Community story recording + sharing
├── voice-agent/             # Sarvam AI configuration
│   ├── config.py            # Model IDs, speakers, per-story voice config
│   ├── prompts.py           # System prompts (Kannada personality)
│   ├── generate_audio.py    # Batch audio generation script
│   └── story_engine.py      # Story chunking + TTS pipeline
├── stories/                 # Story content
│   ├── survivors/           # 10 survivor story markdown files
│   ├── celebrities/         # 5 celebrity story markdown files
│   └── audio/               # Pre-generated WAV audio
│       ├── survivors/       # 10 survivor audio files
│       └── celebrities/     # 5 celebrity audio files
├── requirements.txt
├── vercel.json              # Vercel deployment config
└── index.py                 # Vercel serverless entry point
```

---

## Running Locally

```bash
# 1. Clone and install
pip install -r requirements.txt

# 2. Set your Sarvam API key
cp .env.example .env
# Edit .env and add SARVAM_API_KEY=your_key_here

# 3. Start the backend (port 8000)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# 4. Start the frontend (port 3000, in a separate terminal)
python -m http.server 3000 --directory public

# 5. Open http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SARVAM_API_KEY` | Yes | Sarvam AI API subscription key |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/stories/survivors` | List survivor stories |
| `GET` | `/api/stories/celebrities` | List celebrity stories |
| `GET` | `/api/stories/{category}/{number}/audio` | Stream story audio (WAV) |
| `POST` | `/api/sessions/create` | Create anonymous chat session |
| `POST` | `/api/sessions/chat` | Send text message, get response + TTS |
| `POST` | `/api/sessions/chat-voice` | Send voice recording, get response + TTS |
| `GET` | `/api/community` | List community stories |
| `POST` | `/api/community/transcribe` | Transcribe voice recording (STT) |
| `POST` | `/api/community/submit` | Submit community story |
| `GET` | `/api/community/{id}/audio` | Stream community story audio |

---

## Deployment

Configured for **Vercel** with serverless Python functions:

1. Push to GitHub
2. Connect repo to Vercel
3. Set `SARVAM_API_KEY` in Vercel environment variables
4. Deploy — audio files are copied to `public/audio/` at build time for static serving

---

*Made with ❤️ using [Sarvam AI](https://www.sarvam.ai) Bulbul V3 · #TheMicIsYours*
