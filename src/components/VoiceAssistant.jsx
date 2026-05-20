import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, MessageSquare, Sparkles } from 'lucide-react';

export default function VoiceAssistant({ triggerSystemAction }) {
  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState("Hello! I am Ghuroob, your calm Sunset OS assistant. Tell me to 'play music', 'open files', 'motivate me', or 'create file rules.txt'!");
  const [inputVal, setInputVal] = useState('');
  const [recognition, setRecognition] = useState(null);

  // 1. Initialize Web Speech Recognition
  useEffect(() => {
    // Localized context memory greetings
    const vfs = JSON.parse(localStorage.getItem('sunset_os_vfs') || '[]');
    const textFiles = vfs.filter(item => item.type === 'file' && item.name.endsWith('.txt'));
    if (textFiles.length > 0) {
      const latestFile = textFiles[textFiles.length - 1];
      setResponse(`Welcome back, creator. I recall your calm focus. We recently worked on '${latestFile.name}' inside your Documents folder. Shall we open it?`);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
        setResponse("Apologies, I had trouble hearing that. Please try again or type your command below.");
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        processVoiceCommand(text);
      };

      setRecognition(rec);
    }
  }, []);

  // 1.5 Web Audio API Synth to match bare-metal PC Speaker
  const webPlayChime = () => {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playToneAt = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'triangle'; // Calm, soft retro synthesizer tone
        
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = ctx.currentTime;
      playToneAt(523, now, 0.15);       // C5
      playToneAt(659, now + 0.15, 0.15); // E5
      playToneAt(784, now + 0.30, 0.35); // G5
    }
  };

  // 2. Soothing warm Speech Synthesis Voice Output
  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel active speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;   // Calm, slightly slower pacing
      utterance.pitch = 0.95; // Softer, lower comforting pitch
      
      // Attempt to load standard calming female/male voices if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Calm"));
      if (naturalVoice) utterance.voice = naturalVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  // 3. Process voice or typed natural language commands
  const processVoiceCommand = (commandText) => {
    const cleanCmd = commandText.toLowerCase().trim();
    let reply = "";

    // Motivational Sunset Quotes
    const quotes = [
      "A sunset is nature's beautiful way of showing that endings can be beautiful too. Sleep well, you did your best.",
      "Sunsets are proof that no matter what happens, every day can end beautifully. Breathe in the calm.",
      "Take a moment to watch the sky transition. Just like the sun, you will rise and shine again tomorrow.",
      "Peace is not the absence of trouble, but the presence of calm. Sunset OS is your digital sanctuary.",
      "Every sunset is an opportunity to reset. Let go of today's worries."
    ];

    if (cleanCmd.includes("play music") || cleanCmd.includes("lofi") || cleanCmd.includes("relax")) {
      triggerSystemAction('play_music');
      reply = "Right away. Soft ambient lofi music is now active. Let the calm wash over you.";
    } 
    else if (cleanCmd.includes("stop music") || cleanCmd.includes("pause music")) {
      triggerSystemAction('pause_music');
      reply = "I have paused the audio playback. Absolute silence ready.";
    } 
    else if (cleanCmd.includes("play startup chime") || cleanCmd.includes("play chime") || cleanCmd.includes("sound")) {
      webPlayChime();
      reply = "Synthesizing bare-metal Programmable Interval Timer Channel 2 audio. Serene ascending melody completed.";
    }
    else if (cleanCmd.includes("about the sunset") || cleanCmd.includes("philosophy") || cleanCmd.includes("name") || cleanCmd.includes("why sunset") || cleanCmd.includes("inspiration")) {
      reply = "Sunset OS (Ghuroob OS) is inspired by daily walks in the park between Asr and Maghrib. It is a peaceful time when the sun sets, refreshing our eyes with greenery and giving deep motivation. The LAZ kernel runs on clean multitasking windows and idle breathing states to emulate this nature sequence.";
    }
    else if (cleanCmd.includes("open file") || cleanCmd.includes("open explorer") || cleanCmd.includes("show documents")) {
      triggerSystemAction('open_app', 'filemanager');
      reply = "Launching the File Manager. Exploring your documents.";
    } 
    else if (cleanCmd.includes("open terminal") || cleanCmd.includes("open shell") || cleanCmd.includes("open command")) {
      triggerSystemAction('open_app', 'terminal');
      reply = "Opening SunsetSH console terminal. Direct kernel systems ready.";
    } 
    else if (cleanCmd.includes("open editor") || cleanCmd.includes("open text") || cleanCmd.includes("open writer")) {
      triggerSystemAction('open_app', 'texteditor');
      reply = "Launching distraction-free Text Editor. Write down your sunset thoughts.";
    } 
    else if (cleanCmd.includes("motivate") || cleanCmd.includes("quote") || cleanCmd.includes("sunset")) {
      const idx = Math.floor(Math.random() * quotes.length);
      reply = quotes[idx];
    } 
    else if (cleanCmd.startsWith("create file named") || cleanCmd.startsWith("create file")) {
      // Parse file name (e.g., "create file named sunset.txt" -> "sunset.txt")
      let fileName = cleanCmd.replace("create file named", "").replace("create file", "").trim();
      if (!fileName) {
        fileName = "voice_notes.txt";
      } else {
        fileName = fileName.replace(/\s+/g, "_"); // spaces to underscores
        if (!fileName.endsWith(".txt")) fileName += ".txt";
      }

      // Call filesystem manipulation
      const vfs = JSON.parse(localStorage.getItem('sunset_os_vfs') || '[]');
      const newFile = {
        id: Date.now().toString(),
        name: fileName,
        type: 'file',
        parent: '1', // Documents
        content: `Document created via voice command: "${commandText}" at sunset.`
      };
      
      const updated = [...vfs, newFile];
      localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
      window.dispatchEvent(new Event('sunset_vfs_changed'));
      
      triggerSystemAction('refresh_files');
      reply = `I have successfully created a file named '${fileName}' inside your Documents folder.`;
    } 
    else {
      reply = `I understood your instruction: "${commandText}". However, I am keeping background tasks minimal. Let me know if you want to 'play music', 'open files', 'motivate me', or create new text files!`;
    }

    setResponse(reply);
    speakMessage(reply);
    setInputVal('');
  };

  const handleStartMic = () => {
    if (recognition) {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } else {
      setResponse("Speech recognition is not supported in this browser. Please use the text input below to chat with Ghuroob!");
    }
  };

  const handleSendText = () => {
    if (inputVal.trim()) {
      processVoiceCommand(inputVal);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/20 text-white font-sans text-sm selection:bg-orange-500/30 p-6 select-none justify-between">
      
      {/* AI Assistant Avatar Status */}
      <div className="flex flex-col items-center justify-center gap-6 mt-4">
        {/* Glow pulsing ring avatar */}
        <div className="relative">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-600 shadow-2xl transition-all duration-500 ${isListening ? 'microphone-pulse scale-105' : 'opacity-90'}`}>
            <div className="w-24 h-24 rounded-full bg-slate-950 flex items-center justify-center border-2 border-white/5">
              {isListening ? (
                <Mic className="w-8 h-8 text-orange-400 animate-pulse" />
              ) : (
                <Sparkles className="w-8 h-8 text-white/80" />
              )}
            </div>
          </div>
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>

        {/* Listening / Speaking text */}
        <div className="text-center">
          <h3 className="text-base font-bold text-white/95 tracking-wide">Ghuroob Voice Assistant</h3>
          <p className="text-xs text-orange-300 font-medium mt-1">
            {isListening ? "Listening closely..." : "Idle (Standing by for voice)"}
          </p>
        </div>
      </div>

      {/* Soothing response glass panel */}
      <div className="flex-1 my-6 p-4 glass-card bg-slate-950/40 border border-white/5 rounded-xl flex items-start gap-3 overflow-y-auto max-h-48">
        <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-white/90 italic font-medium">
          "{response}"
        </p>
      </div>

      {/* Interactive Microphone click / manual input bar */}
      <div className="flex items-center gap-3 border-t border-white/5 pt-4 bg-slate-950/20 rounded-b-xl">
        <button
          onClick={handleStartMic}
          className={`p-3.5 rounded-full text-white shadow-lg transition-all duration-300 ${isListening ? 'bg-rose-600 hover:bg-rose-700 active:scale-95' : 'bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-orange-500/20'}`}
          title={isListening ? "Stop listening" : "Talk to Ghuroob AI"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            placeholder="Ask anything (e.g. play lofi)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            className="w-full glass-input text-xs py-3 pr-10"
          />
          <button 
            onClick={handleSendText}
            className="absolute right-2 p-1.5 rounded hover:bg-white/5 text-orange-400 hover:text-orange-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
