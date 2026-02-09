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
  // Bharatada Spoorthi (Indian celebrities)
  sanjay_dutt:        { gradient: ["#D4956A", "#B87A50"], emoji: "\uD83C\uDFAC" },
  lisa_ray:           { gradient: ["#E8A0C0", "#D080A0"], emoji: "\uD83C\uDF1F" },
  tahira_kashyap:     { gradient: ["#F0B888", "#D89868"], emoji: "\u270D\uFE0F" },
  rakesh_roshan:      { gradient: ["#C8A878", "#A88858"], emoji: "\uD83C\uDFAC" },
  anurag_basu:        { gradient: ["#A8C0D8", "#88A0B8"], emoji: "\uD83C\uDFA5" },
  mumtaz:             { gradient: ["#E8B0B0", "#D09090"], emoji: "\uD83C\uDF39" },
  chhavi_mittal:      { gradient: ["#B8D8A8", "#98B888"], emoji: "\uD83D\uDCFA" },
  mahima_chaudhry:    { gradient: ["#D8C0A8", "#B8A088"], emoji: "\uD83C\uDFA6" },
  nafisa_ali:         { gradient: ["#A8D0D0", "#88B0B0"], emoji: "\uD83C\uDFCA" },
  manisha_koirala_v2: { gradient: ["#C8A0E0", "#A880C0"], emoji: "\uD83C\uDFAC" },
  // Vishwa Spoorthi (International celebrities)
  robert_deniro:       { gradient: ["#8899AA", "#667788"], emoji: "\uD83C\uDFAC" },
  michael_douglas:     { gradient: ["#A0B8A0", "#809880"], emoji: "\uD83C\uDFC6" },
  ben_stiller:         { gradient: ["#E8C888", "#C8A868"], emoji: "\uD83D\uDE02" },
  mark_ruffalo:        { gradient: ["#88B088", "#689068"], emoji: "\uD83D\uDCAA" },
  christina_applegate: { gradient: ["#E0A0B8", "#C08098"], emoji: "\uD83C\uDF1F" },
  sheryl_crow:         { gradient: ["#D8B898", "#B89878"], emoji: "\uD83C\uDFB5" },
  fran_drescher:       { gradient: ["#C8B0D8", "#A890B8"], emoji: "\uD83D\uDCFA" },
  robin_roberts:       { gradient: ["#A8B8D0", "#8898B0"], emoji: "\uD83D\uDCF0" },
  sharon_osbourne:     { gradient: ["#D0A0A0", "#B08080"], emoji: "\uD83C\uDFA4" },
  rod_stewart:         { gradient: ["#C8A080", "#A88060"], emoji: "\uD83C\uDFB6" },
  kylie_minogue:       { gradient: ["#E0B0C8", "#C090A8"], emoji: "\uD83C\uDFB5" },
  martina_navratilova: { gradient: ["#A0C8A0", "#80A880"], emoji: "\uD83C\uDFBE" },
  mr_t:                { gradient: ["#B8A888", "#988868"], emoji: "\uD83D\uDCAA" },
  kathy_bates:         { gradient: ["#C0A8C8", "#A088A8"], emoji: "\uD83C\uDFC6" },
  sofia_vergara:       { gradient: ["#E8C0A0", "#C8A080"], emoji: "\uD83C\uDF1F" },
  cynthia_nixon:       { gradient: ["#B0C0D0", "#90A0B0"], emoji: "\uD83C\uDFA5" },
  jeff_bridges:        { gradient: ["#A0B0A0", "#809080"], emoji: "\uD83C\uDFAC" },
  michael_c_hall:      { gradient: ["#B8A8B8", "#988898"], emoji: "\uD83D\uDCFA" },
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
  const isCeleb = story.category === "celebrity" || story.category === "bharatada_spoorthi" || story.category === "vishwa_spoorthi";
  const titleLine = (story.title_kannada || "").split("\u2014")[1] || "";

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
          {story.age > 0 && (
            <React.Fragment>
              <span className="meta-dot">&middot;</span>
              <span>{story.age} yrs</span>
            </React.Fragment>
          )}
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
  const [bharatStories, setBharatStories] = useState([]);
  const [vishwaStories, setVishwaStories] = useState([]);
  const [companionState, setCompanionState] = useState("ready"); // ready|recording|processing|playing|error
  const [courageStep, setCourageStep] = useState("intro"); // intro|recording|transcribing|reviewing|submitting|done
  const [courageTranscript, setCourageTranscript] = useState("");
  const [courageAudioBlob, setCourageAudioBlob] = useState(null);
  const [courageTimer, setCourageTimer] = useState(0);
  const [courageMeta, setCourageMeta] = useState({ name: "", relation: "", cancer_type: "" });
  const [communityStories, setCommunityStories] = useState([]);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const ttsAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const courageTimerRef = useRef(null);

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
      const [surRes, celRes, bharatRes, vishwaRes] = await Promise.all([
        fetch(`${API_BASE}/api/stories/survivors`),
        fetch(`${API_BASE}/api/stories/celebrities`),
        fetch(`${API_BASE}/api/json-stories/bharatada_spoorthi`),
        fetch(`${API_BASE}/api/json-stories/vishwa_spoorthi`),
      ]);
      const survivors = await surRes.json();
      const celebs = await celRes.json();
      setStories(survivors);
      setCelebStories(celebs);
      // Normalize JSON stories to match StoryCard's expected shape
      const normalizeJson = (list) => list.map((s) => ({
        ...s,
        _json: true,
        name_kannada: s.name,
        name_english: s.name_en,
        title_kannada: "",
        title_english: s.name_en,
        cancer_type: s.cancer_type_en || s.cancer_type,
        age: 0,
        location: s.field || "",
      }));
      if (bharatRes.ok) setBharatStories(normalizeJson(await bharatRes.json()));
      if (vishwaRes.ok) setVishwaStories(normalizeJson(await vishwaRes.json()));
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

  function goBack() {
    // If viewing a story, go back to story list instead of home
    if (currentStory) {
      setCurrentStory(null);
      setStoryText("");
      setIsPlaying(false);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      return;
    }
    // Otherwise go home
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
    } else if (m === "talk") {
      setCompanionState("ready");
      const sid = await createSession("conversation");
      if (sid) {
        setMessages([{
          role: "assistant",
          text: "\u0CA8\u0CAE\u0CB8\u0CCD\u0C95\u0CBE\u0CB0. \u0CA8\u0CBE\u0CA8\u0CC1 \u0CA7\u0CC8\u0CB0\u0CCD\u0CAF. \u0CA8\u0CBF\u0CAE\u0CCD\u0CAE \u0CAE\u0CA8\u0CB8\u0CCD\u0CB8\u0CBF\u0CA8\u0CB2\u0CCD\u0CB2\u0CBF \u0C8F\u0CA8\u0CBF\u0CA6\u0CCD\u0CA6\u0CB0\u0CC6 \u0CB9\u0CC7\u0CB3\u0CBF. \u0CA8\u0CBE\u0CA8\u0CC1 \u0C87\u0CB2\u0CCD\u0CB2\u0CC7 \u0C87\u0CA6\u0CCD\u0CA6\u0CC0\u0CA8\u0CBF, \u0CA4\u0CBE\u0CB3\u0CCD\u0CAE\u0CC6\u0CAF\u0CBF\u0C82\u0CA6 \u0C95\u0CC7\u0CB3\u0CCD\u0CA4\u0CC0\u0CA8\u0CBF.",
        }]);
      }
    } else if (m === "courage") {
      setCourageStep("intro");
      setCourageTranscript("");
      setCourageAudioBlob(null);
      setCourageTimer(0);
      setCourageMeta({ name: "", relation: "", cancer_type: "" });
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

  // ─── Companion (Talk Mode) voice handling ─────────────────────
  function handleCompanionMic() {
    if (companionState === "recording") {
      stopCompanionRecording();
    } else if (companionState === "ready") {
      startCompanionRecording();
    }
  }

  async function startCompanionRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearTimeout(recordingTimerRef.current);
        setCompanionState("processing");
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        await sendCompanionVoice(audioBlob);
      };

      mediaRecorder.start();
      setCompanionState("recording");

      // Auto-stop after 30 seconds
      recordingTimerRef.current = setTimeout(() => {
        stopCompanionRecording();
      }, 30000);
    } catch (err) {
      console.error("Mic access denied:", err);
      setCompanionState("error");
      setTimeout(() => setCompanionState("ready"), 2000);
    }
  }

  function stopCompanionRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function sendCompanionVoice(audioBlob) {
    if (!sessionId) return;
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

      if (data.audio_base64 && ttsAudioRef.current) {
        setCompanionState("playing");
        ttsAudioRef.current.src = `data:audio/wav;base64,${data.audio_base64}`;
        ttsAudioRef.current.onended = () => setCompanionState("ready");
        ttsAudioRef.current.play().catch(() => setCompanionState("ready"));
      } else {
        setCompanionState("ready");
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "\u0C95\u0CCD\u0CB7\u0CAE\u0CBF\u0CB8\u0CBF, \u0C8F\u0CA8\u0CCB \u0CA4\u0CCA\u0C82\u0CA6\u0CB0\u0CC6 \u0C86\u0CAF\u0CCD\u0CA4\u0CC1. \u0CAE\u0CA4\u0CCD\u0CA4\u0CC6 \u0CAA\u0CCD\u0CB0\u0CAF\u0CA4\u0CCD\u0CA8\u0CBF\u0CB8\u0CBF." }]);
      setCompanionState("error");
      setTimeout(() => setCompanionState("ready"), 2000);
    }
  }

  // ─── Courage (Community Stories) recording ───────────────────
  async function startCourageRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setCourageTimer(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(courageTimerRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setCourageAudioBlob(audioBlob);
        setCourageStep("transcribing");

        // Transcribe the recording
        const formData = new FormData();
        formData.append("audio", audioBlob, "story.webm");
        try {
          const res = await fetch(`${API_BASE}/api/community/transcribe`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          setCourageTranscript(data.transcript || "");
          setCourageStep("reviewing");
        } catch (err) {
          setCourageTranscript("");
          setCourageStep("reviewing");
        }
      };

      mediaRecorder.start();
      setCourageStep("recording");

      // Timer
      courageTimerRef.current = setInterval(() => {
        setCourageTimer(prev => {
          if (prev >= 29) {
            // Auto-stop at 30 seconds
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
            }
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  }

  function stopCourageRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function submitCourageStory() {
    setCourageStep("submitting");
    const formData = new FormData();
    formData.append("transcript", courageTranscript);
    formData.append("name", courageMeta.name || "\u0C85\u0CA8\u0CBE\u0CAE\u0CBF\u0C95");
    formData.append("relation", courageMeta.relation);
    formData.append("cancer_type", courageMeta.cancer_type);

    try {
      const res = await fetch(`${API_BASE}/api/community/submit`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setCourageStep("done");
      }
    } catch (err) {
      setCourageStep("reviewing"); // Go back to review on error
    }
  }

  async function loadCommunityStories() {
    try {
      const res = await fetch(`${API_BASE}/api/community`);
      const data = await res.json();
      setCommunityStories(data);
    } catch (err) {
      setCommunityStories([]);
    }
  }

  function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
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
    // JSON stories use /api/json-stories/{category}/{id}/audio
    if (story._json) {
      return `${API_BASE}/api/json-stories/${story.category}/${story.id}/audio`;
    }
    return `${API_BASE}/api/stories/${story.category}/${story.number}/audio`;
  }

  function playStory(story) {
    setCurrentStory(story);
    // JSON stories carry story_text directly
    if (story._json) {
      setStoryText(story.story_text || "");
    } else {
      loadStoryDetail(story.category, story.number);
    }
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
      <div className="sarvam-banner" onClick={mode ? goBack : undefined}>
        <div className="banner-left">
          <h1 className="banner-title">ಧೈರ್ಯ</h1>
          <div className="banner-taglines">
            <p className="banner-tagline">ಕ್ಯಾನ್ಸರ್ ಕೂಡ ನಿಮ್ಮನ್ನ ನೋಡಿದರೆ ಹೆದರಬೇಕು.</p>
            <p className="banner-tagline2">ನಿಮ್ಮ ಹೋರಾಟದಲ್ಲಿ ಎಲ್ಲರೂ ನಿಮ್ಮ ಜೊತೆ</p>
          </div>
        </div>
        <span className="banner-right">🎙️ Built with Sarvam AI Bulbul V3 · #TheMicIsYours</span>
      </div>

      {/* ── Back button when in mode ── */}
      {mode && (
        <div className="header">
          <button className="back-btn" onClick={goBack}>&larr; ಹಿಂದೆ</button>
        </div>
      )}

      {/* ── Home Screen — split layout ── */}
      {!mode && (
        <div className="home fade-in">
          <div className="home-split">
            {/* Left: Purpose & about */}
            <div className="home-left">
              <div className="home-purpose">
                <p className="purpose-text purpose-opener">
                  ಮದುವೆಗೆ <strong>ಸಾವಿರ ಜನ</strong> ಕರೆಯುತ್ತೀವಿ. ನಾಮಕರಣಕ್ಕೆ <strong>ಐನೂರು</strong>. ಹಬ್ಬಕ್ಕೆ <strong>ಇಡೀ ಬೀದಿ</strong>.
                </p>
                <p className="purpose-text purpose-punch">
                  ಆದರೆ ಕ್ಯಾನ್ಸರ್ ಬಂದ್ರೆ? <span className="accent-text">ಒಬ್ಬರೇ ಅನುಭವಿಸುತ್ತೀವಿ</span>.
                </p>
                <p className="purpose-highlight">
                  ಯಾಕೆ?
                </p>
                <p className="purpose-text">
                  ನಿಮ್ಮ ಈ ಕ್ಯಾನ್ಸರ್ ಜೊತೆಗಿನ ಹೋರಾಟದಲ್ಲಿ — ನಿಮ್ಮ ಮನೆಯವರು, ಸ್ನೇಹಿತರು, ಸಂಬಂಧಿಗಳು, ಹಿತೈಷಿಗಳು <strong>ಎಲ್ಲರೂ ಬೇಕು</strong>. ಅವರ ಪ್ರತಿ ಪ್ರಾರ್ಥನೆ, ದೊಡ್ಡವರ ಆಶೀರ್ವಾದ, ನೀವು ನಂಬೋ ಆ ಭಗವಂತನ ಕೃಪೆ — <strong>ಎಲ್ಲವೂ ಬೇಕು</strong>.
                </p>
                <p className="purpose-text">
                  ಇವೆಲ್ಲದರ ಜೊತೆಗೆ — ನಿಮ್ಮ ಹಾಗೆ ಕ್ಯಾನ್ಸರ್ ಜೊತೆ ಹೋರಾಡ್ತಿರೋರು, ಅದನ್ನ ಗೆದ್ದಿದ್ರೋರ ಕಥೆಗಳು ನಿಮಗೆ ಬೇಕಿರೋ ಧೈರ್ಯ ಕೊಡಲಿ ಅನ್ನೋ ಒಂದು ಚಿಕ್ಕ ಪ್ರಯತ್ನ ಈ <span className="accent-text">ಧೈರ್ಯ ವೇದಿಕೆ</span>.
                </p>
                <p className="purpose-text purpose-cta">
                  <strong>ಬನ್ನಿ</strong>. <strong>ನಿಮ್ಮ ಕಥೆ ಹೇಳಿ</strong>. <strong>ಬೇರೆಯವರ ಕಥೆ ಕೇಳಿ</strong>.
                </p>
                <p className="purpose-text purpose-closing">
                  ನಿಮ್ಮ ಧೈರ್ಯ ನೋಡಿ ಕ್ಯಾನ್ಸರ್ ಕೂಡ ನಿಮ್ಮನ್ನ ಬಿಟ್ಟು <span className="accent-text">ಓಡಿ ಹೋಗ್ಲಿ</span>...
                </p>
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

          {/* Bottom: Features + Stats below experience tiles */}
          <div className="home-bottom">
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
                  <strong>AI ಜೊತೆಗಾರ್ತಿ</strong>
                  <span className="feature-detail">24/7 ಲಭ್ಯ — ರಾತ್ರಿಯ ಒಂಟಿತನದಲ್ಲೂ ನಿಮ್ಮ ಜೊತೆ</span>
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

            <div className="home-stats">
              <div className="stat"><span className="stat-num">43</span><span className="stat-label">ಕಥೆಗಳು</span></div>
              <div className="stat-divider"></div>
              <div className="stat"><span className="stat-num">3</span><span className="stat-label">ಅನುಭವಗಳು</span></div>
              <div className="stat-divider"></div>
              <div className="stat"><span className="stat-num">&infin;</span><span className="stat-label">ಧೈರ್ಯ</span></div>
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
                  className={`story-tab ${storyTab === "bharat" ? "active" : ""}`}
                  onClick={() => setStoryTab("bharat")}
                >
                  {"\u0CAD\u0CBE\u0CB0\u0CA4\u0CA6 \u0CB8\u0CCD\u0CAB\u0CC2\u0CB0\u0CCD\u0CA4\u0CBF"}
                  <span className="tab-sub">Indian Inspiration</span>
                </button>
                <button
                  className={`story-tab ${storyTab === "vishwa" ? "active" : ""}`}
                  onClick={() => setStoryTab("vishwa")}
                >
                  {"\u0CB5\u0CBF\u0CB6\u0CCD\u0CB5 \u0CB8\u0CCD\u0CAB\u0CC2\u0CB0\u0CCD\u0CA4\u0CBF"}
                  <span className="tab-sub">World Inspiration</span>
                </button>
                <button
                  className={`story-tab ${storyTab === "community" ? "active" : ""}`}
                  onClick={() => { setStoryTab("community"); loadCommunityStories(); }}
                >
                  ಸಮುದಾಯದ ಕಥೆ
                  <span className="tab-sub">Community Stories</span>
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

              {storyTab === "bharat" && (
                <React.Fragment>
                  <p className="stories-disclaimer">{"\u0CAD\u0CBE\u0CB0\u0CA4\u0CA6 \u0CA4\u0CBE\u0CB0\u0CC6\u0CAF\u0CB0 \u0C95\u0CCD\u0CAF\u0CBE\u0CA8\u0CCD\u0CB8\u0CB0\u0CCD \u0C97\u0CC6\u0CB2\u0CC1\u0CB5\u0CBF\u0CA8 \u0C95\u0CA5\u0CC6\u0C97\u0CB3\u0CC1"} &middot; Indian cancer survivors</p>
                  <div className="story-list">
                    {[...celebStories, ...bharatStories].map((s) => (
                      <StoryCard key={s.id} story={s} onPlay={playStory} isActive={currentStory?.id === s.id} />
                    ))}
                  </div>
                </React.Fragment>
              )}

              {storyTab === "vishwa" && (
                <React.Fragment>
                  <p className="stories-disclaimer">{"\u0CB5\u0CBF\u0CB6\u0CCD\u0CB5\u0CA6 \u0CA4\u0CBE\u0CB0\u0CC6\u0CAF\u0CB0 \u0C95\u0CCD\u0CAF\u0CBE\u0CA8\u0CCD\u0CB8\u0CB0\u0CCD \u0C97\u0CC6\u0CB2\u0CC1\u0CB5\u0CBF\u0CA8 \u0C95\u0CA5\u0CC6\u0C97\u0CB3\u0CC1"} &middot; International cancer survivors</p>
                  <div className="story-list">
                    {vishwaStories.map((s) => (
                      <StoryCard key={s.id} story={s} onPlay={playStory} isActive={currentStory?.id === s.id} />
                    ))}
                  </div>
                </React.Fragment>
              )}

              {storyTab === "community" && (
                <React.Fragment>
                  <p className="stories-disclaimer">{"\u0CB8\u0CAE\u0CC1\u0CA6\u0CBE\u0CAF\u0CA6\u0CB5\u0CB0 \u0C85\u0CA8\u0CC1\u0CAD\u0CB5\u0C97\u0CB3\u0CC1"} &middot; Stories shared by our community</p>
                  {communityStories.length === 0 ? (
                    <div className="community-empty">
                      <p>{"\u0C87\u0CA8\u0CCD\u0CA8\u0CC2 \u0CAF\u0CBE\u0CB0\u0CC2 \u0C95\u0CA5\u0CC6 \u0CB9\u0C82\u0C9A\u0CBF\u0C95\u0CCA\u0C82\u0CA1\u0CBF\u0CB2\u0CCD\u0CB2."}</p>
                      <button className="community-share-btn" onClick={() => selectMode("courage")}>
                        {"\uD83C\uDF99\uFE0F \u0CA8\u0CBF\u0CAE\u0CCD\u0CAE \u0C95\u0CA5\u0CC6 \u0CB9\u0CC7\u0CB3\u0CBF"}
                      </button>
                    </div>
                  ) : (
                    <div className="story-list">
                      {communityStories.map((cs) => (
                        <div
                          key={cs.id}
                          className="story-card community-card"
                          onClick={() => {
                            if (cs.has_audio && audioRef.current) {
                              audioRef.current.src = `${API_BASE}/api/community/${cs.id}/audio`;
                              audioRef.current.play();
                            }
                          }}
                        >
                          <div className="character-avatar" style={{width: 52, height: 52}}>
                            <svg width="52" height="52" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="30" fill="#E8A87C" opacity="0.3"/>
                              <circle cx="32" cy="24" r="10" fill="white" opacity="0.7"/>
                              <ellipse cx="32" cy="48" rx="16" ry="12" fill="white" opacity="0.5"/>
                            </svg>
                          </div>
                          <div className="story-info">
                            <div className="story-name">{cs.name}</div>
                            <div className="story-title-line">{cs.transcript_preview}</div>
                            <div className="story-meta">
                              {cs.relation && <span className="meta-tag">{cs.relation}</span>}
                              {cs.cancer_type && (
                                <React.Fragment>
                                  <span className="meta-dot">&middot;</span>
                                  <span>{cs.cancer_type}</span>
                                </React.Fragment>
                              )}
                            </div>
                          </div>
                          <div className="story-play-btn">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                              <polygon points="5,3 17,10 5,17" fill="#D4956A"/>
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </div>
      )}

      {/* ── Talk Mode — Voice Companion ── */}
      {mode === "talk" && (
        <div className="companion-view fade-in">
          {/* Conversation area */}
          <div className="companion-messages">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} text={msg.text} />
            ))}
            {companionState === "processing" && (
              <div className="chat-msg assistant">
                <div className="chat-avatar">
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="15" fill="#D4956A" opacity="0.2"/>
                    <text x="16" y="21" textAnchor="middle" fontSize="14" fill="#D4956A">&#x0CA7;</text>
                  </svg>
                </div>
                <div className="chat-bubble">
                  <div className="typing-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Mic button */}
          <div className="companion-controls">
            <button
              className={`companion-mic-btn ${companionState}`}
              onClick={handleCompanionMic}
              disabled={companionState === "processing" || companionState === "playing"}
            >
              {companionState === "recording" ? (
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <rect x="8" y="8" width="6" height="16" rx="2" fill="white"/>
                  <rect x="18" y="8" width="6" height="16" rx="2" fill="white"/>
                </svg>
              ) : companionState === "processing" ? (
                <div className="mic-spinner"></div>
              ) : companionState === "playing" ? (
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <path d="M8 13v6h4l5 5V8l-5 5H8z" fill="white"/>
                  <path d="M22 10.5c1.3 1.3 2 3 2 5.5s-.7 4.2-2 5.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M25 8c2 2 3 4.7 3 8s-1 6-3 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <path d="M16 4c-2 0-4 1.8-4 4v8c0 2.2 1.8 4 4 4s4-1.8 4-4V8c0-2.2-2-4-4-4z" fill="white"/>
                  <path d="M24 15c0 4.4-3.6 8-8 8s-8-3.6-8-8" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <p className="companion-mic-label">
              {companionState === "ready" && "\uD83C\uDF99\uFE0F \u0CAE\u0CBE\u0CA4\u0CBE\u0CA1\u0CB2\u0CC1 \u0C92\u0CA4\u0CCD\u0CA4\u0CBF"}
              {companionState === "recording" && "\uD83D\uDD34 \u0C95\u0CC7\u0CB3\u0CCD\u0CA4\u0CBF\u0CA6\u0CCD\u0CA6\u0CC7\u0CA8\u0CC1..."}
              {companionState === "processing" && "\uD83D\uDCAD \u0CA7\u0CC8\u0CB0\u0CCD\u0CAF \u0CAF\u0CCB\u0C9A\u0CBF\u0CB8\u0CCD\u0CA4\u0CBF\u0CA6\u0CCD\u0CA6\u0CBE\u0CB3\u0CC6..."}
              {companionState === "playing" && "\uD83D\uDD0A \u0CA7\u0CC8\u0CB0\u0CCD\u0CAF \u0CAE\u0CBE\u0CA4\u0CBE\u0CA1\u0CCD\u0CA4\u0CBF\u0CA6\u0CCD\u0CA6\u0CBE\u0CB3\u0CC6..."}
              {companionState === "error" && "\u26A0\uFE0F \u0CAE\u0CA4\u0CCD\u0CA4\u0CC6 \u0CAA\u0CCD\u0CB0\u0CAF\u0CA4\u0CCD\u0CA8\u0CBF\u0CB8\u0CBF"}
            </p>
          </div>

          {/* Text input fallback */}
          <form className="companion-text-input" onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"\u0C95\u0CA8\u0CCD\u0CA8\u0CA1\u0CA6\u0CB2\u0CCD\u0CB2\u0CBF \u0C9F\u0CC8\u0CAA\u0CCD \u0CAE\u0CBE\u0CA1\u0CBF..."}
              disabled={loading || companionState === "processing"}
            />
            <button type="submit" disabled={!input.trim() || loading}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M2 16l14-7L2 2v5.5l10 1.5-10 1.5z" fill="white"/>
              </svg>
            </button>
          </form>

          <p className="companion-disclaimer">
            {"\u26A0\uFE0F \u0C87\u0CA6\u0CC1 AI \u0C9C\u0CCA\u0CA4\u0CC6\u0C97\u0CBE\u0CB0\u0CCD\u0CA4\u0CBF \u00B7 \u0CB5\u0CC8\u0CA6\u0CCD\u0CAF\u0C95\u0CC0\u0CAF \u0CB8\u0CB2\u0CB9\u0CC6 \u0C85\u0CB2\u0CCD\u0CB2 \u00B7 Built with Sarvam AI Bulbul V3"}
          </p>
        </div>
      )}

      {/* ── Courage Mode — Community Stories ── */}
      {mode === "courage" && (
        <div className="courage-view fade-in">
          {/* Step 1: Introduction */}
          {courageStep === "intro" && (
            <div className="courage-intro">
              <div className="courage-intro-icon">{"\uD83C\uDF99\uFE0F"}</div>
              <h3 className="courage-title">{"\u0CA8\u0CBF\u0CAE\u0CCD\u0CAE \u0C95\u0CA5\u0CC6 \u0C87\u0CA8\u0CCD\u0CA8\u0CCA\u0CAC\u0CCD\u0CAC\u0CB0 \u0CA7\u0CC8\u0CB0\u0CCD\u0CAF \u0C86\u0C97\u0CAC\u0CB9\u0CC1\u0CA6\u0CC1."}</h3>
              <p className="courage-subtitle">Your story can become someone else's courage.</p>

              <div className="courage-prompts">
                <p className="courage-prompt-title">{"\u0C8F\u0CA8\u0CC1 \u0CB9\u0CC7\u0CB3\u0CAC\u0CB9\u0CC1\u0CA6\u0CC1:"}</p>
                <ul>
                  <li>{"\u0CA8\u0CBF\u0CAE\u0CCD\u0CAE \u0C95\u0CCD\u0CAF\u0CBE\u0CA8\u0CCD\u0CB8\u0CB0\u0CCD \u0C85\u0CA8\u0CC1\u0CAD\u0CB5 \u0CB9\u0CC7\u0C97\u0CBF\u0CA4\u0CCD\u0CA4\u0CC1?"}</li>
                  <li>{"\u0CAF\u0CBE\u0CB5 \u0C95\u0CCD\u0CB7\u0CA3 \u0CA8\u0CBF\u0CAE\u0C97\u0CC6 \u0CA7\u0CC8\u0CB0\u0CCD\u0CAF \u0C95\u0CCA\u0C9F\u0CCD\u0C9F\u0CBF\u0CA4\u0CC1?"}</li>
                  <li>{"\u0C87\u0CA8\u0CCD\u0CA8\u0CCA\u0CAC\u0CCD\u0CAC \u0CB0\u0CCB\u0C97\u0CBF\u0C97\u0CC6 \u0CA8\u0CC0\u0CB5\u0CC1 \u0C8F\u0CA8\u0CC1 \u0CB9\u0CC7\u0CB3\u0CCD\u0CA4\u0CC0\u0CB0\u0CBF?"}</li>
                </ul>
              </div>

              <div className="courage-meta-form">
                <input
                  type="text"
                  placeholder={"\u0CB9\u0CC6\u0CB8\u0CB0\u0CC1 (\u0C85\u0CA5\u0CB5\u0CBE \u0C85\u0CA8\u0CBE\u0CAE\u0CBF\u0C95)"}
                  value={courageMeta.name}
                  onChange={(e) => setCourageMeta(prev => ({...prev, name: e.target.value}))}
                />
                <select
                  value={courageMeta.relation}
                  onChange={(e) => setCourageMeta(prev => ({...prev, relation: e.target.value}))}
                >
                  <option value="">{"\u0CA8\u0CBE\u0CA8\u0CC1..."}</option>
                  <option value="patient">{"\u0C95\u0CCD\u0CAF\u0CBE\u0CA8\u0CCD\u0CB8\u0CB0\u0CCD \u0CB0\u0CCB\u0C97\u0CBF"}</option>
                  <option value="survivor">{"\u0C95\u0CCD\u0CAF\u0CBE\u0CA8\u0CCD\u0CB8\u0CB0\u0CCD \u0C97\u0CC6\u0CA6\u0CCD\u0CA6\u0CB5\u0CB0\u0CC1"}</option>
                  <option value="family">{"\u0C95\u0CC1\u0C9F\u0CC1\u0C82\u0CAC\u0CA6\u0CB5\u0CB0\u0CC1"}</option>
                </select>
              </div>

              <button className="courage-record-btn" onClick={startCourageRecording}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="6" fill="white"/>
                </svg>
                {"\u0C95\u0CA5\u0CC6 \u0CB9\u0CC7\u0CB3\u0CB2\u0CC1 \u0C92\u0CA4\u0CCD\u0CA4\u0CBF"}
              </button>
              <p className="courage-hint">{"\u0C97\u0CB0\u0CBF\u0CB7\u0CCD\u0C9F 30 \u0CB8\u0CC6\u0C95\u0CC6\u0C82\u0CA1\u0CCD"}</p>
            </div>
          )}

          {/* Step 2: Recording */}
          {courageStep === "recording" && (
            <div className="courage-recording">
              <div className="courage-rec-indicator">
                <div className="courage-rec-ring"></div>
                <div className="courage-rec-dot"></div>
              </div>
              <p className="courage-timer">{formatTimer(courageTimer)} / 0:30</p>
              <p className="courage-rec-label">{"\uD83D\uDD34 \u0CB9\u0CC7\u0CB3\u0CCD\u0CA4\u0CBF\u0CA6\u0CCD\u0CA6\u0CC0\u0CB0\u0CBF..."}</p>
              <button className="courage-stop-btn" onClick={stopCourageRecording}>
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <rect x="4" y="4" width="12" height="12" rx="2" fill="white"/>
                </svg>
                {"\u0CA8\u0CBF\u0CB2\u0CCD\u0CB2\u0CBF\u0CB8\u0CBF"}
              </button>
            </div>
          )}

          {/* Step 2.5: Transcribing */}
          {courageStep === "transcribing" && (
            <div className="courage-transcribing">
              <div className="mic-spinner large"></div>
              <p>{"\uD83D\uDCAD \u0CAC\u0CB0\u0CC6\u0CAF\u0CC1\u0CA4\u0CCD\u0CA4\u0CBF\u0CA6\u0CCD\u0CA6\u0CC7\u0CA8\u0CC1..."}</p>
            </div>
          )}

          {/* Step 3: Review */}
          {courageStep === "reviewing" && (
            <div className="courage-review">
              <h4>{"\u0CA8\u0CBF\u0CAE\u0CCD\u0CAE \u0C95\u0CA5\u0CC6"}</h4>

              {courageAudioBlob && (
                <audio controls src={URL.createObjectURL(courageAudioBlob)} style={{width: "100%", marginBottom: "12px"}} />
              )}

              <div className="courage-transcript-box">
                <p className="courage-transcript-label">{"\u0C9F\u0CCD\u0CB0\u0CBE\u0CA8\u0CCD\u0CB8\u0CCD\u0C95\u0CCD\u0CB0\u0CBF\u0CAA\u0CCD\u0C9F\u0CCD:"}</p>
                <textarea
                  value={courageTranscript}
                  onChange={(e) => setCourageTranscript(e.target.value)}
                  rows={4}
                  placeholder={"\u0CA8\u0CBF\u0CAE\u0CCD\u0CAE \u0C95\u0CA5\u0CC6 \u0C87\u0CB2\u0CCD\u0CB2\u0CBF \u0C95\u0CBE\u0CA3\u0CBF\u0CB8\u0CC1\u0CA4\u0CCD\u0CA4\u0CA6\u0CC6..."}
                />
              </div>

              <div className="courage-review-buttons">
                <button className="courage-approve-btn" onClick={submitCourageStory} disabled={!courageTranscript.trim()}>
                  {"\u2714 \u0C92\u0CAA\u0CCD\u0CAA\u0CBF\u0C97\u0CC6"}
                </button>
                <button className="courage-redo-btn" onClick={() => { setCourageStep("intro"); setCourageTranscript(""); setCourageAudioBlob(null); }}>
                  {"\uD83D\uDD04 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC6 \u0CB9\u0CC7\u0CB3\u0CBF"}
                </button>
                <button className="courage-cancel-btn" onClick={goBack}>
                  {"\u2716 \u0CB0\u0CA6\u0CCD\u0CA6\u0CC1"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Submitting */}
          {courageStep === "submitting" && (
            <div className="courage-transcribing">
              <div className="mic-spinner large"></div>
              <p>{"\u0CA8\u0CBF\u0CAE\u0CCD\u0CAE \u0C95\u0CA5\u0CC6 \u0CB8\u0CC7\u0CB5\u0CCD \u0C86\u0C97\u0CCD\u0CA4\u0CBF\u0CA6\u0CC6..."}</p>
            </div>
          )}

          {/* Step 5: Done */}
          {courageStep === "done" && (
            <div className="courage-done">
              <div className="courage-done-icon">{"\uD83D\uDE4F"}</div>
              <h3>{"\u0CA7\u0CA8\u0CCD\u0CAF\u0CB5\u0CBE\u0CA6\u0C97\u0CB3\u0CC1."}</h3>
              <p>{"\u0CA8\u0CBF\u0CAE\u0CCD\u0CAE \u0C95\u0CA5\u0CC6 \u0CB8\u0CC7\u0CB5\u0CCD \u0C86\u0C97\u0CBF\u0CA6\u0CC6."}</p>
              <p className="courage-done-sub">{"\u0CA8\u0CBF\u0CAE\u0CCD\u0CAE \u0CA7\u0CCC\u0CA8\u0CBF \u0C87\u0CA8\u0CCD\u0CA8\u0CCA\u0CAC\u0CCD\u0CAC\u0CB0 \u0C95\u0CA4\u0CCD\u0CA4\u0CB2\u0CC6\u0CAF \u0CB0\u0CBE\u0CA4\u0CCD\u0CB0\u0CBF\u0CAF\u0CB2\u0CCD\u0CB2\u0CBF \u0CA6\u0CC0\u0CAA \u0C86\u0C97\u0CC1\u0CA4\u0CCD\u0CA4\u0CC6."}</p>
              <button className="courage-home-btn" onClick={goBack}>
                {"\u2190 \u0CB9\u0CBF\u0C82\u0CA6\u0CC6 \u0CB9\u0CCB\u0C97\u0CBF"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          {"\u0C87\u0CA6\u0CC1 AI \u0C9C\u0CCA\u0CA4\u0CC6\u0C97\u0CBE\u0CB0\u0CCD\u0CA4\u0CBF"}
          <span className="footer-sep">&middot;</span>
          {"\u0CB5\u0CC8\u0CA6\u0CCD\u0CAF\u0C95\u0CC0\u0CAF \u0CB8\u0CB2\u0CB9\u0CC6 \u0C85\u0CB2\u0CCD\u0CB2"}
          <span className="footer-sep">&middot;</span>
          Anonymous &amp; private
          <span className="footer-sep">&middot;</span>
          Made with {"\u2764\uFE0F"} using <a href="https://www.sarvam.ai" target="_blank" rel="noopener">Sarvam AI</a> Bulbul V3
        </p>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
