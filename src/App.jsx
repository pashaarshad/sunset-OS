import React, { useState, useEffect } from 'react';
import { 
  Terminal as TermIcon, Folder, FileText, Music, Sparkles, Sun, Moon, TreePine, 
  Cpu, HardDrive, Wifi, Volume2, Calendar, Clock, RefreshCw, Globe,
  Monitor, Settings, Trash2, Gamepad2
} from 'lucide-react';

import FileManager from './components/FileManager';
import TextEditor from './components/TextEditor';
import MediaSuite from './components/MediaSuite';
import Terminal from './components/Terminal';
import VoiceAssistant from './components/VoiceAssistant';
import Browser from './components/Browser';
import SunsetSurfer from './components/SunsetSurfer';

import bgImage from './assets/sunset_bg.png';

export default function App() {
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [showSunsetMenu, setShowSunsetMenu] = useState(false);
  // 1. OS Boot & Theme State
  const [isBooted, setIsBooted] = useState(false);
  const [bootLogs, setBootLogs] = useState([]);
  const [bootProgress, setBootProgress] = useState(0);
  const [theme, setTheme] = useState('sunset'); // 'sunset' | 'greenery' | 'dusk'
  const [time, setTime] = useState(new Date());

  // 2. Audio Playback Loop (Calm ambient sound stream)
  const [ambientAudio, setAmbientAudio] = useState(null);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  // 3. Application Windows State
  const [openApps, setOpenApps] = useState({
    filemanager: false,
    texteditor: false,
    mediasuite: false,
    terminal: false,
    voiceassistant: true,
    browser: false,
    game: false
  });
  const [minimizedApps, setMinimizedApps] = useState({
    filemanager: false,
    texteditor: false,
    mediasuite: false,
    terminal: false,
    voiceassistant: false,
    browser: false,
    game: false
  });
  const [maximizedApps, setMaximizedApps] = useState({
    filemanager: false,
    texteditor: false,
    mediasuite: false,
    terminal: false,
    voiceassistant: false,
    browser: false,
    game: false
  });
  const [browserUrl, setBrowserUrl] = useState('sunset://gardens');

  const [activeApp, setActiveApp] = useState('voiceassistant');
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [mediaSuiteTab, setMediaSuiteTab] = useState('image');

  // Window coordinates for dragging
  const [winPositions, setWinPositions] = useState({
    filemanager: { x: 80, y: 100 },
    texteditor: { x: 260, y: 80 },
    mediasuite: { x: 180, y: 150 },
    terminal: { x: 120, y: 220 },
    voiceassistant: { x: 550, y: 90 },
    browser: { x: 220, y: 120 },
    game: { x: 150, y: 60 }
  });

  const [activeDragApp, setActiveDragApp] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Helper to synthesize startup welcome chime arpeggio
  const playStartupWebChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playToneAt = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = ctx.currentTime;
      // Ascending Serene 3-Tone Welcome Melody (Major Chord: C5 -> E5 -> G5)
      playToneAt(523, now, 0.15);       // C5 - 150ms
      playToneAt(659, now + 0.15, 0.15); // E5 - 150ms
      playToneAt(784, now + 0.30, 0.35); // G5 - 350ms
    } catch (e) {
      console.log("Welcome chime blocked by browser autoplay policy until user interacts.");
    }
  };

  // 4. Simulated Boot Sector Logs
  useEffect(() => {
    const logs = [
      "AP Bootloader v0.1: Initializing systems...",
      "BIOS check physical sector... OK (0x7C00)",
      "Standard registers AX/BX/CX/DX loaded... OK",
      "Switching CPU mode to Protected Mode... Done",
      "AP Bootloader: Reading sector 2 for LAZ Kernel...",
      "AP Bootloader: Transferring control to LAZ Kernel...",
      "LAZ Kernel v0.1: Booting successfully in Ring 0...",
      "GDT loaded at address 0x000100... OK",
      "Initializing physical memory map...",
      "Configuring VGA buffer at 0xB8000... Done",
      "Sunset OS (Ghuroob OS) loaded.",
      "Smart predictive loading engine started.",
      "Entering GUI desktop environment..."
    ];

    let currentLogIndex = 0;

    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setBootLogs(prev => [...prev, logs[currentLogIndex]]);
        const nextProgress = Math.min(100, Math.floor(((currentLogIndex + 1) / logs.length) * 100));
        setBootProgress(nextProgress);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        // Play serene welcome chime arpeggio exactly when fully loaded
        playStartupWebChime();
        setTimeout(() => {
          setIsBooted(true);
        }, 1200);
      }
    }, 280);

    return () => clearInterval(interval);
  }, []);

  // 5. Clock clock ticker
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 6. Ambient Audio System setup
  useEffect(() => {
    // Soundscape: royalty-free relaxing ambient track (using a public lofi stream URL)
    const audio = new Audio("https://codesandbox.io/api/v1/sandboxes/fpt3j/assets/sunset_lofi.mp3");
    audio.loop = true;
    audio.volume = 0.55;
    setAmbientAudio(audio);
    return () => {
      audio.pause();
    };
  }, []);

  const toggleAmbientMusic = (shouldPlay) => {
    if (!ambientAudio) return;
    if (shouldPlay) {
      ambientAudio.play().catch(err => console.log("Audio play deferred until user click interaction."));
      setIsAmbientPlaying(true);
    } else {
      ambientAudio.pause();
      setIsAmbientPlaying(false);
    }
  };

  // 7. Window management utilities
  const openApp = (appName, additionalState = null) => {
    setOpenApps(prev => ({ ...prev, [appName]: true }));
    setMinimizedApps(prev => ({ ...prev, [appName]: false }));
    setActiveApp(appName);
    if (appName === 'texteditor' && additionalState) {
      setSelectedFileId(additionalState);
    }
    if (appName === 'mediasuite' && additionalState) {
      setMediaSuiteTab(additionalState.tab);
      setSelectedFileId(additionalState.id);
    }
  };

  const closeApp = (appName, e) => {
    if (e) e.stopPropagation();
    setOpenApps(prev => ({ ...prev, [appName]: false }));
    setMinimizedApps(prev => ({ ...prev, [appName]: false }));
    setMaximizedApps(prev => ({ ...prev, [appName]: false }));
  };

  const minimizeApp = (appName, e) => {
    if (e) e.stopPropagation();
    setMinimizedApps(prev => ({ ...prev, [appName]: true }));
  };

  const toggleMaximizeApp = (appName, e) => {
    if (e) e.stopPropagation();
    setMaximizedApps(prev => ({ ...prev, [appName]: !prev[appName] }));
  };

  const handleDockIconClick = (appName, additionalState = null) => {
    if (!openApps[appName]) {
      openApp(appName, additionalState);
    } else if (minimizedApps[appName]) {
      setMinimizedApps(prev => ({ ...prev, [appName]: false }));
      setActiveApp(appName);
      if (appName === 'mediasuite' && additionalState) {
        setMediaSuiteTab(additionalState.tab);
      }
    } else if (activeApp !== appName) {
      setActiveApp(appName);
      if (appName === 'mediasuite' && additionalState) {
        setMediaSuiteTab(additionalState.tab);
      }
    } else {
      setMinimizedApps(prev => ({ ...prev, [appName]: true }));
    }
  };

  const bringToFront = (appName) => {
    if (minimizedApps[appName]) return;
    setActiveApp(appName);
  };

  // Drag listeners
  const startDrag = (appName, e) => {
    if (maximizedApps[appName]) return; // Disable drag if maximized
    bringToFront(appName);
    setActiveDragApp(appName);
    setDragOffset({
      x: e.clientX - winPositions[appName].x,
      y: e.clientY - winPositions[appName].y
    });
  };

  const performDrag = (e) => {
    if (!activeDragApp) return;
    setWinPositions(prev => ({
      ...prev,
      [activeDragApp]: {
        x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y))
      }
    }));
  };

  const stopDrag = () => {
    setActiveDragApp(null);
  };

  // AI assistant direct action pipeline mapping
  const triggerSystemAction = (action, payload) => {
    switch (action) {
      case 'play_music':
        toggleAmbientMusic(true);
        break;
      case 'pause_music':
        toggleAmbientMusic(false);
        break;
      case 'open_app':
        if (payload === 'browser') {
          openApp('browser');
        } else {
          openApp(payload);
        }
        break;
      case 'open_browser':
        if (payload) {
          setBrowserUrl(payload);
        }
        openApp('browser');
        break;
      case 'refresh_files':
        // VFS file manager reload is reactive via LocalStorage listeners
        break;
      case 'open_file':
        if (payload) {
          const { type, id } = payload;
          if (type === 'image' || type === 'audio' || type === 'video') {
            openApp('mediasuite', { tab: type, id });
          } else if (type === 'game') {
            openApp('game');
          } else {
            openApp('texteditor', id);
          }
        }
        break;
      case 'open_game':
        openApp('game');
        break;
      default:
        console.log("Unhandled system trigger: ", action);
    }
  };

  // 8. Style mapping for active themes
  const getThemeBackground = () => {
    switch (theme) {
      case 'greenery':
        return 'from-emerald-950 via-teal-950 to-slate-950';
      case 'dusk':
        return 'from-indigo-950 via-purple-950 to-zinc-950';
      default: // sunset
        return 'from-orange-950 via-rose-950 to-indigo-950';
    }
  };

  const getThemeTextGlow = () => {
    switch (theme) {
      case 'greenery': return 'text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]';
      case 'dusk': return 'text-purple-300 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]';
      default: return 'text-orange-300 drop-shadow-[0_0_10px_rgba(253,186,116,0.5)]';
    }
  };

  // Dynamic Quote selection
  const quotes = [
    "Endings are beautiful. They pave the way for a fresh, bright tomorrow.",
    "Breathe deeply. Let your processor rest, and focus on what truly matters.",
    "A quiet mind compiles the strongest programs.",
    "Watching sunsets teaches us that every day is a beautiful story."
  ];

  if (!isBooted) {
    // RENDER SIMULATED BIOS BOOTLOADER PAGE
    return (
      <div 
        onClick={playStartupWebChime}
        className="w-full h-full bg-gradient-to-br from-orange-950 via-rose-950 to-indigo-950 flex items-center justify-center p-6 select-none relative overflow-hidden cursor-pointer"
      >
        {/* Decorative backdrop elements */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        
        {/* Glow layer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#140b25]/85 border border-[#e38535]/30 p-8 rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl flex flex-col items-center">
          
          {/* Logo & Slogan */}
          <div className="flex flex-col items-center mb-6">
            <span className="text-5xl mb-2 filter drop-shadow-[0_0_15px_rgba(227,133,53,0.5)]">🌅</span>
            <h1 className="text-2xl font-bold tracking-wider text-[#e38535] drop-shadow-[0_0_8px_rgba(227,133,53,0.3)]">SUNSET OS</h1>
            <p className="text-[11px] text-white/50 tracking-widest uppercase mt-1">Ghuroob Operating System</p>
            <p className="text-xs text-white/70 italic mt-3">"Breathe in. Rest. Reflect."</p>
          </div>
          
          {/* Progress Bar Container */}
          <div className="w-full bg-black/40 border border-white/5 h-4 rounded-full overflow-hidden mb-6 relative">
            <div 
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_#e38535]"
              style={{ width: `${bootProgress}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {bootProgress}%
            </span>
          </div>

          {/* Logs Terminal Area */}
          <div className="w-full h-32 bg-black/60 border border-white/5 rounded-xl p-4 font-mono text-[10px] leading-relaxed overflow-y-auto text-amber-300/80 flex flex-col-reverse justify-start">
            <div className="space-y-1 flex flex-col">
              {bootLogs.slice().reverse().map((log, i) => (
                <p key={i} className="boot-loader-text truncate">
                  {log.startsWith("AP Bootloader") || log.startsWith("LAZ Kernel") || log.startsWith("Sunset OS") ? (
                    <span className="text-[#e38535] font-semibold">{log}</span>
                  ) : log.includes("successfully") || log.includes("OK") || log.includes("Done") ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : (
                    log
                  )}
                </p>
              ))}
            </div>
          </div>

          <div className="w-full mt-6 flex justify-between items-center text-[9px] text-white/30 border-t border-white/5 pt-4">
            <span>Power Mode: Serene</span>
            <span>Boot Offset: 0x10000</span>
          </div>
        </div>
      </div>
    );
  }

  // RENDER GRAPHICAL DESKTOP ENVIRONMENT
  return (
    <div 
      className={`w-full h-full bg-gradient-to-br ${getThemeBackground()} relative overflow-hidden flex flex-col`}
      onMouseMove={performDrag}
      onMouseUp={stopDrag}
    >
      {/* 🏞️ STUNNING GENERATED SUNSET WALLPAPER BACKGROUND */}
      <img 
        src={bgImage} 
        alt="Sunset background" 
        className="absolute inset-0 w-full h-full object-cover opacity-25 select-none pointer-events-none" 
      />

      {/* 🚀 TOP STATUS BAR */}
      <header className="h-10 w-full glass-panel border-t-0 border-x-0 rounded-none flex items-center justify-between px-6 z-[999] backdrop-blur-lg">
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="text-sm">🌅</span>
          <span className={`${getThemeTextGlow()}`}>Sunset OS v0.1</span>
          <span className="h-3 w-px bg-white/10"></span>
          <div className="flex items-center gap-1 opacity-70">
            <Cpu className="w-3.5 h-3.5" />
            <span>LAZ Kernel</span>
          </div>
        </div>

        {/* System parameters display */}
        <div className="flex items-center gap-6 text-xs text-white/80">
          <div className="flex items-center gap-1.5 opacity-70">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>RAM: 14MB (0.1%)</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-70">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local link</span>
          </div>
          
          {/* Calendar Clock */}
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="w-3.5 h-3.5 opacity-60" />
            <span>{time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <Clock className="w-3.5 h-3.5 opacity-60 ml-2" />
            <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      {/* 🖥️ DESKTOP AREA */}
      <main className="flex-1 p-6 relative">
        
        {/* Desktop Icons Shortcuts */}
        <div className="flex flex-col gap-6 w-24">
          <div 
            onClick={() => openApp('filemanager')}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-center group transition-colors duration-200"
          >
            <Folder className="w-8 h-8 text-amber-400 drop-shadow-md group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-white/90 group-hover:text-orange-300">File Explorer</span>
          </div>

          <div 
            onClick={() => openApp('texteditor')}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-center group transition-colors duration-200"
          >
            <FileText className="w-8 h-8 text-orange-400 drop-shadow-md group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-white/90 group-hover:text-orange-300">Text Editor</span>
          </div>

          <div 
            onClick={() => openApp('mediasuite')}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-center group transition-colors duration-200"
          >
            <Music className="w-8 h-8 text-pink-400 drop-shadow-md group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-white/90 group-hover:text-orange-300">Media Suite</span>
          </div>

          <div 
            onClick={() => openApp('terminal')}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-center group transition-colors duration-200"
          >
            <TermIcon className="w-8 h-8 text-emerald-400 drop-shadow-md group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-white/90 group-hover:text-orange-300">Sunset Shell</span>
          </div>

          <div 
            onClick={() => openApp('browser')}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-center group transition-colors duration-200"
          >
            <Globe className="w-8 h-8 text-blue-400 drop-shadow-md group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-white/90 group-hover:text-orange-300">Zen Browser</span>
          </div>

          <div 
            onClick={() => openApp('game')}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-center group transition-colors duration-200"
          >
            <Gamepad2 className="w-8 h-8 text-amber-400 drop-shadow-md group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-white/90 group-hover:text-orange-300">Sunset Surfer</span>
          </div>
        </div>

        {/* 💡 PERSISTENT DESKTOP WIDGET */}
        <div className="absolute right-6 top-6 w-60 glass-panel bg-slate-950/30 p-4 border border-white/5 flex flex-col gap-3 backdrop-blur-md select-none text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-bold flex items-center gap-1.5 text-white/95">
              <Sun className="w-3.5 h-3.5 text-orange-400 animate-spin-slow" /> Ambient Focus
            </span>
            <button 
              onClick={() => {
                const randomQuotes = quotes[Math.floor(Math.random() * quotes.length)];
                alert(randomQuotes);
              }}
              className="p-1 rounded hover:bg-white/5 text-white/60 hover:text-white"
              title="Refresh quote"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-white/80 leading-relaxed italic">
            "{quotes[0]}"
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-white/50">
            <span>Theme: {theme.toUpperCase()}</span>
            <div className="flex gap-2">
              <button onClick={() => setTheme('sunset')} className="w-2.5 h-2.5 rounded-full bg-orange-500" title="Sunset Orange" />
              <button onClick={() => setTheme('greenery')} className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Nature Green" />
              <button onClick={() => setTheme('dusk')} className="w-2.5 h-2.5 rounded-full bg-purple-500" title="Twilight Purple" />
            </div>
          </div>
        </div>

        {/* =====================================================================
         * 🖥️ GRAPHICAL APPLICATION WINDOWS LIST
         * ===================================================================== */}

        {/* 1. FILE EXPLORER APP */}
        {openApps.filemanager && (
          <div 
            className={`app-window glass-panel ${activeApp === 'filemanager' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ 
              left: maximizedApps.filemanager ? '0px' : `${winPositions.filemanager.x}px`, 
              top: maximizedApps.filemanager ? '0px' : `${winPositions.filemanager.y}px`,
              width: maximizedApps.filemanager ? '100vw' : '500px',
              height: maximizedApps.filemanager ? 'calc(100vh - 88px)' : '360px',
              opacity: minimizedApps.filemanager ? 0 : 1,
              transform: minimizedApps.filemanager ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
              pointerEvents: minimizedApps.filemanager ? 'none' : 'auto',
              display: openApps.filemanager ? 'flex' : 'none'
            }}
            onClick={() => bringToFront('filemanager')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('filemanager', e)}>
              <span className="window-title text-amber-300"><Folder className="w-4 h-4" /> File Explorer</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" onClick={(e) => minimizeApp('filemanager', e)} />
                <button className="window-action-btn window-btn-maximize" onClick={(e) => toggleMaximizeApp('filemanager', e)} />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('filemanager', e)} />
              </div>
            </div>
            <div className="window-body">
              <FileManager 
                openTextEditor={(id) => openApp('texteditor', id)}
                openMediaSuite={(tab, id) => openApp('mediasuite', { tab, id })}
                openGame={() => openApp('game')}
              />
            </div>
          </div>
        )}

        {/* 2. TEXT EDITOR APP */}
        {openApps.texteditor && (
          <div 
            className={`app-window glass-panel ${activeApp === 'texteditor' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ 
              left: maximizedApps.texteditor ? '0px' : `${winPositions.texteditor.x}px`, 
              top: maximizedApps.texteditor ? '0px' : `${winPositions.texteditor.y}px`,
              width: maximizedApps.texteditor ? '100vw' : '460px',
              height: maximizedApps.texteditor ? 'calc(100vh - 88px)' : '340px',
              opacity: minimizedApps.texteditor ? 0 : 1,
              transform: minimizedApps.texteditor ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
              pointerEvents: minimizedApps.texteditor ? 'none' : 'auto',
              display: openApps.texteditor ? 'flex' : 'none'
            }}
            onClick={() => bringToFront('texteditor')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('texteditor', e)}>
              <span className="window-title text-orange-400"><FileText className="w-4 h-4" /> Text Editor</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" onClick={(e) => minimizeApp('texteditor', e)} />
                <button className="window-action-btn window-btn-maximize" onClick={(e) => toggleMaximizeApp('texteditor', e)} />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('texteditor', e)} />
              </div>
            </div>
            <div className="window-body">
              <TextEditor fileId={selectedFileId} />
            </div>
          </div>
        )}

        {/* 3. MEDIA SUITE APP */}
        {openApps.mediasuite && (
          <div 
            className={`app-window glass-panel ${activeApp === 'mediasuite' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ 
              left: maximizedApps.mediasuite ? '0px' : `${winPositions.mediasuite.x}px`, 
              top: maximizedApps.mediasuite ? '0px' : `${winPositions.mediasuite.y}px`,
              width: maximizedApps.mediasuite ? '100vw' : '500px',
              height: maximizedApps.mediasuite ? 'calc(100vh - 88px)' : '340px',
              opacity: minimizedApps.mediasuite ? 0 : 1,
              transform: minimizedApps.mediasuite ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
              pointerEvents: minimizedApps.mediasuite ? 'none' : 'auto',
              display: openApps.mediasuite ? 'flex' : 'none'
            }}
            onClick={() => bringToFront('mediasuite')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('mediasuite', e)}>
              <span className="window-title text-pink-400"><Music className="w-4 h-4" /> Media Suite</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" onClick={(e) => minimizeApp('mediasuite', e)} />
                <button className="window-action-btn window-btn-maximize" onClick={(e) => toggleMaximizeApp('mediasuite', e)} />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('mediasuite', e)} />
              </div>
            </div>
            <div className="window-body">
              <MediaSuite initialTab={mediaSuiteTab} initialFileId={selectedFileId} />
            </div>
          </div>
        )}

        {/* 4. TERMINAL SHELL APP */}
        {openApps.terminal && (
          <div 
            className={`app-window glass-panel ${activeApp === 'terminal' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ 
              left: maximizedApps.terminal ? '0px' : `${winPositions.terminal.x}px`, 
              top: maximizedApps.terminal ? '0px' : `${winPositions.terminal.y}px`,
              width: maximizedApps.terminal ? '100vw' : '460px',
              height: maximizedApps.terminal ? 'calc(100vh - 88px)' : '320px',
              opacity: minimizedApps.terminal ? 0 : 1,
              transform: minimizedApps.terminal ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
              pointerEvents: minimizedApps.terminal ? 'none' : 'auto',
              display: openApps.terminal ? 'flex' : 'none'
            }}
            onClick={() => bringToFront('terminal')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('terminal', e)}>
              <span className="window-title text-emerald-400"><TermIcon className="w-4 h-4" /> Sunset Shell</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" onClick={(e) => minimizeApp('terminal', e)} />
                <button className="window-action-btn window-btn-maximize" onClick={(e) => toggleMaximizeApp('terminal', e)} />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('terminal', e)} />
              </div>
            </div>
            <div className="window-body">
              <Terminal 
                openVoiceAssistant={() => openApp('voiceassistant')}
                changeDesktopTheme={(themeName) => setTheme(themeName)}
                openTextEditor={(id) => openApp('texteditor', id)}
                triggerSystemAction={triggerSystemAction}
              />
            </div>
          </div>
        )}

        {/* 5. GHUROOB VOICE AI ASSISTANT APP */}
        {openApps.voiceassistant && (
          <div 
            className={`app-window glass-panel ${activeApp === 'voiceassistant' ? 'z-45 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ 
              left: maximizedApps.voiceassistant ? '0px' : `${winPositions.voiceassistant.x}px`, 
              top: maximizedApps.voiceassistant ? '0px' : `${winPositions.voiceassistant.y}px`,
              width: maximizedApps.voiceassistant ? '100vw' : '320px',
              height: maximizedApps.voiceassistant ? 'calc(100vh - 88px)' : '390px',
              opacity: minimizedApps.voiceassistant ? 0 : 1,
              transform: minimizedApps.voiceassistant ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
              pointerEvents: minimizedApps.voiceassistant ? 'none' : 'auto',
              display: openApps.voiceassistant ? 'flex' : 'none'
            }}
            onClick={() => bringToFront('voiceassistant')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('voiceassistant', e)}>
              <span className="window-title text-orange-300"><Sparkles className="w-4 h-4" /> Ghuroob Assistant</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" onClick={(e) => minimizeApp('voiceassistant', e)} />
                <button className="window-action-btn window-btn-maximize" onClick={(e) => toggleMaximizeApp('voiceassistant', e)} />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('voiceassistant', e)} />
              </div>
            </div>
            <div className="window-body">
              <VoiceAssistant triggerSystemAction={triggerSystemAction} />
            </div>
          </div>
        )}

        {/* 6. ZEN WEB BROWSER APP */}
        {openApps.browser && (
          <div 
            className={`app-window glass-panel ${activeApp === 'browser' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ 
              left: maximizedApps.browser ? '0px' : `${winPositions.browser.x}px`, 
              top: maximizedApps.browser ? '0px' : `${winPositions.browser.y}px`,
              width: maximizedApps.browser ? '100vw' : '580px',
              height: maximizedApps.browser ? 'calc(100vh - 88px)' : '410px',
              opacity: minimizedApps.browser ? 0 : 1,
              transform: minimizedApps.browser ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
              pointerEvents: minimizedApps.browser ? 'none' : 'auto',
              display: openApps.browser ? 'flex' : 'none'
            }}
            onClick={() => bringToFront('browser')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('browser', e)}>
              <span className="window-title text-blue-300"><Globe className="w-4 h-4" /> Zen Browser</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" onClick={(e) => minimizeApp('browser', e)} />
                <button className="window-action-btn window-btn-maximize" onClick={(e) => toggleMaximizeApp('browser', e)} />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('browser', e)} />
              </div>
            </div>
            <div className="window-body">
              <Browser initialUrl={browserUrl} />
            </div>
          </div>
        )}

        {/* 7. SUNSET SURFER GAME APP */}
        {openApps.game && (
          <div 
            className={`app-window glass-panel ${activeApp === 'game' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ 
              left: maximizedApps.game ? '0px' : `${winPositions.game.x}px`, 
              top: maximizedApps.game ? '0px' : `${winPositions.game.y}px`,
              width: maximizedApps.game ? '100vw' : '560px',
              height: maximizedApps.game ? 'calc(100vh - 88px)' : '380px',
              opacity: minimizedApps.game ? 0 : 1,
              transform: minimizedApps.game ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
              pointerEvents: minimizedApps.game ? 'none' : 'auto',
              display: openApps.game ? 'flex' : 'none'
            }}
            onClick={() => bringToFront('game')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('game', e)}>
              <span className="window-title text-amber-400"><Gamepad2 className="w-4 h-4" /> Sunset Surfer</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" onClick={(e) => minimizeApp('game', e)} />
                <button className="window-action-btn window-btn-maximize" onClick={(e) => toggleMaximizeApp('game', e)} />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('game', e)} />
              </div>
            </div>
            <div className="window-body">
              <SunsetSurfer />
            </div>
          </div>
        )}

      </main>

      {/* 🌅 SUNSET QUICK MENU POPUP */}
      {showSunsetMenu && (
        <div className="absolute bottom-20 left-1/2 -translate-x-[220px] w-64 bg-[#1e0d10]/95 border border-white/5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-4 z-[99999] flex flex-col gap-3.5 select-none animate-[typing-appear_0.2s_ease-out]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-bold flex items-center gap-1.5 text-orange-300 text-xs">
              🌅 Sunset Quick Settings
            </span>
            <button 
              onClick={() => {
                const randomQuotes = quotes[Math.floor(Math.random() * quotes.length)];
                alert(randomQuotes);
              }}
              className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white"
              title="New Quote"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-white/45 tracking-wider uppercase font-semibold">Change Theme</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setTheme('sunset')} 
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${theme === 'sunset' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-white/5 text-white/60 border-transparent'}`}
              >
                Sunset
              </button>
              <button 
                onClick={() => setTheme('greenery')} 
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${theme === 'greenery' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-white/60 border-transparent'}`}
              >
                Greenery
              </button>
              <button 
                onClick={() => setTheme('dusk')} 
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${theme === 'dusk' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-white/5 text-white/60 border-transparent'}`}
              >
                Dusk
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-white/45 tracking-wider uppercase font-semibold">Music Stream</p>
            <button 
              onClick={() => toggleAmbientMusic(!isAmbientPlaying)}
              className={`w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border transition-all ${isAmbientPlaying ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 text-white/60 border-transparent'}`}
            >
              <Volume2 className={`w-3.5 h-3.5 ${isAmbientPlaying ? 'animate-bounce' : ''}`} />
              <span>{isAmbientPlaying ? "Lofi ON (Click to Mute)" : "Lofi Stream OFF"}</span>
            </button>
          </div>

          <div className="border-t border-white/5 pt-2 mt-1">
            <p className="text-[10px] text-white/40 italic leading-relaxed">
              "{quotes[Math.floor(time.getSeconds() / 15) % quotes.length]}"
            </p>
          </div>
        </div>
      )}

      {/* 🗑️ ZEN TRASH MODAL */}
      {showTrashDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999999] select-none">
          <div className="w-80 bg-[#1e0d10]/95 border border-[#ff7f50]/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center text-center animate-[typing-appear_0.25s_ease-out]">
            <span className="text-4xl mb-3">🗑️</span>
            <h3 className="text-base font-bold text-orange-300 mb-2">Zen Mind, Empty Trash</h3>
            <p className="text-xs text-white/70 leading-relaxed mb-5">
              "Calm Mind, Empty Trash. Absolute peace has no waste. Sunset OS has automatically recycled all digital stress."
            </p>
            
            <div className="w-full flex gap-3">
              <button 
                onClick={() => {
                  const vfs = JSON.parse(localStorage.getItem('sunset_os_vfs') || '[]');
                  const filtered = vfs.filter(item => item.parent !== 'trash');
                  localStorage.setItem('sunset_os_vfs', JSON.stringify(filtered));
                  window.dispatchEvent(new Event('sunset_vfs_changed'));
                  
                  try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const playTone = (f, t, d) => {
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.connect(gain); gain.connect(ctx.destination);
                      osc.frequency.value = f; osc.type = 'triangle';
                      gain.gain.setValueAtTime(0.001, t);
                      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
                      gain.gain.exponentialRampToValueAtTime(0.001, t + d);
                      osc.start(t); osc.stop(t + d);
                    };
                    const now = ctx.currentTime;
                    playTone(880, now, 0.15);
                    playTone(1046, now + 0.1, 0.25);
                  } catch (e) {}
                  
                  setShowTrashDialog(false);
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 font-semibold text-xs text-white shadow-lg transition-all"
              >
                Empty Mind
              </button>
              <button 
                onClick={() => setShowTrashDialog(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 font-semibold text-xs text-white/80 transition-colors"
              >
                Absolute Peace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 CENTERED FLOATING BOTTOM DOCK */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#1e0d10]/75 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[9999] flex items-center gap-3 transition-all duration-300 select-none">
        
        {/* Item 1: Sunset Menu Sun */}
        <div 
          onClick={() => { setShowSunsetMenu(!showSunsetMenu); }}
          className="group relative w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300"
          title="Sunset Menu"
        >
          <svg className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sunGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f39c12" />
                <stop offset="50%" stopColor="#d35400" />
                <stop offset="100%" stopColor="#c0392b" />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="url(#sunGrad)" />
            <line x1="20" y1="6" x2="20" y2="2" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="34" x2="20" y2="38" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="6" y1="20" x2="2" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="34" y1="20" x2="38" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 28C14 26 17 25 20 25C23 25 26 26 28 28" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {showSunsetMenu && <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />}
        </div>

        {/* Item 2: Shell Console */}
        <div 
          onClick={() => handleDockIconClick('terminal')}
          className="group relative w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300"
          title="Terminal Shell"
        >
          <svg className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#1e272e" stroke="#2f3640" strokeWidth="1" />
            <path d="M12 14L18 20L12 26" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="20" y1="26" x2="28" y2="26" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          {openApps.terminal && <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(46,204,113,0.8)]" />}
        </div>

        {/* Item 3: File Manager */}
        <div 
          onClick={() => handleDockIconClick('filemanager')}
          className="group relative w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300"
          title="File Manager"
        >
          <svg className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="folderGradDock" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e67e22" />
                <stop offset="100%" stopColor="#e74c3c" />
              </linearGradient>
            </defs>
            <path d="M4 10C4 8.5 5.2 7 7 7H16L20 11H33C34.8 11 36 12.5 36 14V33C36 34.5 34.8 36 33 36H7C5.2 36 4 34.5 4 33V10Z" fill="url(#folderGradDock)" />
            <path d="M4 14C4 12.5 5.2 11 7 11H33C34.8 11 36 12.5 36 14V33C36 34.5 34.8 36 33 36H7C5.2 36 4 34.5 4 33V14Z" fill="#f39c12" />
          </svg>
          {openApps.filemanager && <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(241,196,15,0.8)]" />}
        </div>

        {/* Item 4: Text Editor */}
        <div 
          onClick={() => handleDockIconClick('texteditor')}
          className="group relative w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300"
          title="Text Editor"
        >
          <svg className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="28" height="32" rx="6" fill="#fff" stroke="#ffdcd4" strokeWidth="1" />
            <line x1="12" y1="12" x2="28" y2="12" stroke="#ff7f50" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="20" x2="28" y2="20" stroke="#ff7f50" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="28" x2="22" y2="28" stroke="#ff7f50" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M26 24L32 18L34 20L28 26L26 24Z" fill="#ff7f50" />
          </svg>
          {openApps.texteditor && <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />}
        </div>

        {/* Item 5: Music / Media Suite Audio */}
        <div 
          onClick={() => handleDockIconClick('mediasuite', { tab: 'audio' })}
          className="group relative w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300"
          title="Music Suite"
        >
          <svg className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#2c1a1d" stroke="#5d2a2c" strokeWidth="1" />
            <circle cx="14" cy="26" r="4" fill="#e74c3c" />
            <circle cx="28" cy="24" r="4" fill="#e74c3c" />
            <path d="M18 26V10L32 8V24" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          {openApps.mediasuite && mediaSuiteTab === 'audio' && <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-pink-400 shadow-[0_0_6px_rgba(233,78,119,0.8)]" />}
        </div>

        {/* Item 6: Zen Quick Settings Cog */}
        <div 
          onClick={() => { setShowSunsetMenu(!showSunsetMenu); }}
          className="group relative w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300"
          title="System Settings"
        >
          <svg className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#333" stroke="#444" strokeWidth="1" />
            <circle cx="20" cy="20" r="5" fill="none" stroke="#ccc" strokeWidth="3" />
            <path d="M20 8V12M20 28V32M8 20H12M28 20H32M11.5 11.5L14.3 14.3M25.7 25.7L28.5 28.5M11.5 28.5L14.3 25.7M25.7 11.5L28.5 14.3" stroke="#ccc" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        {/* Item 6.5: Sunset Surfer Game */}
        <div 
          onClick={() => handleDockIconClick('game')}
          className="group relative w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300"
          title="Sunset Surfer Game"
        >
          <svg className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gameGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e8651a" />
                <stop offset="100%" stopColor="#ffb347" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="10" fill="url(#gameGrad)" />
            <rect x="8" y="14" width="24" height="14" rx="7" fill="rgba(0,0,0,0.3)" />
            <circle cx="15" cy="21" r="3" fill="none" stroke="white" strokeWidth="1.5" />
            <line x1="15" y1="18.5" x2="15" y2="23.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12.5" y1="21" x2="17.5" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="27" cy="19" r="2" fill="white" opacity="0.9" />
            <circle cx="24" cy="22" r="2" fill="white" opacity="0.7" />
          </svg>
          {openApps.game && <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(255,179,71,0.8)]" />}
        </div>

        {/* Item 7: Photos / Media Suite Image */}
        <div 
          onClick={() => handleDockIconClick('mediasuite', { tab: 'image' })}
          className="group relative w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300"
          title="Gallery Suite"
        >
          <svg className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#d35400" stroke="#e67e22" strokeWidth="1" />
            <rect x="6" y="6" width="28" height="28" rx="4" fill="#ff7f50" />
            <circle cx="13" cy="13" r="2.5" fill="#f1c40f" />
            <path d="M6 28L16 18L34 34H6Z" fill="#e74c3c" />
          </svg>
          {openApps.mediasuite && mediaSuiteTab === 'image' && <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />}
        </div>

        {/* Item 8: Recycled Trash */}
        <div 
          onClick={() => setShowTrashDialog(true)}
          className="group relative w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300"
          title="Zen Trash"
        >
          <svg className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#1c0f12" stroke="#2c1418" strokeWidth="1" />
            <path d="M12 12H28M15 12V10C15 8.9 15.9 8 17 8H23C24.1 8 25 8.9 25 10V12M14 12V30C14 31.1 14.9 32 16 32H24C25.1 32 26 31.1 26 30V12" stroke="#ff7f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="18" y1="18" x2="18" y2="26" stroke="#ff7f50" strokeWidth="2" strokeLinecap="round" />
            <line x1="22" y1="18" x2="22" y2="26" stroke="#ff7f50" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

      </footer>
    </div>
  );
}
