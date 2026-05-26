/* =====================================================================
 * 🎬 Sunset OS (Ghuroob OS) — Premium Media Suite
 * Real lo-fi synth music, image gallery with lightbox, animated video player
 * ===================================================================== */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Image as ImageIcon, Music as MusicIcon, Video as VideoIcon, Maximize2, Minimize2, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

// Import gallery images
import sunsetBg from '../assets/sunset_bg.png';
import tropicalSunset from '../assets/tropical_sunset.png';
import mountainTwilight from '../assets/mountain_twilight.png';
import oceanWaves from '../assets/ocean_waves.png';

// ─── Lo-Fi Synth Engine ─────────────────────────────────────────────
class LofiSynthEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.currentNodes = [];
    this.analyser = null;
    this.chordIndex = 0;
    this.loopTimer = null;
    this.vinylNode = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  // Chord progressions for different "tracks"
  getProgression(trackIdx) {
    const progs = [
      // Track 1: Dreamy sunset (Cmaj7 → Fmaj7 → Am7 → G7)
      [[261.6, 329.6, 392, 493.9], [349.2, 440, 523.3, 659.3], [220, 261.6, 329.6, 392], [196, 246.9, 293.7, 349.2]],
      // Track 2: Warm dusk (Dm7 → G7 → Cmaj7 → Am7)
      [[293.7, 349.2, 440, 523.3], [196, 246.9, 293.7, 349.2], [261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392]],
      // Track 3: Calm waves (Fmaj7 → Em7 → Dm7 → Cmaj7)
      [[349.2, 440, 523.3, 659.3], [329.6, 392, 493.9, 587.3], [293.7, 349.2, 440, 523.3], [261.6, 329.6, 392, 493.9]],
    ];
    return progs[trackIdx % progs.length];
  }

  playChord(freqs, startTime, duration) {
    if (!this.ctx) return;
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      // Slight detune for warmth
      osc.detune.value = (Math.random() - 0.5) * 8;

      filter.type = 'lowpass';
      filter.frequency.value = 800 + Math.random() * 400;
      filter.Q.value = 0.5;

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 0.15);
      gain.gain.setValueAtTime(0.06, startTime + duration - 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration);
      this.currentNodes.push(osc);
    });
  }

  playKick(time) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  playHihat(time) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 8000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(hpf);
    hpf.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.05);
  }

  startVinylCrackle() {
    if (!this.ctx || this.vinylNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() < 0.002 ? (Math.random() - 0.5) * 0.4 : (Math.random() - 0.5) * 0.01;
    }
    this.vinylNode = this.ctx.createBufferSource();
    this.vinylNode.buffer = buffer;
    this.vinylNode.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.06;
    this.vinylNode.connect(gain);
    gain.connect(this.masterGain);
    this.vinylNode.start();
  }

  stopVinylCrackle() {
    if (this.vinylNode) {
      try { this.vinylNode.stop(); } catch (e) {}
      this.vinylNode = null;
    }
  }

  scheduleLoop(trackIdx) {
    if (!this.ctx || !this.isPlaying) return;
    const prog = this.getProgression(trackIdx);
    const now = this.ctx.currentTime;
    const beatDur = 0.5;
    const chordDur = beatDur * 4;

    prog.forEach((chord, ci) => {
      const chordStart = now + ci * chordDur;
      this.playChord(chord, chordStart, chordDur);
      // Drum pattern per chord
      for (let beat = 0; beat < 4; beat++) {
        const t = chordStart + beat * beatDur;
        if (beat === 0 || beat === 2) this.playKick(t);
        if (beat === 1 || beat === 3) this.playHihat(t);
        if (beat === 2) this.playHihat(t + beatDur * 0.5);
      }
    });

    const totalDur = prog.length * chordDur;
    this.loopTimer = setTimeout(() => {
      if (this.isPlaying) this.scheduleLoop(trackIdx);
    }, totalDur * 1000 - 100);
  }

  play(trackIdx = 0) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.isPlaying = true;
    this.startVinylCrackle();
    this.scheduleLoop(trackIdx);
  }

  stop() {
    this.isPlaying = false;
    if (this.loopTimer) clearTimeout(this.loopTimer);
    this.stopVinylCrackle();
  }

  setVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  getAnalyserData() {
    if (!this.analyser) return null;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  destroy() {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// ─── Gallery Images Data ────────────────────────────────────────────
const GALLERY_IMAGES = [
  { id: 'g1', src: sunsetBg, name: 'Sunset Glow', desc: 'Default OS wallpaper', res: '1920×1080' },
  { id: 'g2', src: tropicalSunset, name: 'Tropical Sunset', desc: 'Palm beach paradise', res: '1920×1080' },
  { id: 'g3', src: mountainTwilight, name: 'Mountain Twilight', desc: 'Alpine serenity', res: '1920×1080' },
  { id: 'g4', src: oceanWaves, name: 'Ocean Waves', desc: 'Golden hour coastline', res: '1920×1080' },
];

const LOFI_TRACKS = [
  { name: "Sunset Reflections", artist: "Ghuroob Lo-Fi", bpm: 70, key: "Cmaj7" },
  { name: "AP Bootloader Beats", artist: "Kernel Beats", bpm: 75, key: "Dm7" },
  { name: "LAZ Kernel Calmness", artist: "Ambient Nature", bpm: 65, key: "Fmaj7" },
];

// ─── Main Component ─────────────────────────────────────────────────
export default function MediaSuite({ initialTab = 'image', initialFileId = null }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.35);
  const [isMuted, setIsMuted] = useState(false);
  const synthRef = useRef(null);
  const visualizerRef = useRef(null);
  const visualizerCanvasRef = useRef(null);

  // Image state
  const [lightboxIdx, setLightboxIdx] = useState(-1);
  const [imgZoom, setImgZoom] = useState(1);

  // Video state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoCanvasRef = useRef(null);
  const videoFrameRef = useRef(0);
  const videoAnimRef = useRef(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, initialFileId]);

  // ── Audio Synth Lifecycle ──────────────────────────────────────────
  useEffect(() => {
    synthRef.current = new LofiSynthEngine();
    return () => {
      if (synthRef.current) synthRef.current.destroy();
    };
  }, []);

  const togglePlay = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) return;
    if (isPlaying) {
      synth.stop();
      setIsPlaying(false);
    } else {
      synth.play(trackIndex);
      setIsPlaying(true);
    }
  }, [isPlaying, trackIndex]);

  const switchTrack = useCallback((newIdx) => {
    const synth = synthRef.current;
    if (!synth) return;
    setTrackIndex(newIdx);
    if (isPlaying) {
      synth.stop();
      setTimeout(() => synth.play(newIdx), 100);
    }
  }, [isPlaying]);

  const handleVolume = useCallback((e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (synthRef.current) synthRef.current.setVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(0.35);
      if (synthRef.current) synthRef.current.setVolume(0.35);
    } else {
      setIsMuted(true);
      if (synthRef.current) synthRef.current.setVolume(0);
    }
  }, [isMuted]);

  // ── Audio Visualizer ──────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'audio' || !isPlaying) return;
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let running = true;

    const draw = () => {
      if (!running) return;
      const data = synthRef.current?.getAnalyserData();
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      if (data) {
        const barW = w / data.length * 2.5;
        const useBars = Math.floor(data.length * 0.4);
        for (let i = 0; i < useBars; i++) {
          const val = data[i] / 255;
          const barH = val * h * 0.85;
          const x = i * (barW + 1.5);
          const gradient = ctx.createLinearGradient(x, h - barH, x, h);
          gradient.addColorStop(0, `hsl(${25 + i * 2}, 95%, 60%)`);
          gradient.addColorStop(1, `hsl(${270 + i * 1.5}, 70%, 45%)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(x, h - barH, barW, barH);
        }
      }
      requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; };
  }, [activeTab, isPlaying]);

  // ── Video Canvas Animation ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'video') return;
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    let frame = videoFrameRef.current;
    let running = true;

    const drawVideoFrame = () => {
      if (!running) return;
      if (isVideoPlaying) {
        frame++;
        videoFrameRef.current = frame;
        setVideoProgress(frame % 3600);
      }

      // Sky gradient (shifts over time)
      const skyHue = 240 - (frame * 0.02 % 40);
      const grad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      grad.addColorStop(0, `hsl(${skyHue}, 35%, 12%)`);
      grad.addColorStop(0.4, `hsl(${skyHue + 30}, 50%, 25%)`);
      grad.addColorStop(0.7, `hsl(25, 85%, 45%)`);
      grad.addColorStop(1, `hsl(40, 90%, 55%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h * 0.65);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137.5 + frame * 0.01) % w;
        const sy = (i * 97.3) % (h * 0.3);
        const twinkle = Math.sin(frame * 0.02 + i) * 0.3 + 0.7;
        ctx.globalAlpha = twinkle * 0.6;
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Clouds (parallax)
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 200 + 50) - frame * (0.15 + i * 0.05)) % (w + 200) - 100;
        const cy = 40 + i * 25;
        ctx.fillStyle = `rgba(255,200,150,${0.08 + i * 0.03})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 50 + i * 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 30, cy - 5, 30 + i * 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sun
      const sunY = h * 0.38 + Math.sin(frame * 0.003) * 8;
      const sunX = w * 0.5;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 100);
      sunGlow.addColorStop(0, 'rgba(255,183,77,0.9)');
      sunGlow.addColorStop(0.3, 'rgba(255,140,50,0.3)');
      sunGlow.addColorStop(1, 'rgba(255,100,30,0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(sunX - 100, sunY - 100, 200, 200);
      ctx.fillStyle = '#ffb74d';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
      ctx.fill();

      // Sun reflection on water
      const waterY = h * 0.65;
      ctx.fillStyle = 'rgba(255,183,77,0.15)';
      ctx.fillRect(sunX - 20, waterY, 40, h - waterY);

      // Ocean
      const oceanGrad = ctx.createLinearGradient(0, waterY, 0, h);
      oceanGrad.addColorStop(0, '#1a4a6b');
      oceanGrad.addColorStop(0.5, '#0d2b42');
      oceanGrad.addColorStop(1, '#061520');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, waterY, w, h - waterY);

      // Waves
      for (let row = 0; row < 6; row++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.06 - row * 0.008})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const baseY = waterY + 10 + row * 16;
        for (let x = 0; x <= w; x += 3) {
          const y = baseY + Math.sin((x + frame * (1.5 - row * 0.15) + row * 50) * 0.025) * (3 + row);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Birds
      for (let i = 0; i < 3; i++) {
        const bx = ((i * 250 + frame * (0.8 + i * 0.3)) % (w + 200)) - 100;
        const by = 60 + i * 35 + Math.sin(frame * 0.02 + i * 2) * 8;
        ctx.strokeStyle = `rgba(30,20,10,${0.4 + i * 0.1})`;
        ctx.lineWidth = 1.5;
        const wingY = Math.sin(frame * 0.08 + i * 3) * 4;
        ctx.beginPath();
        ctx.moveTo(bx - 8, by + wingY);
        ctx.quadraticCurveTo(bx - 2, by - 6 + wingY, bx, by + wingY);
        ctx.moveTo(bx, by + wingY);
        ctx.quadraticCurveTo(bx + 2, by - 6 + wingY, bx + 8, by + wingY);
        ctx.stroke();
      }

      videoAnimRef.current = requestAnimationFrame(drawVideoFrame);
    };

    drawVideoFrame();
    return () => {
      running = false;
      if (videoAnimRef.current) cancelAnimationFrame(videoAnimRef.current);
    };
  }, [activeTab, isVideoPlaying]);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="media-suite-root" style={{ display: 'flex', height: '100%', background: 'rgba(8,4,20,0.3)', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>

      {/* Sidebar Tabs */}
      <div style={{ width: 56, borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,4,20,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 16 }}>
        {[
          { key: 'image', Icon: ImageIcon, color: '#e8651a' },
          { key: 'audio', Icon: MusicIcon, color: '#7c3aed' },
          { key: 'video', Icon: VideoIcon, color: '#10b981' },
        ].map(({ key, Icon, color }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: activeTab === key ? color : 'rgba(255,255,255,0.04)',
            color: activeTab === key ? '#fff' : 'rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s',
            boxShadow: activeTab === key ? `0 4px 16px ${color}33` : 'none',
            transform: activeTab === key ? 'scale(1.08)' : 'scale(1)',
          }}>
            <Icon size={18} />
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ═══════════ IMAGE GALLERY TAB ═══════════ */}
        {activeTab === 'image' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={16} style={{ color: '#e8651a' }} /> Gallery
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {GALLERY_IMAGES.map((img, idx) => (
                <div key={img.id} onClick={() => { setLightboxIdx(idx); setImgZoom(1); }}
                  style={{
                    borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer', transition: 'all 0.3s', position: 'relative', aspectRatio: '16/10',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = 'rgba(232,101,26,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <img src={img.src} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '16px 8px 6px', fontSize: 11, fontWeight: 600,
                  }}>
                    {img.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Lightbox */}
            {lightboxIdx >= 0 && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(12px)', zIndex: 100,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Controls */}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 101 }}>
                  <button onClick={() => setImgZoom(z => Math.max(0.5, z - 0.25))} style={lbBtnStyle}><ZoomOut size={16} /></button>
                  <button onClick={() => setImgZoom(z => Math.min(3, z + 0.25))} style={lbBtnStyle}><ZoomIn size={16} /></button>
                  <button onClick={() => setLightboxIdx(-1)} style={{ ...lbBtnStyle, background: 'rgba(255,80,80,0.3)' }}><X size={16} /></button>
                </div>
                {/* Nav Arrows */}
                {lightboxIdx > 0 && (
                  <button onClick={() => { setLightboxIdx(i => i - 1); setImgZoom(1); }} style={{ ...lbNavStyle, left: 10 }}><ChevronLeft size={28} /></button>
                )}
                {lightboxIdx < GALLERY_IMAGES.length - 1 && (
                  <button onClick={() => { setLightboxIdx(i => i + 1); setImgZoom(1); }} style={{ ...lbNavStyle, right: 10 }}><ChevronRight size={28} /></button>
                )}
                {/* Image */}
                <img
                  src={GALLERY_IMAGES[lightboxIdx].src}
                  alt={GALLERY_IMAGES[lightboxIdx].name}
                  style={{
                    maxWidth: '90%', maxHeight: '80%', objectFit: 'contain',
                    borderRadius: 8, transform: `scale(${imgZoom})`,
                    transition: 'transform 0.3s ease',
                  }}
                />
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{GALLERY_IMAGES[lightboxIdx].name}</p>
                  <p style={{ fontSize: 11, opacity: 0.5 }}>{GALLERY_IMAGES[lightboxIdx].desc} • {GALLERY_IMAGES[lightboxIdx].res}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ AUDIO PLAYER TAB ═══════════ */}
        {activeTab === 'audio' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
            {/* Top: Visualizer + Track Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, minHeight: 0 }}>
              {/* Spinning Disk + Visualizer */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 130, height: 130, borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.05)',
                  background: 'linear-gradient(135deg, #d97706, #e8651a, #7c3aed)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: isPlaying ? 'spin 8s linear infinite' : 'none',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#0a0519', border: '2px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e8651a' }} />
                  </div>
                </div>
                {/* Visualizer bars */}
                <canvas ref={visualizerCanvasRef} width={130} height={40} style={{ borderRadius: 6 }} />
              </div>

              {/* Track Info + Playlist */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{LOFI_TRACKS[trackIndex].name}</h3>
                <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 500 }}>{LOFI_TRACKS[trackIndex].artist}</p>
                <p style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{LOFI_TRACKS[trackIndex].bpm} BPM • {LOFI_TRACKS[trackIndex].key}</p>

                <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)', maxHeight: 120, overflow: 'auto' }}>
                  {LOFI_TRACKS.map((track, i) => (
                    <div key={i} onClick={() => switchTrack(i)} style={{
                      padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                      background: i === trackIndex ? 'rgba(124,58,237,0.2)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => { if (i !== trackIndex) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (i !== trackIndex) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 12, fontWeight: i === trackIndex ? 600 : 400, color: i === trackIndex ? '#c4b5fd' : 'rgba(255,255,255,0.6)' }}>
                        {i === trackIndex && isPlaying && '♫ '}{track.name}
                      </span>
                      <span style={{ fontSize: 11, opacity: 0.4 }}>{track.bpm} BPM</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: Controls */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Volume */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100 }}>
                  <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}>
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input type="range" min="0" max="0.7" step="0.01" value={isMuted ? 0 : volume}
                    onChange={handleVolume}
                    style={{ width: 60, accentColor: '#7c3aed', height: 4 }}
                  />
                </div>

                {/* Play Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => switchTrack(trackIndex === 0 ? LOFI_TRACKS.length - 1 : trackIndex - 1)}
                    style={ctrlBtnStyle}><SkipBack size={16} /></button>
                  <button onClick={togglePlay} style={{
                    width: 48, height: 48, borderRadius: '50%', border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  >
                    {isPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" style={{ marginLeft: 2 }} />}
                  </button>
                  <button onClick={() => switchTrack(trackIndex === LOFI_TRACKS.length - 1 ? 0 : trackIndex + 1)}
                    style={ctrlBtnStyle}><SkipForward size={16} /></button>
                </div>

                <div style={{ width: 100 }} />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ VIDEO PLAYER TAB ═══════════ */}
        {activeTab === 'video' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12 }}>
            {/* Video Canvas */}
            <div style={{
              flex: 1, borderRadius: 12, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative', background: '#000',
            }}>
              <canvas ref={videoCanvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
              {/* Title overlay */}
              <div style={{
                position: 'absolute', top: 8, left: 10,
                background: 'rgba(0,0,0,0.45)', padding: '3px 10px',
                borderRadius: 6, fontSize: 10, color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                🔴 Sunset Over the Ocean — Generative Art
              </div>
              {/* Big Play button */}
              {!isVideoPlaying && (
                <button onClick={() => setIsVideoPlaying(true)} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 64, height: 64, borderRadius: '50%', border: 'none',
                  background: 'rgba(16,185,129,0.8)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.target.style.transform = 'translate(-50%, -50%) scale(1.1)'}
                onMouseLeave={e => e.target.style.transform = 'translate(-50%, -50%) scale(1)'}
                >
                  <Play size={28} fill="#fff" style={{ marginLeft: 3 }} />
                </button>
              )}
            </div>
            {/* Video Controls */}
            <div style={{ paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, opacity: 0.4, width: 36, textAlign: 'right' }}>
                  {Math.floor(videoProgress / 60).toString().padStart(2, '0')}:{(videoProgress % 60).toString().padStart(2, '0')}
                </span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ height: '100%', width: `${(videoProgress / 3600) * 100}%`, background: '#10b981', borderRadius: 2, transition: 'width 0.1s' }} />
                </div>
                <span style={{ fontSize: 10, opacity: 0.4, width: 36 }}>60:00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setIsVideoPlaying(!isVideoPlaying)} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: 'rgba(255,255,255,0.06)', color: '#fff',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                >
                  {isVideoPlaying ? <><Pause size={14} fill="#fff" /> Pause</> : <><Play size={14} fill="#fff" /> Play</>}
                </button>
                <span style={{ fontSize: 10, opacity: 0.3 }}>Generative Sunset Theater</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inject spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Shared Styles ──────────────────────────────────────────────────
const lbBtnStyle = {
  width: 32, height: 32, borderRadius: 8, border: 'none',
  background: 'rgba(255,255,255,0.1)', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'background 0.2s',
};

const lbNavStyle = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  width: 40, height: 40, borderRadius: '50%', border: 'none',
  background: 'rgba(255,255,255,0.1)', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', zIndex: 101,
};

const ctrlBtnStyle = {
  width: 36, height: 36, borderRadius: '50%', border: 'none',
  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'all 0.2s',
};
