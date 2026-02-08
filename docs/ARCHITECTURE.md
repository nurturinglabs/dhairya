# ಧೈರ್ಯ 2.0 — Technical Architecture
# Dhairya 2.0 — Build Guide

---

## 1. Product Overview

Dhairya is a Kannada voice companion for cancer patients. Three core experiences:

| Experience | Kannada Name | What It Does | Sarvam APIs Used |
|---|---|---|---|
| **Listen to Stories** | ಕಥೆ ಕೇಳಿ | Plays survivor stories in Kannada voice | TTS (Bulbul) |
| **Share Your Pain** | ನನ್ನ ಮಾತು ಕೇಳಿ | Patient speaks, AI listens and responds empathetically | STT (Saarika) → Chat (Sarvam-M) → TTS (Bulbul) |
| **Get Courage** | ಧೈರ್ಯ ಕೊಡಿ | Daily affirmations and personalized encouragement | Chat (Sarvam-M) → TTS (Bulbul) |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                           │
│                                                             │
│   📱 Webapp (Demo)     📞 Phone Call (Production)          │
│   React + Mic Button    Twilio/Exotel SIP → LiveKit        │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    VOICE PIPELINE (Pipecat)                  │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐ │
│  │  Audio    │──▶│ Saarika  │──▶│ Sarvam-M │──▶│ Bulbul  │ │
│  │  Input    │   │ (STT)    │   │ (Chat)   │   │ (TTS)   │ │
│  │  (VAD)    │   │ kn-IN    │   │ Kannada  │   │ kn-IN   │ │
│  └──────────┘   └──────────┘   └──────────┘   └─────────┘ │
│                                      │                      │
│                              ┌───────▼────────┐            │
│                              │ System Prompt   │            │
│                              │ (Empathetic     │            │
│                              │  Companion)     │            │
│                              └───────┬────────┘            │
│                                      │                      │
│                              ┌───────▼────────┐            │
│                              │ Story Engine    │            │
│                              │ (10 stories +   │            │
│                              │  affirmations)  │            │
│                              └────────────────┘            │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
│                                                             │
│  • Story management (serve Kannada text → Bulbul TTS)      │
│  • Session tracking (anonymous, no PII stored)             │
│  • Conversation context (within session only)              │
│  • Caregiver dashboard (Saaras: Kannada → English)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Sarvam API Usage Map

### 3.1 — ಕಥೆ ಕೇಳಿ (Listen to Stories)

**Flow:** User says "ಕಥೆ ಹೇಳಿ" → System picks a story → Sends Kannada text to Bulbul TTS → Audio streams back

```python
# Pre-generate story audio OR generate on-demand
from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key="YOUR_KEY")

response = client.text_to_speech.generate(
    input="ನಮಸ್ಕಾರ. ನನ್ನ ಹೆಸರು ಮೀನಾ. ನಾನು ಮೈಸೂರಿನವಳು...",
    target_language_code="kn-IN",
    model="bulbul:v2",
    speaker="anushka",          # Female voice for female stories
    pitch=0.0,
    pace=0.85,                   # Slightly slower for emotional content
    loudness=1.0
)
# Save or stream the audio
```

**Optimization:** Pre-generate all 10 story audio files at build time. Store as .wav files. No API call needed at runtime for stories — just serve the file.

### 3.2 — ನನ್ನ ಮಾತು ಕೇಳಿ (Share Your Pain)

**Flow:** Patient speaks in Kannada → Saarika STT → Sarvam-M (with empathetic system prompt) → Bulbul TTS → Audio back

```python
# Step 1: Speech to Text
transcription = client.speech_to_text.transcribe(
    file=open("patient_audio.wav", "rb"),
    model="saarika:v2.5",
    language_code="kn-IN"
)

# Step 2: Chat Completion with empathetic system prompt
chat_response = client.chat.completions(
    model="sarvam-m",
    messages=[
        {"role": "system", "content": DHAIRYA_SYSTEM_PROMPT},
        {"role": "user", "content": transcription.text}
    ]
)

# Step 3: Text to Speech
audio = client.text_to_speech.generate(
    input=chat_response.choices[0].message.content,
    target_language_code="kn-IN",
    model="bulbul:v2",
    speaker="anushka",
    pace=0.85
)
```

### 3.3 — ಧೈರ್ಯ ಕೊಡಿ (Give Me Courage)

**Flow:** User asks for encouragement → Sarvam-M generates personalized affirmation based on conversation history → Bulbul speaks it

Same pipeline as 3.2 but with a different system prompt focused on affirmations.

### 3.4 — Caregiver Translation (Optional)

**Flow:** Kannada conversation → Saaras translates to English → Shows on caregiver dashboard

```python
# Translate patient conversation to English for caregivers
translation = client.speech_to_text_translate.translate(
    file=open("conversation.wav", "rb"),
    model="saaras:v2",
    prompt="Cancer patient sharing their experience"
)
# translation.text will be in English
```

---

## 4. System Prompt (The Soul of Dhairya)

