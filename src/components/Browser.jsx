import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Globe, 
  Search, 
  Wind, 
  Sprout, 
  Cloud, 
  Play, 
  Volume2, 
  VolumeX, 
  Droplet,
  Heart,
  Sparkles,
  Home
} from 'lucide-react';

export default function Browser({ initialUrl }) {
  const [url, setUrl] = useState(initialUrl || 'sunset://gardens');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'sunset://gardens');
  
  // Navigation stack
  const [history, setHistory] = useState(['sunset://gardens']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sound generator state
  const [audioActive, setAudioActive] = useState(false);
  const [windIntensity, setWindIntensity] = useState('mild'); // 'calm' | 'mild' | 'active'
  const audioCtxRef = useRef(null);
  const synthIntervalRef = useRef(null);
  const windGainRef = useRef(null);
  const windFilterRef = useRef(null);

  // Breathing state
  const [breathPhase, setBreathPhase] = useState('Inhale'); // Inhale, Hold, Exhale
  const [breathTimer, setBreathTimer] = useState(4);
  const [breathCount, setBreathCount] = useState(0);

  // Zen Garden state
  // Grid size 5x5. Each cell has: { type: null, stage: 0, watered: false }
  const [garden, setGarden] = useState(() => {
    const initialGrid = Array(25).fill(null).map(() => ({ type: null, stage: 0, watered: false }));
    // Pre-populate a couple of spots
    initialGrid[6] = { type: 'sakura', stage: 3, watered: true };
    initialGrid[18] = { type: 'lavender', stage: 2, watered: false };
    initialGrid[12] = { type: 'lily', stage: 1, watered: true };
    return initialGrid;
  });
  const [selectedSeed, setSelectedSeed] = useState('sakura');

  // Time-synced Cloud state
  const [cloudTime, setCloudTime] = useState(new Date());

  // Listen to outer URL navigation requests
  useEffect(() => {
    if (initialUrl) {
      navigateTo(initialUrl);
    }
  }, [initialUrl]);

  // Breathing cycle ticker
  useEffect(() => {
    if (url !== 'sunset://rest') return;

    const interval = setInterval(() => {
      setBreathTimer(prev => {
        if (prev <= 1) {
          if (breathPhase === 'Inhale') {
            setBreathPhase('Hold');
            return 4; // hold for 4s
          } else if (breathPhase === 'Hold') {
            setBreathPhase('Exhale');
            return 4; // exhale for 4s
          } else {
            setBreathPhase('Inhale');
            setBreathCount(c => c + 1);
            return 4; // inhale for 4s
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [url, breathPhase]);

  // Keep input bar in sync with current URL
  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  // Procedural Zen Sound Generator using Web Audio API
  const startProceduralAudio = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Create nature wind noise generator
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      let initialGain = 0.08;
      let initialFreq = 350;
      if (windIntensity === 'calm') {
        initialGain = 0.02;
        initialFreq = 220;
      } else if (windIntensity === 'active') {
        initialGain = 0.22;
        initialFreq = 550;
      }

      // Filter white noise to sound like wind/rustles
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = initialFreq;
      filter.Q.value = 1.0;

      // Modulate filter frequency to simulate breathing waves
      const modulator = ctx.createOscillator();
      modulator.frequency.value = 0.15; // slow breathing rate
      const modulatorGain = ctx.createGain();
      modulatorGain.gain.value = 120;

      modulator.connect(modulatorGain);
      modulatorGain.connect(filter.frequency);
      modulator.start();

      const mainGain = ctx.createGain();
      mainGain.gain.value = initialGain;

      windGainRef.current = mainGain;
      windFilterRef.current = filter;

      whiteNoise.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);
      whiteNoise.start();

      // Periodically synthesize delicate procedural bird tweets
      const playTweet = () => {
        if (ctx.state === 'suspended') return;
        const osc = ctx.createOscillator();
        const tweetGain = ctx.createGain();
        osc.type = 'sine';
        
        // Random bird melody pitches
        const baseFreq = 1200 + Math.random() * 800;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + 500, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, ctx.currentTime + 0.2);

        tweetGain.gain.setValueAtTime(0, ctx.currentTime);
        tweetGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.05);
        tweetGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

        osc.connect(tweetGain);
        tweetGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      };

      // Periodic birds tweets scheduler
      synthIntervalRef.current = setInterval(() => {
        if (Math.random() > 0.4) {
          playTweet();
          setTimeout(() => {
            if (Math.random() > 0.5) playTweet();
          }, 150);
        }
      }, 3000);

      setAudioActive(true);
    } catch (e) {
      console.error("Web Audio could not start", e);
    }
  };

  const stopProceduralAudio = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setAudioActive(false);
  };

  const toggleAudio = () => {
    if (audioActive) {
      stopProceduralAudio();
    } else {
      startProceduralAudio();
    }
  };

  useEffect(() => {
    // Stop audio on unmount
    return () => {
      stopProceduralAudio();
    };
  }, []);

  useEffect(() => {
    if (audioActive && windGainRef.current && windFilterRef.current) {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      let gainVal = 0.08;
      let freqVal = 350;
      
      if (windIntensity === 'calm') {
        gainVal = 0.02;
        freqVal = 220;
      } else if (windIntensity === 'active') {
        gainVal = 0.22;
        freqVal = 550;
      }
      
      // Smoothly ramp parameters over 0.25 seconds to avoid click pops
      windGainRef.current.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.25);
      windFilterRef.current.frequency.linearRampToValueAtTime(freqVal, ctx.currentTime + 0.25);
    }
  }, [windIntensity, audioActive]);

  // Garden Tickers for natural plant growth
  useEffect(() => {
    const growthInterval = setInterval(() => {
      setGarden(prev => 
        prev.map(cell => {
          if (cell.type && cell.stage < 3 && cell.watered) {
            // Grow with 30% chance if watered
            if (Math.random() > 0.7) {
              return { ...cell, stage: cell.stage + 1, watered: false };
            }
          }
          return cell;
        })
      );
    }, 5000);
    return () => clearInterval(growthInterval);
  }, []);

  const navigateTo = (nextUrl) => {
    let formatted = nextUrl.trim();
    if (!formatted.startsWith('sunset://') && !formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      // Auto resolve local vs web search
      if (formatted.includes('.') || formatted.includes('localhost') || formatted.includes('127.0.0.1')) {
        formatted = 'https://' + formatted;
      } else {
        formatted = 'sunset://' + formatted;
      }
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(formatted);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setUrl(formatted);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setUrl(history[idx]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setUrl(history[idx]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigateTo(inputUrl);
  };

  // Zen Garden click interactions
  const handleCellClick = (index) => {
    setGarden(prev => {
      const next = [...prev];
      const cell = next[index];

      if (!cell.type) {
        // Plant seed
        next[index] = { type: selectedSeed, stage: 0, watered: true };
      } else if (!cell.watered && cell.stage < 3) {
        // Water the flower
        next[index] = { ...cell, watered: true };
      } else {
        // Harvest/Clear fully grown flower or just clear
        next[index] = { type: null, stage: 0, watered: false };
      }
      return next;
    });
  };

  // Get flower graphic
  const getFlowerEmoji = (cell) => {
    if (!cell.type) return '';
    const stages = {
      sakura: ['🌱', '🌿', '🌸', '🏵️'],
      lavender: ['🌱', '🌿', '🌾', '🪻'],
      lily: ['🌱', '🌿', '🌱', '🪷']
    };
    return stages[cell.type][cell.stage] || '🌱';
  };

  const getFlowerName = (type) => {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getSwayStyle = () => {
    let duration = '2.5s';
    if (windIntensity === 'calm') {
      duration = '4.5s';
    } else if (windIntensity === 'active') {
      duration = '1.1s';
    }
    return {
      display: 'inline-block',
      transformOrigin: 'bottom center',
      animation: `sway ${duration} ease-in-out infinite`
    };
  };

  // RENDER INTERNALS BASED ON CURRENT MOCK ADDR
  const renderBrowserContent = () => {
    if (url === 'sunset://rest') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white/90 bg-gradient-to-b from-indigo-950/40 via-purple-950/30 to-amber-950/20 select-none">
          <Wind className="w-10 h-10 text-orange-300 animate-pulse mb-3" />
          <h2 className="text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-rose-400">
            Guided Sunset Breathing Exercise
          </h2>
          <p className="text-white/60 text-xs mt-1 max-w-md">
            Rest your eyes and calibrate your breathing with the rhythm of twilight.
          </p>

          <div className="relative flex items-center justify-center my-12 w-64 h-64">
            {/* Outer ripples */}
            <div 
              className={`absolute inset-0 rounded-full bg-orange-500/10 border border-orange-500/20 transition-all duration-[4000ms] ease-in-out ${
                breathPhase === 'Inhale' ? 'scale-110' : breathPhase === 'Hold' ? 'scale-115 border-orange-400/40' : 'scale-95 bg-purple-500/5'
              }`}
            />
            
            {/* Main breathing sphere */}
            <div 
              className={`flex flex-col items-center justify-center rounded-full shadow-2xl backdrop-blur-md transition-all duration-[4000ms] ease-in-out ${
                breathPhase === 'Inhale' 
                  ? 'w-48 h-48 bg-gradient-to-br from-orange-400/30 to-pink-500/30 border-2 border-orange-400/50 text-orange-200' 
                  : breathPhase === 'Hold'
                  ? 'w-52 h-52 bg-gradient-to-br from-orange-500/40 to-rose-600/40 border-2 border-rose-400/70 text-rose-100 scale-105'
                  : 'w-36 h-36 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border-2 border-purple-500/40 text-purple-200'
              }`}
            >
              <span className="text-lg font-bold uppercase tracking-widest">{breathPhase}</span>
              <span className="text-4xl font-extrabold mt-1 font-mono">{breathTimer}s</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Cycles completed: <strong>{breathCount}</strong></span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span>Pace: <strong>4-4-4</strong> (Restorative)</span>
          </div>

          <p className="mt-8 text-xs text-white/40 italic max-w-sm">
            "Inhale peace, hold gratitude, exhale release."
          </p>
        </div>
      );
    } 
    
    if (url === 'sunset://gardens') {
      return (
        <div className="flex flex-col h-full bg-slate-950/45 text-white/90 selection:bg-rose-500/30 overflow-y-auto">
          {/* Header toolbar */}
          <div className="flex flex-wrap items-center justify-between p-4 border-b border-white/5 bg-black/20 gap-3">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm">Zen Meditation Garden Grid</h3>
                <p className="text-[10px] text-white/40">Plant serene seeds, water them, and watch them bloom over time.</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Seed selectors */}
              <div className="flex bg-slate-900/60 rounded-lg p-0.5 border border-white/5">
                {[
                  { id: 'sakura', name: 'Sakura Blossom', icon: '🌸' },
                  { id: 'lavender', name: 'Lavender', icon: '🪻' },
                  { id: 'lily', name: 'Lotus Lily', icon: '🪷' }
                ].map(seed => (
                  <button
                    key={seed.id}
                    onClick={() => setSelectedSeed(seed.id)}
                    title={seed.name}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                      selectedSeed === seed.id
                        ? 'bg-orange-500/25 border border-orange-500/40 text-orange-200'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{seed.icon}</span>
                    <span className="hidden sm:inline text-[10px]">{seed.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Wind selector */}
              <div className="flex bg-slate-900/60 rounded-lg p-0.5 border border-white/5 gap-1 items-center px-2">
                <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider mr-1">Wind:</span>
                {[
                  { id: 'calm', label: 'Calm', icon: '🍃' },
                  { id: 'mild', label: 'Breeze', icon: '💨' },
                  { id: 'active', label: 'Gale', icon: '🌪️' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWindIntensity(opt.id)}
                    className={`px-2 py-0.5 text-[9px] rounded-md transition-all font-semibold ${
                      windIntensity === opt.id
                        ? 'bg-amber-500/25 border border-amber-500/40 text-amber-200 shadow-sm'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{opt.icon}</span> <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Synthesizer button */}
              <button
                onClick={toggleAudio}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 active:scale-95 ${
                  audioActive
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {audioActive ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" /> Stop Ambience
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" /> procedural sound
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Garden content */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-h-[calc(100%-80px)] overflow-y-auto">
            {/* Grid display */}
            <div className="md:col-span-2 flex flex-col justify-center items-center">
              <div className="grid grid-cols-5 gap-2.5 p-4 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-sm max-w-md w-full aspect-square">
                {garden.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    className={`relative group flex flex-col items-center justify-center rounded-xl transition-all duration-300 border aspect-square ${
                      cell.type 
                        ? cell.watered
                          ? 'bg-indigo-950/20 border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                          : 'bg-slate-900/60 border-orange-500/20 hover:border-orange-500/40'
                        : 'bg-black/25 border-dashed border-white/5 hover:border-emerald-500/30 hover:bg-emerald-950/10'
                    }`}
                  >
                    {/* Flower Graphic */}
                    {cell.type ? (
                      <span 
                        className="text-2xl transform transition-transform group-hover:scale-110 duration-200"
                        style={getSwayStyle()}
                      >
                        {getFlowerEmoji(cell)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/10 group-hover:text-emerald-400/40 font-bold font-mono">
                        {idx + 1}
                      </span>
                    )}

                    {/* Water drop overlay indicator */}
                    {cell.type && cell.stage < 3 && (
                      <div className={`absolute bottom-1 right-1 p-0.5 rounded-full ${cell.watered ? 'bg-blue-500/20 text-blue-300' : 'bg-transparent text-white/20 group-hover:text-blue-400'}`}>
                        <Droplet className={`w-2.5 h-2.5 ${!cell.watered && 'animate-pulse'}`} />
                      </div>
                    )}

                    {/* Growth stage tooltip on hover */}
                    {cell.type && (
                      <div className="absolute opacity-0 group-hover:opacity-100 bg-slate-950/90 text-[9px] text-white/80 border border-white/10 rounded px-1.5 py-0.5 -top-6 left-1/2 transform -translate-x-1/2 pointer-events-none transition-opacity duration-200 z-10 whitespace-nowrap shadow-md">
                        {getFlowerName(cell.type)} (Stage {cell.stage}/3) {cell.stage === 3 ? '✓ Full' : cell.watered ? '• Growing' : '• Thirsty'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Guide */}
            <div className="flex flex-col gap-4 bg-slate-900/20 border border-white/5 rounded-2xl p-5 justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-xs text-orange-300 font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Serene Gardening Log</span>
                </div>
                <h4 className="text-base font-bold text-white">Cultivate Serene Mindfulness</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Gardening encourages patience and restorative pacing. Click any empty cell in the grid to plant a seed of the selected type.
                </p>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="text-base">🌸</span>
                    <span><strong>Sakura:</strong> Serene Japanese cherry blossom.</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="text-base">🪻</span>
                    <span><strong>Lavender:</strong> Relaxing deep aroma blooms.</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="text-base">🪷</span>
                    <span><strong>Lotus Lily:</strong> Pure aquatic peaceful petal.</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 text-[10px] text-white/40 space-y-2">
                <div className="flex justify-between">
                  <span>Growth speed:</span>
                  <span className="text-emerald-400">Natural Tick (5s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Water requirement:</span>
                  <span>Mandatory for growth</span>
                </div>
                <p className="italic text-center text-rose-300/60 mt-1">
                  Click fully bloomed flowers to harvest them and keep gardening.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (url === 'sunset://clouds') {
      const getSkyColor = () => {
        const hours = cloudTime.getHours();
        if (hours >= 5 && hours < 8) return 'from-amber-900/20 via-orange-950/30 to-purple-950/40'; // Sunrise
        if (hours >= 8 && hours < 16) return 'from-sky-950/20 via-slate-900/30 to-zinc-900/20'; // Midday pastel
        if (hours >= 16 && hours < 19) return 'from-orange-950/40 via-purple-950/30 to-rose-950/20'; // Sunset (Ghuroob)
        return 'from-black/40 via-slate-950/50 to-indigo-950/40'; // Night sky
      };

      const getSkyTitle = () => {
        const hours = cloudTime.getHours();
        if (hours >= 5 && hours < 8) return 'Morning Twilight Glow';
        if (hours >= 8 && hours < 16) return 'Zen Pastel Sky';
        if (hours >= 16 && hours < 19) return 'Ghuroob Sunset Atmosphere';
        return 'Stellar Midnight Serenity';
      };

      return (
        <div className={`flex flex-col h-full bg-gradient-to-b ${getSkyColor()} text-white/90 justify-between p-8 relative overflow-hidden select-none`}>
          {/* Cloud animations overlay (CSS-based) */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {/* Cloud 1 */}
            <div className="absolute top-[20%] left-[-150px] animate-[drift_60s_linear_infinite] opacity-25">
              <div className="w-36 h-10 bg-white rounded-full relative">
                <div className="w-16 h-16 bg-white rounded-full absolute -top-8 left-6" />
                <div className="w-12 h-12 bg-white rounded-full absolute -top-4 left-16" />
              </div>
            </div>
            {/* Cloud 2 */}
            <div className="absolute top-[45%] left-[-200px] animate-[drift_45s_linear_infinite_8s] opacity-15">
              <div className="w-48 h-12 bg-white rounded-full relative scale-110">
                <div className="w-20 h-20 bg-white rounded-full absolute -top-10 left-8" />
                <div className="w-16 h-16 bg-white rounded-full absolute -top-6 left-20" />
              </div>
            </div>
            {/* Cloud 3 */}
            <div className="absolute top-[60%] left-[-180px] animate-[drift_70s_linear_infinite_2s] opacity-20">
              <div className="w-40 h-10 bg-white rounded-full relative scale-90">
                <div className="w-16 h-16 bg-white rounded-full absolute -top-8 left-6" />
                <div className="w-12 h-12 bg-white rounded-full absolute -top-4 left-16" />
              </div>
            </div>
          </div>

          {/* Time and Title info */}
          <div className="z-10 flex flex-col gap-1 items-start">
            <div className="flex items-center gap-2 text-xs text-orange-300 font-semibold tracking-widest uppercase">
              <Cloud className="w-4 h-4 text-orange-300" />
              <span>Sky Atmospheric Visualizer</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight">{getSkyTitle()}</h3>
            <p className="text-white/40 text-xs">Simulating atmospheric sky density based on active clock parameters.</p>
          </div>

          {/* Serene clock layout */}
          <div className="z-10 flex flex-col items-center justify-center my-6">
            <span className="text-5xl font-extrabold tracking-widest text-white/95 font-mono drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
              {cloudTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-xs text-white/60 font-semibold uppercase mt-2 tracking-wider">
              {cloudTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="z-10 text-xs text-white/40 max-w-sm bg-slate-900/40 border border-white/5 backdrop-blur-sm rounded-xl p-3.5 space-y-1">
            <span className="font-semibold text-orange-300">Sunset OS Sky Engine:</span>
            <p>We hook the system's real-time parameters to adapt desktop lighting ratios. Let the calm pastel hues guide you into your evening routine.</p>
          </div>

          {/* Drift animation definitions */}
          <style>{`
            @keyframes drift {
              0% { transform: translateX(-10%); }
              100% { transform: translateX(700px); }
            }
          `}</style>
        </div>
      );
    }

    // Default Web Search or Resource Page
    return (
      <div className="flex flex-col h-full bg-slate-950/45 text-white/95 p-6 overflow-y-auto selection:bg-orange-500/30">
        <div className="max-w-2xl mx-auto py-8 space-y-6">
          {/* Header search details */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Globe className="w-8 h-8 text-orange-400" />
            <div>
              <h3 className="text-lg font-bold text-white">SunsetDNS Simulated Gateway</h3>
              <p className="text-xs text-white/40">Secured via Ring 0 sandboxing routines. External proxy connection online.</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
            <h4 className="font-semibold text-sm text-orange-300">Resolved mock external host for: <span className="underline">{url}</span></h4>
            <p className="text-xs text-white/60 leading-relaxed">
              To support calm computational environments, Sunset OS directs external network routing towards peaceful educational repositories, serene breathing resources, and direct source coordinates.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Available Serene Resource Directory</h5>
            
            <div className="grid gap-2.5">
              {[
                { title: 'Nature Conservancy Directory', desc: 'Explore tranquil nature paths and global ecological restoration plans.', domain: 'nature.org' },
                { title: 'Calm Spaces Guide', desc: 'Restorative focus templates, atmospheric breathing guidelines, and deep sleep routines.', domain: 'calm.com' },
                { title: 'Sunset OS GitHub Hub', desc: 'Browse full C kernels, mouse coordinates controllers, and local shell sources.', domain: 'github.com/sunset-OS' }
              ].map((res, i) => (
                <div key={i} className="flex flex-col gap-1 p-4 rounded-xl bg-slate-950/50 hover:bg-slate-950/80 border border-white/5 transition-all">
                  <span className="text-xs text-white/40">{res.domain}</span>
                  <span className="font-bold text-sm text-orange-200/90">{res.title}</span>
                  <span className="text-xs text-white/60 mt-1">{res.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/20 text-white font-sans text-sm selection:bg-orange-500/30">
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-${windIntensity === 'calm' ? '2.5deg' : windIntensity === 'active' ? '15deg' : '6deg'}); }
          50% { transform: rotate(${windIntensity === 'calm' ? '2.5deg' : windIntensity === 'active' ? '15deg' : '6deg'}); }
        }
      `}</style>
      {/* Browser Nav / Address bar */}
      <div className="flex items-center gap-3 p-3.5 border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
        
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleBack} 
            disabled={historyIndex <= 0}
            className={`p-1.5 rounded-lg border transition-all ${
              historyIndex <= 0
                ? 'border-white/5 text-white/20'
                : 'border-white/10 hover:bg-white/5 active:scale-95 text-white/80 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          
          <button 
            onClick={handleForward} 
            disabled={historyIndex >= history.length - 1}
            className={`p-1.5 rounded-lg border transition-all ${
              historyIndex >= history.length - 1
                ? 'border-white/5 text-white/20'
                : 'border-white/10 hover:bg-white/5 active:scale-95 text-white/80 cursor-pointer'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={() => setUrl(url)}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 active:scale-95 text-white/80 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-black/35 border border-white/5 rounded-xl px-3 py-1.5 gap-2 hover:border-white/15 focus-within:border-orange-500/40 focus-within:shadow-[0_0_8px_rgba(249,115,22,0.1)] transition-all">
          <Globe className="w-3.5 h-3.5 text-white/40" />
          <input 
            type="text" 
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs text-white/90 placeholder-white/20 w-full font-mono"
            placeholder="Search peaceful spaces or type sunset:// address..."
          />
          <button type="submit" className="text-white/40 hover:text-white transition-all cursor-pointer">
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Home Preset list */}
        <div className="flex items-center gap-1">
          {[
            { label: 'Gardens', url: 'sunset://gardens', icon: <Sprout className="w-3 h-3 text-emerald-400" /> },
            { label: 'Rest', url: 'sunset://rest', icon: <Wind className="w-3 h-3 text-orange-300" /> },
            { label: 'Clouds', url: 'sunset://clouds', icon: <Cloud className="w-3 h-3 text-blue-300" /> }
          ].map(shortcut => (
            <button
              key={shortcut.label}
              onClick={() => navigateTo(shortcut.url)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
                url === shortcut.url
                  ? 'bg-orange-500/20 border-orange-500/30 text-orange-200 font-bold'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white/80'
              }`}
            >
              {shortcut.icon}
              <span className="hidden lg:inline">{shortcut.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Viewport Content */}
      <div className="flex-1 relative overflow-hidden bg-slate-900/10">
        {renderBrowserContent()}
      </div>
    </div>
  );
}
