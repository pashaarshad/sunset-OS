import React, { useState, useEffect } from 'react';
import { 
  Terminal as TermIcon, Folder, FileText, Music, Sparkles, Sun, Moon, TreePine, 
  Cpu, HardDrive, Wifi, Volume2, Calendar, Clock, RefreshCw 
} from 'lucide-react';

import FileManager from './components/FileManager';
import TextEditor from './components/TextEditor';
import MediaSuite from './components/MediaSuite';
import Terminal from './components/Terminal';
import VoiceAssistant from './components/VoiceAssistant';

import bgImage from './assets/sunset_bg.png';

export default function App() {
  // 1. OS Boot & Theme State
  const [isBooted, setIsBooted] = useState(false);
  const [bootLogs, setBootLogs] = useState([]);
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
    voiceassistant: true // Voice Assistant open by default for helpfulness
  });

  const [activeApp, setActiveApp] = useState('voiceassistant');
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [mediaSuiteTab, setMediaSuiteTab] = useState('image');

  // Window coordinates for dragging
  const [winPositions, setWinPositions] = useState({
    filemanager: { x: 80, y: 100 },
    texteditor: { x: 260, y: 80 },
    mediasuite: { x: 180, y: 150 },
    terminal: { x: 120, y: 220 },
    voiceassistant: { x: 550, y: 90 }
  });

  const [activeDragApp, setActiveDragApp] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 4. Simulated Boot Sector Logs
  useEffect(() => {
    const logs = [
      "AP Bootloader v0.1: Initializing systems...",
      "BIOS check physical sector... OK (0x7C00)",
      "Standard registers AX/BX/CX/DX loaded... OK",
      "Switching CPU mode to Real Mode... Done",
      "Bootloader: Reading sector 2 for LAZ Kernel...",
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
        currentLogIndex++;
      } else {
        clearInterval(interval);
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
    e.stopPropagation();
    setOpenApps(prev => ({ ...prev, [appName]: false }));
  };

  const bringToFront = (appName) => {
    setActiveApp(appName);
  };

  // Drag listeners
  const startDrag = (appName, e) => {
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
        openApp(payload);
        break;
      case 'refresh_files':
        // VFS file manager reload is reactive via LocalStorage listeners
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
      <div className="w-full h-full bg-[#07050a] flex items-center justify-center p-6 text-[#00ff66] font-mono select-none">
        <div className="w-full max-w-2xl bg-black/60 border border-[#00ff66]/10 p-8 rounded-xl shadow-2xl">
          <div className="flex justify-between items-center border-b border-[#00ff66]/20 pb-4 mb-6">
            <h2 className="text-sm font-bold tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4 animate-pulse" /> AP-BIOS ROM v1.0.86
            </h2>
            <span className="text-xs opacity-60">Ready to Boot</span>
          </div>
          
          <div className="space-y-2 text-xs leading-relaxed max-h-80 overflow-y-auto pr-1">
            {bootLogs.map((log, i) => (
              <p key={i} className="boot-loader-text">
                {log.startsWith("AP Bootloader") || log.startsWith("Laz Kernel") ? (
                  <span className="text-yellow-400 font-bold">{log}</span>
                ) : log.includes("successfully") || log.includes("OK") ? (
                  <span className="text-emerald-400">{log}</span>
                ) : (
                  log
                )}
              </p>
            ))}
          </div>

          <div className="mt-8 flex justify-between items-center text-[10px] opacity-45 border-t border-[#00ff66]/10 pt-4">
            <span>Power input: Normal</span>
            <span>Target offset: 0x7C00</span>
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
            className={`app-window glass-panel w-[500px] h-[360px] ${activeApp === 'filemanager' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ left: `${winPositions.filemanager.x}px`, top: `${winPositions.filemanager.y}px` }}
            onClick={() => bringToFront('filemanager')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('filemanager', e)}>
              <span className="window-title text-amber-300"><Folder className="w-4 h-4" /> File Explorer</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" />
                <button className="window-action-btn window-btn-maximize" />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('filemanager', e)} />
              </div>
            </div>
            <div className="window-body">
              <FileManager 
                openTextEditor={(id) => openApp('texteditor', id)}
                openMediaSuite={(tab, id) => openApp('mediasuite', { tab, id })}
              />
            </div>
          </div>
        )}

        {/* 2. TEXT EDITOR APP */}
        {openApps.texteditor && (
          <div 
            className={`app-window glass-panel w-[460px] h-[340px] ${activeApp === 'texteditor' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ left: `${winPositions.texteditor.x}px`, top: `${winPositions.texteditor.y}px` }}
            onClick={() => bringToFront('texteditor')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('texteditor', e)}>
              <span className="window-title text-orange-400"><FileText className="w-4 h-4" /> Text Editor</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" />
                <button className="window-action-btn window-btn-maximize" />
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
            className={`app-window glass-panel w-[500px] h-[340px] ${activeApp === 'mediasuite' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ left: `${winPositions.mediasuite.x}px`, top: `${winPositions.mediasuite.y}px` }}
            onClick={() => bringToFront('mediasuite')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('mediasuite', e)}>
              <span className="window-title text-pink-400"><Music className="w-4 h-4" /> Media Suite</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" />
                <button className="window-action-btn window-btn-maximize" />
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
            className={`app-window glass-panel w-[460px] h-[320px] ${activeApp === 'terminal' ? 'z-40 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ left: `${winPositions.terminal.x}px`, top: `${winPositions.terminal.y}px` }}
            onClick={() => bringToFront('terminal')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('terminal', e)}>
              <span className="window-title text-emerald-400"><TermIcon className="w-4 h-4" /> Sunset Shell</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" />
                <button className="window-action-btn window-btn-maximize" />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('terminal', e)} />
              </div>
            </div>
            <div className="window-body">
              <Terminal 
                openVoiceAssistant={() => openApp('voiceassistant')}
                changeDesktopTheme={(themeName) => setTheme(themeName)}
                openTextEditor={(id) => openApp('texteditor', id)}
              />
            </div>
          </div>
        )}

        {/* 5. GHUROOB VOICE AI ASSISTANT APP */}
        {openApps.voiceassistant && (
          <div 
            className={`app-window glass-panel w-[320px] h-[390px] ${activeApp === 'voiceassistant' ? 'z-45 ring-1 ring-orange-500/20' : 'z-20'}`}
            style={{ left: `${winPositions.voiceassistant.x}px`, top: `${winPositions.voiceassistant.y}px` }}
            onClick={() => bringToFront('voiceassistant')}
          >
            <div className="window-header" onMouseDown={(e) => startDrag('voiceassistant', e)}>
              <span className="window-title text-orange-300"><Sparkles className="w-4 h-4" /> Ghuroob Assistant</span>
              <div className="window-actions">
                <button className="window-action-btn window-btn-minimize" />
                <button className="window-action-btn window-btn-maximize" />
                <button className="window-action-btn window-btn-close" onClick={(e) => closeApp('voiceassistant', e)} />
              </div>
            </div>
            <div className="window-body">
              <VoiceAssistant triggerSystemAction={triggerSystemAction} />
            </div>
          </div>
        )}

      </main>

      {/* 🚀 TASKBAR (FROSTED GLASS PANEL) */}
      <footer className="taskbar glass-panel shadow-2xl flex items-center justify-between px-6 backdrop-blur-md">
        
        {/* App short-cut launcher items */}
        <div className="flex gap-4 items-center">
          <div 
            onClick={() => openApp('filemanager')}
            className={`taskbar-icon relative ${openApps.filemanager ? 'active bg-white/10' : ''}`}
            title="File Explorer"
          >
            <Folder className="w-5 h-5 text-amber-300" />
          </div>

          <div 
            onClick={() => openApp('texteditor')}
            className={`taskbar-icon relative ${openApps.texteditor ? 'active bg-white/10' : ''}`}
            title="Text Editor"
          >
            <FileText className="w-5 h-5 text-orange-400" />
          </div>

          <div 
            onClick={() => openApp('mediasuite')}
            className={`taskbar-icon relative ${openApps.mediasuite ? 'active bg-white/10' : ''}`}
            title="Media Player"
          >
            <Music className="w-5 h-5 text-pink-400" />
          </div>

          <div 
            onClick={() => openApp('terminal')}
            className={`taskbar-icon relative ${openApps.terminal ? 'active bg-white/10' : ''}`}
            title="Console Shell"
          >
            <TermIcon className="w-5 h-5 text-emerald-400" />
          </div>

          <span className="w-px h-6 bg-white/10 mx-1"></span>

          {/* AI Voice Assistant trigger in taskbar */}
          <div 
            onClick={() => openApp('voiceassistant')}
            className={`taskbar-icon relative ${openApps.voiceassistant ? 'active bg-white/10' : ''} bg-orange-500/10 border-orange-500/20`}
            title="Ghuroob AI Voice Assistant"
          >
            <Sparkles className="w-5 h-5 text-orange-300" />
          </div>
        </div>

        {/* Ambient audio player quick trigger */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <button 
            onClick={() => toggleAmbientMusic(!isAmbientPlaying)}
            className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold ${isAmbientPlaying ? 'bg-orange-500 text-white shadow-md' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            <Volume2 className={`w-4 h-4 ${isAmbientPlaying ? 'animate-bounce' : ''}`} />
            <span>{isAmbientPlaying ? "Lofi ON" : "Muted"}</span>
          </button>
        </div>

      </footer>
    </div>
  );
}
