const { useState, useEffect, useRef, useCallback } = React;

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000" : "";

// ─── Story metadata for SVG icons + gradient colors ─────────────
const STORY_META = {
  // Survivors
  story_01_meena:       { gradient: ["#F8B4C8", "#E88BA0"], emoji: "\uD83C\uDF3A" },
  story_02_raju:        { gradient: ["#A8D5A2", "#7BB86F"], emoji: "\uD83C\uDF3E" },
  story_03_priya:       { gradient: ["#A8C8F0", "#6FA3E0"], emoji: "\uD83D\uDCBB" },
  story_04_shankarappa: { gradient: ["#D4C098", "#B8A070"], emoji: "\uD83D\uDC74" },
  story_05_lakshmi:     { gradient: ["#E8A8D0", "#D080B0"], emoji: "\uD83C\uDF3B" },
  story_06_arun:        { gradient: ["#90C8E8", "#60A8D0"], emoji: "\uD83D\uDCAA" },
  story_07_saraswati:   { gradient: ["#F0D8A8", "#E0C080"], emoji: "\uD83D\uDCDA" },
  story_08_vinay:       { gradient: ["#A8E0A8", "#70C870"], emoji: "\uD83C\uDFCF" },
  story_09_fatima:      { gradient: ["#C8B8E8", "#A898D0"], emoji: "\uD83E\uDD32" },
  story_10_mahesh:      { gradient: ["#C8D8A0", "#A0B878"], emoji: "\uD83C\uDF31" },
  // Celebrities
  celeb_01_shivarajkumar: { gradient: ["#FFD700", "#E8A800"], emoji: "\u2B50" },
  celeb_02_yuvraj:        { gradient: ["#4A90D9", "#2A70B9"], emoji: "\uD83C\uDFCF" },
  celeb_03_sonali:        { gradient: ["#FF8FA0", "#E06080"], emoji: "\uD83C\uDF1F" },
  celeb_04_manisha:       { gradient: ["#C8A0E0", "#A070C0"], emoji: "\uD83C\uDFAC" },
  celeb_05_gautami:       { gradient: ["#F0C878", "#D8A850"], emoji: "\uD83C\uDF3C" },
};

// ─── Audio Bar Visualizer ────────────────────────────────────────
function AudioWaveform({ audioRef, isPlaying }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const smoothRef = useRef(null);

  useEffect(() => {
    if (!isPlaying || !audioRef.current || !canvasRef.current) return;

    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 128;
        analyserRef.current.smoothingTimeConstant = 0.8;
        sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);
      } catch (e) {
        console.log("AudioContext setup error:", e);
        return;
      }
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const barCount = 32;
    if (!smoothRef.current || smoothRef.current.length !== barCount) {
      smoothRef.current = new Float32Array(barCount);
    }
    const smoothed = smoothRef.current;

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const centerY = h / 2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const totalGap = (barCount - 1) * 3;
      const barW = Math.max(2, (w - 40 - totalGap) / barCount);
      const startX = (w - barCount * barW - totalGap) / 2;

      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * bufferLength);
        const raw = dataArray[idx] / 255.0;
        smoothed[i] += (raw - smoothed[i]) * 0.15;
        const val = smoothed[i];

        const maxH = (h / 2) - 6;
        const barH = Math.max(2, val * maxH);
        const x = startX + i * (barW + 3);

        // Color gradient: terracotta → sage based on frequency
        const t = i / barCount;
        const r = Math.round(212 - t * 89);
        const g = Math.round(149 + t * 17);
        const b = Math.round(106 + t * 35);
        const alpha = 0.4 + val * 0.5;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

        // Mirror bars from center
        const radius = Math.min(barW / 2, 3);

        // Top half
        roundRect(ctx, x, centerY - barH, barW, barH, radius);
        ctx.fill();

        // Bottom half (mirror, slightly dimmer)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`;
        roundRect(ctx, x, centerY + 1, barW, barH * 0.6, radius);
        ctx.fill();
      }
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, audioRef]);

  // Set canvas size with devicePixelRatio for crisp rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 400 * dpr;
    canvas.height = 120 * dpr;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="waveform-canvas"
      style={{ width: 400, height: 120 }}
    />
  );
}