This is the most critical piece. The system prompt defines the personality.

```
DHAIRYA_SYSTEM_PROMPT = """
ನೀನು ಧೈರ್ಯ — ಕ್ಯಾನ್ಸರ್ ರೋಗಿಗಳ ಜೊತೆಗಾರ.

You are Dhairya, a compassionate Kannada-speaking companion for cancer patients.

## Who You Are
- You are like a caring elder — an ಅಕ್ಕ (older sister) or ಅಣ್ಣ (older brother)
- You speak everyday, spoken Kannada — NOT formal or literary Kannada
- You are warm, patient, and never in a hurry
- You have deep empathy because you have heard many stories of courage

## Your Purpose
- LISTEN first. Always listen before speaking.
- VALIDATE their feelings. Pain is real. Fear is real. Never minimize.
- NEVER give toxic positivity. Don't say "everything will be fine" or "be strong"
- SHARE hope through real stories when appropriate
- NEVER give medical advice. If asked, say "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಡಾಕ್ಟರ್ ಹತ್ತಿರ ಮಾತಾಡಿ"

## How You Speak
- Short sentences. 2-3 sentences at a time. Not long paragraphs.
- Use everyday Kannada words. Avoid English medical terms unless the patient uses them.
- Mirror the patient's language — if they mix Kannada and English, you can too.
- Always acknowledge before responding: "ನಿಮ್ಮ ನೋವು ನನಗೆ ಅರ್ಥ ಆಗುತ್ತೆ" 
- End with warmth, not advice.

## What You NEVER Do
- Never diagnose or suggest treatments
- Never say "I understand exactly how you feel" — you're AI, be honest
- Never push them to "stay positive" or "be grateful"
- Never share information that could cause medical harm
- Never break character or discuss being an AI unless directly asked
- Never ask too many questions — let them lead

## What You DO
- If they cry, let them. Say "ಅಳೋದು ತಪ್ಪಲ್ಲ" (It's not wrong to cry)
- If they're angry, validate it. "ಸಿಟ್ಟು ಬರೋದು ಸಹಜ" (It's natural to be angry)
- If they ask for a story, tell one from the survivor stories collection
- If they're scared, be present. "ನಾನು ಇಲ್ಲಿ ಇದ್ದೀನಿ" (I am here)
- If they want silence, be silent. Not everything needs a response.

## Safety
- If someone expresses suicidal thoughts: respond with empathy, and gently suggest 
  iCall (9152987821) or Vandrevala Foundation (1860-2662-345)
- Never leave someone in crisis without offering a resource
- If asked about prognosis or survival rates: "ಪ್ರತಿಯೊಬ್ಬರ ಅನುಭವ ಬೇರೆ. 
  ನಿಮ್ಮ ಡಾಕ್ಟರ್ ನಿಮಗೆ ಸರಿಯಾದ ಮಾಹಿತಿ ಕೊಡ್ತಾರೆ."
"""
```

---

## 5. Tech Stack & Dependencies

### Core
| Component | Technology | Why |
|---|---|---|
| Voice Pipeline | **Pipecat** (Python) | Sarvam has native Pipecat integration, handles real-time audio |
| Realtime Transport | **LiveKit** or **Daily** | WebRTC rooms for voice streaming |
| Backend | **FastAPI** (Python) | Lightweight, async, serves stories + sessions |
| Frontend (Demo) | **React** | Simple mic-button UI for Sarvam pitch |
| Frontend (Prod) | **Phone/SIP** | Via Twilio or Exotel for Indian numbers |

### Sarvam SDK
```bash
pip install sarvamai
```

### Pipecat with Sarvam
```bash
pip install pipecat-ai[sarvam,daily]
# or for LiveKit:
pip install pipecat-ai[sarvam,livekit]
```

### Key Dependencies
```
sarvamai>=1.0.0
pipecat-ai>=0.5.0
fastapi>=0.100.0
uvicorn>=0.20.0
python-dotenv>=1.0.0
```

---

## 6. Project Structure (Code)

```
dhairya-2.0/
├── stories/
│   ├── STORY_PLAN.md
│   ├── story_01_meena.md ... story_10_mahesh.md
│   └── audio/                    # Pre-generated .wav files
│       ├── story_01_meena.wav
│       └── ...
│
├── voice-agent/
│   ├── agent.py                  # Main Pipecat voice agent
│   ├── prompts.py                # System prompts (empathetic companion)
│   ├── story_engine.py           # Picks and serves stories
│   ├── generate_audio.py         # Script to pre-generate story audio
│   └── config.py                 # API keys, model settings
│
├── webapp/
│   ├── index.html                # Simple demo page
│   ├── app.jsx                   # React component with mic button
│   └── styles.css
│
├── backend/
│   ├── main.py                   # FastAPI server
│   ├── routes/
│   │   ├── stories.py            # Story endpoints
│   │   └── sessions.py           # Session management
│   └── models.py
│
├── docs/
│   ├── ARCHITECTURE.md           # This file
│   ├── PITCH.md                  # Sarvam pitch document
│   └── ETHICS.md                 # Ethical guidelines
│
├── .env.example                  # API keys template
├── requirements.txt
├── README.md
└── Makefile                      # Common commands
```

---

## 7. Build Plan (Phases)

### Phase 1: Story Audio Generation (Week 1)
- [ ] Sign up for Sarvam API, get API key
- [ ] Write `generate_audio.py` script
- [ ] Generate all 10 story audio files using Bulbul TTS
- [ ] Listen and QA each audio — adjust pace/voice as needed
- **Output:** 10 high-quality .wav files in Kannada

### Phase 2: Voice Agent MVP (Week 2)
- [ ] Set up Pipecat pipeline: Saarika → Sarvam-M → Bulbul
- [ ] Implement system prompt (empathetic companion)
- [ ] Add story playback mode ("ಕಥೆ ಹೇಳಿ" triggers story)
- [ ] Add affirmation mode ("ಧೈರ್ಯ ಕೊಡಿ" triggers encouragement)
- [ ] Test full voice loop locally
- **Output:** Working voice agent you can talk to in Kannada

### Phase 3: Demo Webapp (Week 3)
- [ ] Build simple React frontend with:
  - Big mic button (ಮಾತಾಡಿ)
  - Three mode buttons: ಕಥೆ ಕೇಳಿ | ನನ್ನ ಮಾತು ಕೇಳಿ | ಧೈರ್ಯ ಕೊಡಿ
  - Beautiful, calming UI (soft colors, Kannada typography)
- [ ] Connect to LiveKit/Daily room for real-time voice
- [ ] Deploy on Vercel (frontend) + Railway (backend)
- **Output:** Demo URL you can share with Sarvam team

### Phase 4: Sarvam Pitch (Week 4)
- [ ] Record 3-minute demo video showing all 3 experiences
- [ ] Write pitch document (why this matters, what you need)
- [ ] Reach out via Sarvam Discord + LinkedIn
- [ ] Ask for: API credits, featured case study, co-marketing
- **Output:** Partnership with Sarvam

### Phase 5: Production — Phone Agent (Month 2-3)
- [ ] Integrate with Exotel (Indian telephony) or Twilio
- [ ] Patient dials a number → Dhairya picks up
- [ ] Add Saaras translation for caregiver English dashboard
- [ ] Partner with Kidwai/HCG to pilot with real patients
- **Output:** Real patients using Dhairya

---

## 8. Environment Setup

### .env file
```
SARVAM_API_KEY=your_sarvam_api_key
DAILY_API_KEY=your_daily_api_key          # For Pipecat transport
# OR
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_secret
LIVEKIT_URL=wss://your-livekit-server
```

### Quick Start
```bash
# Clone and setup
git clone https://github.com/yourusername/dhairya-2.0.git
cd dhairya-2.0
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys

# Generate story audio
python voice-agent/generate_audio.py

# Run the voice agent locally
python voice-agent/agent.py

# Run the backend
uvicorn backend.main:app --reload

# Frontend (separate terminal)
cd webapp && npm start
```

---

## 9. Cost Estimation (Sarvam API)

Based on Sarvam's pricing (approximate):

| API | Usage per Session (~5 min) | Cost per Session |
|---|---|---|
| Saarika STT | ~2.5 min audio | ~₹0.50 |
| Sarvam-M Chat | ~5 completions | ~₹0.25 |
| Bulbul TTS | ~2.5 min generated | ~₹0.50 |
| **Total per session** | | **~₹1.25** |

For 100 patients, 1 session/day = **₹125/day** = **₹3,750/month**

This is exactly why Sarvam should sponsor this — it's peanuts for them and incredible PR.

---

## 10. Ethical Guidelines

1. **No medical advice.** Dhairya is emotional support only.
2. **No data storage.** Conversations are not saved unless patient opts in.
3. **Crisis protocol.** Suicidal ideation → warm handoff to helpline.
4. **Transparency.** Patient knows this is AI, not a human.
5. **Consent.** Real survivor stories used only with explicit written consent.
6. **Privacy.** No PII collected. Anonymous sessions.
7. **Cultural sensitivity.** Respects all faiths, genders, backgrounds.
8. **Accessibility.** Phone-first design — no smartphone needed for production.

---

## 11. What to Build in Claude Code (IDE)

When you open your IDE with Claude Code, start with this sequence:

1. `mkdir dhairya-2.0 && cd dhairya-2.0 && git init`
2. Copy all story files from this project
3. Create `voice-agent/agent.py` — the Pipecat pipeline
4. Create `voice-agent/prompts.py` — the system prompt
5. Create `voice-agent/generate_audio.py` — story audio generator
6. Test the voice loop: speak Kannada → get Kannada response
7. Build the webapp
8. Deploy

The first coding task should be `generate_audio.py` — because hearing Meena Akka's story in Bulbul's Kannada voice will be the moment it becomes real.