// ─── Listening Ripple Animation ──────────────────────────────────
function ListeningIndicator() {
  return (
    <div className="listening-indicator">
      <div className="ripple r1"></div>
      <div className="ripple r2"></div>
      <div className="ripple r3"></div>
      <div className="listening-core">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 3C10.34 3 9 4.37 9 6.07V12c0 1.66 1.34 3 3 3s3-1.34 3-3V6.07C15 4.37 13.66 3 12 3z" fill="#D4956A"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="#D4956A"/>
        </svg>
      </div>
    </div>
  );
}

// ─── SVG Character Silhouette ────────────────────────────────────
function CharacterAvatar({ storyId, size = 64 }) {
  const meta = STORY_META[storyId] || { gradient: ["#ccc", "#aaa"], emoji: "" };
  const [c1, c2] = meta.gradient;

  return (
    <div className="character-avatar" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64">
        <defs>
          <linearGradient id={`grad-${storyId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill={`url(#grad-${storyId})`} opacity="0.9" />
        <circle cx="32" cy="24" r="10" fill="white" opacity="0.7" />
        <ellipse cx="32" cy="48" rx="16" ry="12" fill="white" opacity="0.5" />
      </svg>
      <span className="avatar-emoji">{meta.emoji}</span>
    </div>
  );
}

// ─── Audio Progress Bar ──────────────────────────────────────────
function AudioProgressBar({ audioRef, isPlaying }) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const barRef = useRef(null);

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onTime() {
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
      setCurrentTime(formatTime(audio.currentTime));
    }
    function onMeta() { setDuration(formatTime(audio.duration)); }
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, [audioRef, isPlaying]);

  function seek(e) {
    const audio = audioRef.current;
    if (!audio || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  }

  return (
    <div className="progress-container">
      <span className="time-label">{currentTime}</span>
      <div className="progress-bar" ref={barRef} onClick={seek}>
        <div className="progress-fill" style={{ width: `${progress}%` }}>
          <div className="progress-dot"></div>
        </div>
      </div>
      <span className="time-label">{duration}</span>
    </div>
  );
}

// ─── Mode Button ─────────────────────────────────────────────────
function ModeButton({ label, sublabel, onClick, icon, desc }) {
  return (
    <button className="mode-btn" onClick={onClick}>
      <div className="mode-icon-wrap">
        <span className="mode-icon">{icon}</span>
      </div>
      <div className="mode-text">
        <span className="mode-label">{label}</span>
        <span className="mode-sublabel">{sublabel}</span>
        <span className="mode-desc">{desc}</span>
      </div>
    </button>
  );
}

// ─── Chat Message ────────────────────────────────────────────────
function ChatMessage({ role, text }) {
  return (
    <div className={`chat-msg ${role}`}>
      {role === "assistant" && (
        <div className="chat-avatar">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="15" fill="#D4956A" opacity="0.2"/>
            <text x="16" y="21" textAnchor="middle" fontSize="14" fill="#D4956A">&#x0CA7;</text>
          </svg>
        </div>
      )}
      <div className="chat-bubble">
        <p>{text}</p>
      </div>
    </div>
  );
}

// ─── Story Card ──────────────────────────────────────────────────
function StoryCard({ story, onPlay, isActive }) {
  const meta = STORY_META[story.id] || { gradient: ["#ccc", "#aaa"] };
  const [c1, c2] = meta.gradient;
  const isCeleb = story.category === "celebrity";
  const titleLine = story.title_kannada.split("\u2014")[1] || "";

  return (
    <div
      className={`story-card ${isActive ? "active" : ""} ${isCeleb ? "celeb" : ""}`}
      onClick={() => onPlay(story)}
      style={{ "--card-c1": c1, "--card-c2": c2 }}
    >
      <CharacterAvatar storyId={story.id} size={52} />
      <div className="story-info">
        <div className="story-name">
          {isCeleb && <span className="celeb-star">&#x2B50; </span>}
          {story.name_kannada}
        </div>
        {titleLine && <div className="story-title-line">{titleLine}</div>}
        <div className="story-meta">
          <span className="meta-tag">{story.cancer_type}</span>
          {story.location && (
            <React.Fragment>
              <span className="meta-dot">&middot;</span>
              <span>{story.location}</span>
            </React.Fragment>
          )}
          <span className="meta-dot">&middot;</span>
          <span>{story.age} yrs</span>
        </div>
      </div>
      <div className="story-play-btn">
        {isActive ? (
          <svg width="20" height="20" viewBox="0 0 20 20"><rect x="4" y="3" width="4" height="14" rx="1" fill="#D4956A"/><rect x="12" y="3" width="4" height="14" rx="1" fill="#D4956A"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20"><polygon points="5,3 17,10 5,17" fill="#D4956A"/></svg>
        )}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────
function App() {
  const [mode, setMode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [storyTab, setStoryTab] = useState("survivor"); // "survivor" or "celebrity"
  const [celebStories, setCelebStories] = useState([]);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const ttsAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track audio play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  async function createSession(selectedMode) {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode }),
      });
      const data = await res.json();
      setSessionId(data.session_id);
      return data.session_id;
    } catch (err) {
      console.error("Failed to create session:", err);
      return null;
    }
  }

  async function loadStories() {
    try {
      const [surRes, celRes] = await Promise.all([
        fetch(`${API_BASE}/api/stories/survivors`),
        fetch(`${API_BASE}/api/stories/celebrities`),
      ]);
      const survivors = await surRes.json();
      const celebs = await celRes.json();
      setStories(survivors);
      setCelebStories(celebs);
    } catch (err) {
      console.error("Failed to load stories:", err);
    }
  }

  async function loadStoryDetail(category, num) {
    try {
      const res = await fetch(`${API_BASE}/api/stories/${category}/${num}`);
      const data = await res.json();
      setStoryText(data.kannada_text);
    } catch (err) {
      setStoryText("");
    }
  }

  function goHome() {
    setMode(null);
    setSessionId(null);
    setCurrentStory(null);
    setStoryText("");
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
  }

  async function selectMode(m) {
    setMode(m);
    setMessages([]);
    setCurrentStory(null);
    setStoryText("");

    if (m === "story") {
      await loadStories();
    } else {
      const sid = await createSession(m === "talk" ? "conversation" : "courage");
      if (sid) {
        setMessages([{
          role: "assistant",
          text: m === "courage"
            ? "ನಮಸ್ಕಾರ. ನಾನು ಧೈರ್ಯ. ಇವತ್ತು ನಿಮಗೆ ಧೈರ್ಯದ ಮಾತು ಹೇಳ್ತೀನಿ. ಏನಾದರೂ ಹೇಳಿ, ಅಥವಾ 'ಧೈರ್ಯ ಕೊಡಿ' ಅಂತ ಹೇಳಿ."
            : "ನಮಸ್ಕಾರ. ನಾನು ಧೈರ್ಯ. ನಿಮ್ಮ ಜೊತೆಗಾರ್ತಿ. ನಿಮ್ಮ ಮನಸ್ಸಿನಲ್ಲಿ ಏನಿದೆ ಹೇಳಿ. ನಾನು ಕೇಳ್ತೀನಿ.",
        }]);
      }
    }
  }

  // Play TTS audio from base64
  function playTTSAudio(base64Audio) {
    if (!base64Audio || !ttsAudioRef.current) return;
    ttsAudioRef.current.src = `data:audio/wav;base64,${base64Audio}`;
    ttsAudioRef.current.play().catch(e => console.log("Auto-play blocked:", e));
  }

  // Toggle mic recording
  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // Start mic recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        stream.getTracks().forEach(t => t.stop());
        await sendVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  }

  // Stop mic recording
  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  // Send voice to /chat-voice
  async function sendVoiceMessage(audioBlob) {
    if (!sessionId) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const res = await fetch(`${API_BASE}/api/sessions/chat-voice`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.user_text) {
        setMessages(prev => [...prev, { role: "user", text: data.user_text }]);
      }
      setMessages(prev => [...prev, { role: "assistant", text: data.response_text }]);
      playTTSAudio(data.audio_base64);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "ಕ್ಷಮಿಸಿ, ಧ್ವನಿ ಕಳುಹಿಸಲು ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." }]);
    }
    setLoading(false);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sessions/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, text: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.response_text }]);
      playTTSAudio(data.audio_base64);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: "ಕ್ಷಮಿಸಿ, ಏನೋ ತೊಂದರೆ ಆಯ್ತು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." }]);
    }
    setLoading(false);
  }

  function getAudioUrl(story) {
    return `${API_BASE}/api/stories/${story.category}/${story.number}/audio`;
  }

  function playStory(story) {
    setCurrentStory(story);
    loadStoryDetail(story.category, story.number);
    if (story.has_audio && audioRef.current) {
      audioRef.current.src = getAudioUrl(story);
      audioRef.current.play();
    }
  }

  function togglePlayPause() {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className={`app ${mode ? "in-mode" : ""}`}>
      <audio ref={audioRef} crossOrigin="anonymous" />
      <audio ref={ttsAudioRef} />

      {/* ── Banner with title + Sarvam branding ── */}
      <div className="sarvam-banner" onClick={mode ? goHome : undefined}>
        <div className="banner-left">
          <h1 className="banner-title">ಧೈರ್ಯ</h1>
          <div className="banner-taglines">
            <p className="banner-tagline">ಸಾವು ಕೂಡ ನಿಮ್ಮನ್ನ ನೋಡಿದರೆ ಹೆದರಬೇಕು.</p>
            <p className="banner-tagline2">ನಿಮ್ಮ ಹೋರಾಟದಲ್ಲಿ ಕರ್ನಾಟಕದ ಜನತೆ ನಿಮ್ಮ ಜೊತೆ ಇದ್ದಾರೆ</p>
          </div>
        </div>
        <span className="banner-right">🎙️ Built with Sarvam AI Bulbul V3 · #TheMicIsYours</span>
      </div>

      {/* ── Back button when in mode ── */}
      {mode && (
        <div className="header">
          <button className="back-btn" onClick={goHome}>&larr; ಹಿಂದೆ</button>
        </div>
      )}

      {/* ── Home Screen — split layout ── */}
      {!mode && (
        <div className="home fade-in">
          <div className="home-split">
            {/* Left: Purpose & about */}
            <div className="home-left">
              <div className="home-purpose">
                <p className="purpose-lead">
                  ಕ್ಯಾನ್ಸರ್ ಎಂದರೆ ಒಂಟಿತನ ಅಲ್ಲ. ಇಡೀ ಕರ್ನಾಟಕ ನಿಮ್ಮ ಜೊತೆ ಇದೆ.
                </p>
                <p className="purpose-text">
                  ಮದುವೆಗೆ ಸಾವಿರ ಜನ ಕರೆಯುತ್ತೀರಿ. ನಾಮಕರಣಕ್ಕೆ ಐನೂರು. ಹಬ್ಬಕ್ಕೆ ಇಡೀ ಬೀದಿ. ಆದರೆ ಕ್ಯಾನ್ಸರ್ ಬಂದಾಗ? ಬಾಗಿಲು ಮುಚ್ಚಿ, ಒಬ್ಬರೇ ಅಳ್ತೀರಿ.
                </p>
                <p className="purpose-text purpose-highlight">
                  ಯಾಕೆ?
                </p>
                <p className="purpose-text">
                  ರಾತ್ರಿ ಎರಡು ಗಂಟೆ. ಆಸ್ಪತ್ರೆಯ ಬೆಡ್ ಮೇಲೆ ನಿದ್ದೆ ಬರ್ತಿಲ್ಲ. "ನಾನು ಬದುಕ್ತೀನಾ?" "ನನ್ನ ಮಕ್ಕಳ ಗತಿ ಏನು?" — ಈ ಮಾತುಗಳನ್ನ ಯಾರ ಹತ್ತಿರ ಹೇಳೋದು?
                </p>
                <p className="purpose-text">
                  ಧೈರ್ಯ ಇದ್ದಾಳೆ. ಮತ್ತು ಅವಳ ಹಿಂದೆ ಇಡೀ ಕರ್ನಾಟಕ ಇದೆ.
                </p>
                <p className="purpose-text">
                  ಮೈಸೂರಿನ ಮೀನಾ ಅಕ್ಕ ತಮ್ಮ ಕಥೆ ಹೇಳಿದ್ದಾರೆ — ನೀವು ಒಬ್ಬರೇ ಅಲ್ಲ ಅಂತ. ನಮ್ಮ ಶಿವಣ್ಣ ಕಿಮೋ ನಡುವೆಯೂ ಹೋರಾಡಿ ಗೆದ್ದಿದ್ದಾರೆ. ಯುವರಾಜ್‌ಗೆ ಆರು ತಿಂಗಳು ಅಂದರು — ಆದರೂ ಗೆದ್ದ. ಒಬ್ಬ ಅಪ್ಪ ತನ್ನ ಮಗಳ ಮದುವೆ ನೋಡಲು ಹೋರಾಡಿದ. ಒಬ್ಬ ಅಮ್ಮ ಮಕ್ಕಳಿಗೋಸ್ಕರ ಎದ್ದು ನಿಂತಳು.
                </p>
                <p className="purpose-text">
                  ನಿಮ್ಮ ಸಂತೋಷದಲ್ಲಿ ಜೊತೆ ನಿಲ್ಲೋರು ನಿಮ್ಮ ನೋವಿನಲ್ಲೂ ನಿಲ್ಲಬೇಕು ಅಂತ ಬಯಸ್ತಾರೆ. ಅವರಿಗೆ ಅವಕಾಶ ಕೊಡಿ. ಅವರ ಕಥೆ ಕೇಳಿ. ನಿಮ್ಮ ಕಥೆ ಹೇಳಿ. ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಯಾರಾದರೂ ಕ್ಯಾನ್ಸರ್ ಗೆದ್ದಿದ್ದರೆ — ಆ ಕಥೆ ಹಂಚಿಕೊಳ್ಳಿ. ಅದು ಇನ್ನೊಬ್ಬರ ಕತ್ತಲೆಯ ರಾತ್ರಿಯಲ್ಲಿ ದೀಪ ಆಗಬಹುದು.
                </p>
                <p className="purpose-text">
                  ಅಳಬೇಕಾ? ಅಳಿ. ಹೆದರಿಕೆ ಆಗ್ತಿದೆಯಾ? ಹೇಳಿ. ಧೈರ್ಯ ತಾಳ್ಮೆಯಿಂದ ಕೇಳುತ್ತಾಳೆ. ಇಲ್ಲಿ ಯಾವ ತೀರ್ಪೂ ಇಲ್ಲ.
                </p>
                <p className="purpose-text purpose-closing">
                  ಒಂದು ಕಥೆ ಕೇಳಿದರೆ ಕಣ್ಣೀರು ಬರುತ್ತೆ. ಹತ್ತು ಕಥೆ ಕೇಳಿದರೆ ಧೈರ್ಯ ಬರುತ್ತೆ. ಇಡೀ ಕರ್ನಾಟಕ ಸೇರಿದರೆ — ಕ್ಯಾನ್ಸರ್ ಗೆ ಸೋಲು ಬರುತ್ತೆ.
                </p>

                <div className="purpose-divider"></div>

                <ul className="purpose-features">
                  <li>
                    <span className="feature-icon">&#x1F399;</span>
                    <div>
                      <strong>ಕನ್ನಡ ಧ್ವನಿಯಲ್ಲಿ ಕಥೆಗಳು</strong>
                      <span className="feature-detail">ಮೈಸೂರು, ಧಾರವಾಡ, ಬೆಂಗಳೂರು, ಮಂಡ್ಯ ಮತ್ತು ಇತರ ಊರುಗಳಿಂದ</span>
                    </div>
                  </li>
                  <li>
                    <span className="feature-icon">&#x1F91D;</span>
                    <div>
                      <strong>AI ಜೊತೆಗಾರ</strong>
                      <span className="feature-detail">24/7 ಲಭ್ಯ — ರಾತ್ರಿಯ ಒಂಟಿತನದಲ್ಲೂ ನಿಮ್ಮ ಜೊತೆಗಿದೆ</span>
                    </div>
                  </li>
                  <li>
                    <span className="feature-icon">&#x1F512;</span>
                    <div>
                      <strong>ಸಂಪೂರ್ಣ ಖಾಸಗಿ</strong>
                      <span className="feature-detail">ಯಾವುದೇ ಹೆಸರು, ಫೋನ್ ನಂಬರ್, ಮಾಹಿತಿ ಕೇಳುವುದಿಲ್ಲ</span>
                    </div>
                  </li>
                  <li>
                    <span className="feature-icon">&#x1F3AF;</span>
                    <div>
                      <strong>Sarvam AI ತಂತ್ರಜ್ಞಾನ</strong>
                      <span className="feature-detail">ಭಾರತೀಯ ಭಾಷೆಗಳಿಗಾಗಿ ನಿರ್ಮಿಸಿದ AI — ನಿಮ್ಮ ಭಾಷೆ ಅರ್ಥ ಆಗುತ್ತದೆ</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="home-stats">
                <div className="stat"><span className="stat-num">15</span><span className="stat-label">ಕಥೆಗಳು</span></div>
                <div className="stat-divider"></div>
                <div className="stat"><span className="stat-num">3</span><span className="stat-label">ಅನುಭವಗಳು</span></div>
                <div className="stat-divider"></div>
                <div className="stat"><span className="stat-num">&infin;</span><span className="stat-label">ಧೈರ್ಯ</span></div>
              </div>
            </div>

            {/* Right: Mode buttons */}
            <div className="home-right">
              <div className="mode-buttons">
                <ModeButton
                  label="ಕಥೆ ಕೇಳಿ"
                  sublabel="Listen to Stories"
                  icon={<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#7BA68D" opacity="0.15"/><path d="M9 7v14l12-7z" fill="#7BA68D"/></svg>}
                  desc="15 stories — survivors + celebrity inspiration"
                  onClick={() => selectMode("story")}
                />
                <ModeButton
                  label="ನಿಮ್ಮ ಮಾತನ್ನು ಕೇಳಲು ಧೈರ್ಯ ಯಾವಾಗಲೂ ready"
                  sublabel="Share Your Pain"
                  icon={<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#D4956A" opacity="0.15"/><path d="M14 6C10.7 6 8 8.7 8 12c0 2.4 1.4 4.4 3.5 5.4L10 22l4-2 4 2-1.5-4.6C18.6 16.4 20 14.4 20 12c0-3.3-2.7-6-6-6z" fill="#D4956A" opacity="0.7"/></svg>}
                  desc="Speak freely, she listens"
                  onClick={() => selectMode("talk")}
                />
                <ModeButton
                  label="ನಿಮ್ಮ ಕಥೆ ಹೇಳಿ"
                  sublabel="ಹಲವರಿಗೆ ದೀಪ ಆಗಲಿ"
                  icon={<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#E8A87C" opacity="0.15"/><path d="M14 6c-1 0-3 2-3 5s1 5 3 8c2-3 3-5 3-8s-2-5-3-5z" fill="#E8A87C" opacity="0.7"/><path d="M14 22v-4" stroke="#E8A87C" strokeWidth="1.5"/></svg>}
                  desc="Share your cancer journey to inspire others"
                  onClick={() => selectMode("courage")}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Story Mode ── */}
      {mode === "story" && (
        <div className="stories-view fade-in">
          {currentStory ? (
            <div className="story-player">
              <div className="story-player-split">
                {/* Left: Audio player */}
                <div className="story-player-left">
                  <div className="player-header">
                    <CharacterAvatar storyId={currentStory.id} size={72} />
                    <div className="player-info">
                      <h3 className="player-name">{currentStory.name_kannada}</h3>
                      <p className="player-detail">{currentStory.cancer_type}{currentStory.location ? ` \u00B7 ${currentStory.location}` : ""}</p>
                    </div>
                  </div>

                  <div className="waveform-wrap">
                    <AudioWaveform audioRef={audioRef} isPlaying={isPlaying} />
                    {!isPlaying && <div className="waveform-idle">
                      <svg width="48" height="48" viewBox="0 0 48 48" onClick={togglePlayPause} style={{cursor:"pointer"}}>
                        <circle cx="24" cy="24" r="23" fill="#D4956A" opacity="0.15"/>
                        <polygon points="18,12 36,24 18,36" fill="#D4956A"/>
                      </svg>
                    </div>}
                  </div>

                  <AudioProgressBar audioRef={audioRef} isPlaying={isPlaying} />

                  <div className="player-controls">
                    <button className="ctrl-btn" onClick={togglePlayPause}>
                      {isPlaying ? "&#10074;&#10074; ನಿಲ್ಲಿಸಿ" : "&#9654; ಕೇಳಿ"}
                    </button>
                  </div>

                  <button className="back-to-list" onClick={() => { setCurrentStory(null); setStoryText(""); if (audioRef.current) { audioRef.current.pause(); } setIsPlaying(false); }}>
                    &larr; ಎಲ್ಲಾ ಕಥೆಗಳು
                  </button>
                </div>

                {/* Right: Story text */}
                <div className="story-player-right">
                  <h4 className="story-text-heading">ಕಥೆ</h4>
                  <div className="story-scroll">
                    <p className="story-text">{storyText || "..."}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <React.Fragment>
              <div className="stories-header">
                <h2 className="section-title">ಕಥೆಗಳು</h2>
                <p className="section-sub">Stories of courage — real and inspired</p>
              </div>

              <div className="story-tabs">
                <button
                  className={`story-tab ${storyTab === "survivor" ? "active" : ""}`}
                  onClick={() => setStoryTab("survivor")}
                >
                  ನಮ್ಮವರ ಕಥೆ
                  <span className="tab-sub">Inspired Stories</span>
                </button>
                <button
                  className={`story-tab ${storyTab === "celebrity" ? "active" : ""}`}
                  onClick={() => setStoryTab("celebrity")}
                >
                  ಸ್ಫೂರ್ತಿ ಕಥೆ
                  <span className="tab-sub">Celebrity Stories</span>
                </button>
              </div>

              {storyTab === "survivor" && (
                <React.Fragment>
                  <p className="stories-disclaimer">ಈ ಕಥೆಗಳು ನಿಜ ಅನುಭವಗಳಿಂದ ಪ್ರೇರಿತ &middot; Inspired by real experiences</p>
                  <div className="story-list">
                    {stories.map((s) => (
                      <StoryCard key={s.id} story={s} onPlay={playStory} isActive={currentStory?.id === s.id} />
                    ))}
                  </div>
                </React.Fragment>
              )}

              {storyTab === "celebrity" && (
                <React.Fragment>
                  <p className="stories-disclaimer">ನಿಜವಾದ ಕಥೆಗಳು &middot; Real celebrity cancer journeys</p>
                  <div className="story-list">
                    {celebStories.map((s) => (
                      <StoryCard key={s.id} story={s} onPlay={playStory} isActive={currentStory?.id === s.id} />
                    ))}
                  </div>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </div>
      )}

      {/* ── Chat Mode (Talk / Courage) — Development in progress ── */}
      {(mode === "talk" || mode === "courage") && (
        <div className="chat-view fade-in" style={{alignItems: "center", justifyContent: "center", minHeight: "400px"}}>
          <div style={{textAlign: "center", padding: "48px 24px"}}>
            <div style={{fontSize: "3rem", marginBottom: "16px"}}>
              {mode === "courage" ? "\uD83D\uDD25" : "\uD83C\uDF99\uFE0F"}
            </div>
            <h3 className="chat-mode-title" style={{marginBottom: "8px"}}>
              {mode === "courage" ? "ನಿಮ್ಮ ಕಥೆ ಹೇಳಿ" : "ನಿಮ್ಮ ಮಾತನ್ನು ಕೇಳಲು ಧೈರ್ಯ ಯಾವಾಗಲೂ ready"}
            </h3>
            <p style={{fontSize: "1.1rem", color: "var(--primary-dark)", fontWeight: 600, marginBottom: "12px"}}>
              Development in progress
            </p>
            <p style={{fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6}}>
              ಈ ವೈಶಿಷ್ಟ್ಯವನ್ನು ಶೀಘ್ರದಲ್ಲೇ ತರಲಾಗುವುದು. ದಯವಿಟ್ಟು ಕಾಯಿರಿ.
            </p>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          Powered by <a href="https://www.sarvam.ai" target="_blank" rel="noopener">Sarvam AI</a>
          <span className="footer-sep">&middot;</span>
          No medical advice
          <span className="footer-sep">&middot;</span>
          Anonymous &amp; private
        </p>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
