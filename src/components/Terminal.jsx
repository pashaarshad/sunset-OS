/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — Interactive Shell Simulator
 * File: Terminal.jsx
 * Author: Arshad Pasha
 * Copyright (c) 2026 Arshad Pasha. All Rights Reserved.
 * License: Private. Authorized use only under the Sunset OS License Agreement.
 * ===================================================================== */
import React, { useState, useEffect, useRef } from 'react';

export default function Terminal({ openVoiceAssistant, changeDesktopTheme, openTextEditor, triggerSystemAction }) {
  const [activeTab, setActiveTab] = useState(0);
  const [terminalsState, setTerminalsState] = useState([
    {
      history: [
        { text: "Welcome to SunsetSH (Sunset OS Shell) v0.1 — Terminal 1", type: "system" },
        { text: "Type 'help' to list available system commands.", type: "info" },
        { text: "", type: "info" }
      ],
      input: '',
      cmdHistoryList: [],
      cwd: ''
    },
    {
      history: [
        { text: "Welcome to SunsetSH (Sunset OS Shell) v0.1 — Terminal 2", type: "system" },
        { text: "Type 'help' to list available system commands.", type: "info" },
        { text: "", type: "info" }
      ],
      input: '',
      cmdHistoryList: [],
      cwd: ''
    },
    {
      history: [
        { text: "Welcome to SunsetSH (Sunset OS Shell) v0.1 — Terminal 3", type: "system" },
        { text: "Type 'help' to list available system commands.", type: "info" },
        { text: "", type: "info" }
      ],
      input: '',
      cmdHistoryList: [],
      cwd: ''
    }
  ]);
  const [isMatrixActive, setIsMatrixActive] = useState(false);

  const activeTerm = terminalsState[activeTab];
  const history = activeTerm.history;
  const input = activeTerm.input;
  const cmdHistoryList = activeTerm.cmdHistoryList;
  const cwd = activeTerm.cwd;

  const setHistory = (valOrFn) => {
    setTerminalsState(prev => {
      const next = [...prev];
      const current = next[activeTab];
      next[activeTab] = {
        ...current,
        history: typeof valOrFn === 'function' ? valOrFn(current.history) : valOrFn
      };
      return next;
    });
  };

  const setInput = (valOrFn) => {
    setTerminalsState(prev => {
      const next = [...prev];
      const current = next[activeTab];
      next[activeTab] = {
        ...current,
        input: typeof valOrFn === 'function' ? valOrFn(current.input) : valOrFn
      };
      return next;
    });
  };

  const setCwd = (valOrFn) => {
    setTerminalsState(prev => {
      const next = [...prev];
      const current = next[activeTab];
      next[activeTab] = {
        ...current,
        cwd: typeof valOrFn === 'function' ? valOrFn(current.cwd) : valOrFn
      };
      return next;
    });
  };

  const setCmdHistoryList = (valOrFn) => {
    setTerminalsState(prev => {
      const next = [...prev];
      const current = next[activeTab];
      next[activeTab] = {
        ...current,
        cmdHistoryList: typeof valOrFn === 'function' ? valOrFn(current.cmdHistoryList) : valOrFn
      };
      return next;
    });
  };
  const terminalEndRef = useRef(null);

  // Auto scroll to bottom of logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Audio key tick synthesizer
  const playTick = () => {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    }
  };

  // Audio command completion feedback
  const playCmdChime = (success = true) => {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(success ? 880 : 330, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  };

  // Handler for custom local virtual filesystem changes
  const getFilesList = () => {
    return JSON.parse(localStorage.getItem('sunset_os_vfs') || '[]');
  };

  const getParentIdForCwd = (path) => {
    if (!path) return 'root';
    if (path.toLowerCase() === 'documents') return '1';
    if (path.toLowerCase() === 'pictures') return '2';
    if (path.toLowerCase() === 'music') return '3';
    if (path.toLowerCase() === 'videos') return '4';
    const files = getFilesList();
    const found = files.find(item => item.name.toLowerCase() === path.toLowerCase() && item.type === 'folder');
    return found ? found.id : null;
  };

  const handleCommand = async (cmdStr) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    let command = parts[0].toLowerCase();
    if (command.startsWith('/')) {
      command = command.slice(1);
    }
    const args = parts.slice(1);

    const promptPrefix = `ghuroob@sunset:/${cwd}$ `;
    const newHistory = [...history, { text: `${promptPrefix}${trimmed}`, type: "input" }];
    
    // Save to cmd history list
    setCmdHistoryList(prev => [...prev, trimmed]);

    switch (command) {
      case 'help':
        newHistory.push(
          { text: "Available Commands:", type: "info" },
          { text: "  help        - Display list of shell tools.", type: "text" },
          { text: "  ls          - List files & folders in current directory.", type: "text" },
          { text: "  cd [dir]    - Change current working directory.", type: "text" },
          { text: "  mkdir [dir] - Create a new directory in current location.", type: "text" },
          { text: "  pwd         - Print current working directory.", type: "text" },
          { text: "  cat [file]  - Display contents of a text file.", type: "text" },
          { text: "  touch [file]- Create an empty file.", type: "text" },
          { text: "  write [f] [m]- Overwrite or write content to a file.", type: "text" },
          { text: "  create [file] [msg] - Create a text file with message.", type: "text" },
          { text: "  rm [file]   - Remove/Delete a file.", type: "text" },
          { text: "  ifconfig    - Render mock active/loopback network interfaces.", type: "text" },
          { text: "  ping [ip]   - Send simulated ICMP echo request ping packets.", type: "text" },
          { text: "  fetch [url] - Serene resource retrieve (auto-launches Zen Browser).", type: "text" },
          { text: "  chime       - Replay hardware-level PIT startup melody.", type: "text" },
          { text: "  play [f] [t]- Play a customized square tone frequency in Hz.", type: "text" },
          { text: "  about       - Discover the Sunset OS naming story.", type: "text" },
          { text: "  history     - View terminal session command history log.", type: "text" },
          { text: "  neofetch    - Display operating system parameters.", type: "text" },
          { text: "  theme [name]- Change color theme (sunset, greenery, dusk).", type: "text" },
          { text: "  voice       - Trigger the AI Voice Assistant window.", type: "text" },
          { text: "  matrix      - Activate green-rain console diagnostic overlay.", type: "text" },
          { text: "  garden      - Spawn Zen Garden sandbox view.", type: "text" },
          { text: "  note [msg]  - Append a formatted note into Calm Notes.", type: "text" },
          { text: "  lofi [1-3]  - Play distinct relaxing multi-note arpeggios.", type: "text" },
          { text: "  time        - Display current system date and time.", type: "text" },
          { text: "  clear       - Clear screen logs.", type: "text" }
        );
        playCmdChime(true);
        break;

      case 'chime':
        if (typeof window !== 'undefined') {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const playToneAt = (freq, start, duration) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = freq;
              osc.type = 'triangle';
              gain.gain.setValueAtTime(0.001, start);
              gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
              osc.start(start);
              osc.stop(start + duration);
            };
            const now = ctx.currentTime;
            // Phrase 1: Nature breeze arpeggio
            playToneAt(659, now, 0.15);         // E5
            playToneAt(784, now + 0.15, 0.15);  // G5
            playToneAt(880, now + 0.30, 0.15);  // A5
            playToneAt(988, now + 0.45, 0.15);  // B5
            playToneAt(1175, now + 0.60, 0.30); // D6
            
            // Phrase 2: Serene sunset resolution (after 0.1s breath pause)
            playToneAt(880, now + 1.00, 0.18);  // A5
            playToneAt(988, now + 1.18, 0.18);  // B5
            playToneAt(1175, now + 1.36, 0.18); // D6
            playToneAt(1318, now + 1.54, 0.45); // E6
          }
        }
        newHistory.push({ text: "Replaying serene welcome chime...", type: "success" });
        break;

      case 'play':
        if (args.length < 2) {
          newHistory.push({ text: "Usage: play [freq_hz] [duration_ms]\nExample: play 440 200", type: "error" });
          playCmdChime(false);
        } else {
          const freq = parseInt(args[0]);
          const ms = parseInt(args[1]);
          if (freq > 0 && ms > 0 && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'triangle';
              osc.frequency.value = freq;
              gain.gain.setValueAtTime(0.001, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (ms / 1000));
              osc.start();
              osc.stop(ctx.currentTime + (ms / 1000));
            }
            newHistory.push({ text: `Tone played: ${freq} Hz for ${ms} ms.`, type: "success" });
          } else {
            newHistory.push({ text: "Error: Frequency and duration must be positive integers.", type: "error" });
            playCmdChime(false);
          }
        }
        break;

      case 'about':
        newHistory.push(
          { text: "SUNSET OS Naming Philosophy:", type: "info" },
          { text: "Inspired by the developer's daily walks in the park between Asr and Maghrib.", type: "text" },
          { text: "Watching natural sunsets brings peace, motivation, and a serene frame of mind.", type: "text" },
          { text: "Sunset OS is built as a digital sanctuary representing this calm interval.", type: "logo" }
        );
        playCmdChime(true);
        break;

      case 'history':
        newHistory.push({ text: "Recent Command Logs (Last 5):", type: "info" });
        cmdHistoryList.slice(-5).forEach(h => {
          newHistory.push({ text: `  - ${h}`, type: "text" });
        });
        playCmdChime(true);
        break;

      case 'ls': {
        const files = getFilesList();
        const parentId = getParentIdForCwd(cwd);
        const children = files.filter(item => item.parent === parentId);
        if (children.length === 0) {
          newHistory.push({ text: "Empty directory.", type: "text" });
          playCmdChime(false);
        } else {
          newHistory.push({ text: `Contents of /${cwd}:`, type: "info" });
          children.forEach(f => {
            const indicator = f.type === 'folder' ? '[DIR]  ' : '       ';
            newHistory.push({ text: `  ${indicator} ${f.name}`, type: f.type === 'folder' ? "folder" : "file" });
          });
          playCmdChime(true);
        }
        break;
      }

      case 'cd': {
        if (args.length === 0 || args[0] === '/') {
          setCwd('');
          playCmdChime(true);
        } else if (args[0] === '..') {
          setCwd('');
          playCmdChime(true);
        } else {
          const vfs = getFilesList();
          const targetDir = args[0];
          const parentId = getParentIdForCwd(cwd);
          const target = vfs.find(item => item.name.toLowerCase() === targetDir.toLowerCase() && item.type === 'folder' && item.parent === parentId);
          if (target) {
            setCwd(target.name);
            playCmdChime(true);
          } else {
            newHistory.push({ text: `Error: Directory '${targetDir}' not found in /${cwd}.`, type: "error" });
            playCmdChime(false);
          }
        }
        break;
      }

      case 'mkdir': {
        if (args.length === 0) {
          newHistory.push({ text: "Usage: mkdir [directory_name]", type: "error" });
          playCmdChime(false);
        } else {
          const vfs = getFilesList();
          const dirName = args[0];
          const parentId = getParentIdForCwd(cwd);
          const exists = vfs.find(item => item.name.toLowerCase() === dirName.toLowerCase() && item.type === 'folder' && item.parent === parentId);
          if (exists) {
            newHistory.push({ text: `Error: Directory '${dirName}' already exists.`, type: "error" });
            playCmdChime(false);
          } else {
            const newFolder = {
              id: Date.now().toString(),
              name: dirName,
              type: 'folder',
              parent: parentId,
              content: ''
            };
            const updated = [...vfs, newFolder];
            localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
            window.dispatchEvent(new Event('sunset_vfs_changed'));
            newHistory.push({ text: `[OK] Directory created: ${dirName}`, type: "success" });
            playCmdChime(true);
          }
        }
        break;
      }

      case 'pwd': {
        newHistory.push({ text: `/${cwd}`, type: "text" });
        playCmdChime(true);
        break;
      }
      case 'time': {
        const now = new Date();
        const yr = now.getFullYear();
        const mo = String(now.getMonth() + 1).padStart(2, '0');
        const dy = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        newHistory.push({ text: `Date: ${yr}-${mo}-${dy} | Time: ${h}:${m}:${s} UTC/Local`, type: "text" });
        playCmdChime(true);
        break;
      }

      case 'cat': {
        if (args.length === 0) {
          newHistory.push({ text: "Error: Please specify file name. Usage: cat welcome.txt", type: "error" });
          playCmdChime(false);
        } else {
          const vfs = getFilesList();
          const targetName = args[0];
          const parentId = getParentIdForCwd(cwd);
          const target = vfs.find(item => item.name.toLowerCase() === targetName.toLowerCase() && item.type === 'file' && item.parent === parentId);
          if (target) {
            newHistory.push({ text: `=== Content of ${target.name} ===`, type: "info" });
            const lines = target.content.split('\n');
            lines.forEach(line => {
              newHistory.push({ text: line, type: "text" });
            });
            playCmdChime(true);
          } else {
            newHistory.push({ text: `Error: File '${targetName}' not found in /${cwd}.`, type: "error" });
            playCmdChime(false);
          }
        }
        break;
      }

      case 'touch': {
        if (args.length === 0) {
          newHistory.push({ text: "Error: Please specify filename. Usage: touch notes.txt", type: "error" });
          playCmdChime(false);
        } else {
          const vfs = getFilesList();
          const fileName = args[0];
          const parentId = getParentIdForCwd(cwd);
          const newFile = {
            id: Date.now().toString(),
            name: fileName,
            type: 'file',
            parent: parentId,
            content: ''
          };
          const updated = [...vfs, newFile];
          localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
          window.dispatchEvent(new Event('sunset_vfs_changed'));
          newHistory.push({ text: `[OK] File created: ${fileName}`, type: "success" });
          playCmdChime(true);
        }
        break;
      }

      case 'write': {
        if (args.length < 2) {
          newHistory.push({ text: "Error: Please specify filename and content. Usage: write notes.txt 'Breathe in.'", type: "error" });
          playCmdChime(false);
        } else {
          const vfs = getFilesList();
          const fileName = args[0];
          const content = args.slice(1).join(' ').replace(/['"]/g, ''); // strip quotes
          const parentId = getParentIdForCwd(cwd);
          const existing = vfs.find(item => item.name.toLowerCase() === fileName.toLowerCase() && item.type === 'file' && item.parent === parentId);
          let updated;
          if (existing) {
            updated = vfs.map(item => item.id === existing.id ? { ...item, content } : item);
          } else {
            const newFile = {
              id: Date.now().toString(),
              name: fileName,
              type: 'file',
              parent: parentId,
              content
            };
            updated = [...vfs, newFile];
          }
          localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
          window.dispatchEvent(new Event('sunset_vfs_changed'));
          newHistory.push({ text: `[OK] Wrote to ${fileName}`, type: "success" });
          playCmdChime(true);
        }
        break;
      }

      case 'create': {
        if (args.length < 2) {
          newHistory.push({ text: "Error: Please specify filename and content. Usage: create sunset.txt 'Hello World'", type: "error" });
          playCmdChime(false);
        } else {
          const vfs = getFilesList();
          const fileName = args[0].endsWith('.txt') ? args[0] : `${args[0]}.txt`;
          const content = args.slice(1).join(' ').replace(/['"]/g, ''); // strip quotes
          const parentId = getParentIdForCwd(cwd);
          
          const newFile = {
            id: Date.now().toString(),
            name: fileName,
            type: 'file',
            parent: parentId,
            content: content
          };
          
          const updated = [...vfs, newFile];
          localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
          window.dispatchEvent(new Event('sunset_vfs_changed'));
          newHistory.push({ text: `[+] Success: File '${fileName}' created in /${cwd}.`, type: "success" });
          playCmdChime(true);
        }
        break;
      }

      case 'rm': {
        if (args.length === 0) {
          newHistory.push({ text: "Error: Specify file to delete. Usage: rm design_rules.txt", type: "error" });
          playCmdChime(false);
        } else {
          const vfs = getFilesList();
          const targetName = args[0];
          const parentId = getParentIdForCwd(cwd);
          const match = vfs.find(item => item.name.toLowerCase() === targetName.toLowerCase() && item.parent === parentId);
          if (match) {
            const updated = vfs.filter(item => item.id !== match.id);
            localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
            window.dispatchEvent(new Event('sunset_vfs_changed'));
            newHistory.push({ text: `[-] Deleted file '${match.name}' successfully.`, type: "success" });
            playCmdChime(true);
          } else {
            newHistory.push({ text: `Error: File '${targetName}' not found in /${cwd}.`, type: "error" });
            playCmdChime(false);
          }
        }
        break;
      }

      case 'neofetch':
        newHistory.push(
          { text: "   🌅🌅🌅🌅      Sunset OS (Ghuroob OS)", type: "logo" },
          { text: " 🌅        🌅    ----------------------", type: "logo" },
          { text: "🌅  🌄  🌅  🌅   Host: Arshad Pasha Custom PC", type: "logo" },
          { text: "🌅    🌅    🌅   OS Name: Sunset OS v0.5 (Stage 5)", type: "logo" },
          { text: " 🌅        🌅    Kernel Core: LAZ Kernel v0.5 (Sound enabled)", type: "logo" },
          { text: "   🌅🌅🌅🌅      Shell: SunsetSH (Terminal Console)", type: "logo" },
          { text: "                 RAM Usage: 14 MB / 8192 MB (0.1%)", type: "logo" },
          { text: "                 Design Ethos: Calm, Lightweight, Intelligent", type: "logo" }
        );
        playCmdChime(true);
        break;

      case 'theme':
        if (args.length === 0) {
          newHistory.push({ text: "Error: Specify theme name. Available: sunset, greenery, dusk. Usage: theme dusk", type: "error" });
          playCmdChime(false);
        } else {
          const selectedTheme = args[0].toLowerCase();
          if (['sunset', 'greenery', 'dusk'].includes(selectedTheme)) {
            changeDesktopTheme(selectedTheme);
            newHistory.push({ text: `[+] Theme changed to: ${selectedTheme.toUpperCase()}`, type: "success" });
            playCmdChime(true);
          } else {
            newHistory.push({ text: `Error: Theme '${selectedTheme}' not recognized. Use 'sunset', 'greenery', or 'dusk'.`, type: "error" });
            playCmdChime(false);
          }
        }
        break;

      case 'voice':
        openVoiceAssistant();
        newHistory.push({ text: "[+] Initializing Ghuroob Voice AI Assistant engine...", type: "success" });
        playCmdChime(true);
        break;

      case 'matrix':
        setIsMatrixActive(true);
        newHistory.push({ text: "[!] Booting system diagnostics in matrix mode. Click shell screen to close.", type: "success" });
        playCmdChime(true);
        break;

      case 'ifconfig':
        newHistory.push(
          { text: "\nlo0: flags=UP,LOOPBACK mtu 65536", type: "success" },
          { text: "     inet 127.0.0.1 netmask 255.0.0.0", type: "text" },
          { text: "     status: ACTIVE, speed: 10 Gbps", type: "text" },
          { text: "     RX packets: 42, TX packets: 42", type: "text" },
          { text: "     RX bytes: 3360, TX bytes: 3360\n", type: "text" },
          { text: "eth0: flags=UP,BROADCAST,RUNNING mtu 1500", type: "success" },
          { text: "     inet 192.168.1.53 netmask 255.255.255.0 gateway 192.168.1.1", type: "text" },
          { text: "     status: ACTIVE, speed: 100 Mbps", type: "text" },
          { text: "     RX packets: 1205, TX packets: 874", type: "text" },
          { text: "     RX bytes: 142012, TX bytes: 93240", type: "text" }
        );
        playCmdChime(true);
        break;

      case 'ping':
        if (args.length === 0) {
          newHistory.push({ text: "Usage: ping [ip]\nExample: ping 8.8.8.8", type: "error" });
          playCmdChime(false);
          setHistory(newHistory);
        } else {
          const ip = args[0];
          newHistory.push({ text: `PING ${ip} (${ip}) 56(84) bytes of data.`, type: "info" });
          setHistory([...newHistory]);

          let packetsReceived = 0;
          let latencies = [];
          
          for (let seq = 1; seq <= 4; seq++) {
            const start = performance.now();
            try {
              await fetch('https://cloudflare.com/cdn-cgi/trace', { cache: 'no-store', mode: 'no-cors' });
              const end = performance.now();
              const duration = Math.round(end - start);
              packetsReceived++;
              latencies.push(duration);
              
              newHistory.push({ 
                text: `64 bytes from ${ip}: icmp_seq=${seq} ttl=64 time=${duration}ms`, 
                type: "text" 
              });
              setHistory([...newHistory]);
            } catch (err) {
              newHistory.push({ 
                text: `Request timeout for icmp_seq ${seq} (host ${ip} unreachable)`, 
                type: "error" 
              });
              setHistory([...newHistory]);
            }
            await new Promise(r => setTimeout(r, 150));
          }
          
          const packetsTransmitted = 4;
          const loss = ((packetsTransmitted - packetsReceived) / packetsTransmitted) * 100;
          const totalTime = latencies.reduce((a, b) => a + b, 0);
          
          newHistory.push(
            { text: `\n--- ${ip} ping statistics ---`, type: "info" },
            { 
              text: `${packetsTransmitted} packets transmitted, ${packetsReceived} received, ${loss}% packet loss, time ${totalTime}ms`, 
              type: loss === 0 ? "success" : "error" 
            }
          );
          setHistory([...newHistory]);
          playCmdChime(packetsReceived > 0);
        }
        break;

      case 'fetch':
        if (args.length === 0) {
          newHistory.push({ text: "Usage: fetch [url]\nExample: fetch sunset://rest", type: "error" });
          playCmdChime(false);
          setHistory(newHistory);
        } else {
          const urlStr = args[0];
          newHistory.push(
            { text: `Connecting to ${urlStr}... HTTP/1.1 200 OK`, type: "info" }
          );
          setHistory([...newHistory]);
          
          if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
            newHistory.push({ text: `[!] Fetching real-world remote resource via active HTTP link...`, type: "info" });
            setHistory([...newHistory]);
            try {
              const res = await fetch(urlStr);
              const text = await res.text();
              
              newHistory.push({ text: `[HTTP 200 OK] Received ${text.length} bytes. Parsing content:`, type: "success" });
              
              const lines = text.split('\n').slice(0, 10);
              lines.forEach(line => {
                newHistory.push({ text: line.slice(0, 80), type: "text" });
              });
              if (text.split('\n').length > 10) {
                newHistory.push({ text: `... [truncated remaining lines] ...`, type: "info" });
              }
              setHistory([...newHistory]);
              playCmdChime(true);
            } catch (err) {
              newHistory.push({ 
                text: `[Network Error] Failed to retrieve content. Link may be blocked by browser CORS restrictions.`, 
                type: "error" 
              });
              newHistory.push({ text: `Details: ${err.message}`, type: "error" });
              setHistory([...newHistory]);
              playCmdChime(false);
            }
          } else {
            if (urlStr === 'sunset://rest') {
              newHistory.push(
                { text: "   * * *   🌅 SUNSET BREATHING STATION 🌅   * * *", type: "logo" },
                { text: "         Breathe in the golden rays...", type: "text" },
                { text: "                 .-~~~~~~~~~-.", type: "text" },
                { text: "             .-'               '-.", type: "text" },
                { text: "           .'                     '.", type: "text" },
                { text: "          /                         \\", type: "text" },
                { text: "         |                           |", type: "text" },
                { text: "         |         *   *   *         |", type: "text" },
                { text: "         |       *           *       |", type: "text" },
                { text: "         |      *    INHALING   *      |", type: "text" },
                { text: "          \\      *   (8s hold) *    /", type: "text" },
                { text: "           '.     *           *   .'", type: "text" },
                { text: "             '-.     * * *     .-'", type: "text" },
                { text: "                 '-~~~~~~~~~-'", type: "text" },
                { text: "         Breathe out the purple dusk.", type: "text" }
              );
            } else if (urlStr === 'sunset://gardens') {
              newHistory.push(
                { text: "   * * *   🌸 SUNSET ZEN GARDENS 🌸   * * *", type: "logo" },
                { text: "         A grid of calm, beauty, and peace.", type: "text" },
                { text: "  +---------------------------------+", type: "text" },
                { text: "  | . . . . O . . . . . . . . . . . |", type: "text" },
                { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
                { text: "  | . . . . @ . . . . . . . . . . . |", type: "text" },
                { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
                { text: "  | . . . . . . . . . . . . * . . . |", type: "text" },
                { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
                { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
                { text: "  | . . . . . . . . . . . O . . . . |", type: "text" },
                { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
                { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
                { text: "  +---------------------------------+", type: "text" },
                { text: "  Status: A quiet mind rakes the sand.", type: "success" }
              );
            } else if (urlStr === 'sunset://clouds') {
              newHistory.push(
                { text: "   * * *   ☁️ SUNSET CLOUD VISUALIZER ☁️   * * *", type: "logo" },
                { text: "       Gentle atmospheric patterns in the sky.", type: "text" },
                { text: "                  _  _", type: "text" },
                { text: "                ( `   )_", type: "text" },
                { text: "               (    )   `)", type: "text" },
                { text: "             (_   (_(_ . _) _)", type: "text" },
                { text: "                 _  _", type: "text" },
                { text: "               (  `   )", type: "text" },
                { text: "              (  (     )  )", type: "text" },
                { text: "             (__________`_)", type: "text" }
              );
            } else {
              newHistory.push(
                { text: "Resolved mock external host via SunsetDNS.", type: "info" },
                { text: "[Serene Resource List]", type: "info" },
                { text: "1. nature.org - Explore nature preserves", type: "text" },
                { text: "2. calm.com - Serene breathing spaces", type: "text" },
                { text: "3. github.com/sunset-OS - View sources", type: "text" }
              );
            }
            
            if (triggerSystemAction) {
              newHistory.push({ text: `[+] Launching Zen Browser redirected to ${urlStr}...`, type: "success" });
              triggerSystemAction('open_browser', urlStr);
            }
            playCmdChime(true);
          }
          setHistory([...newHistory]);
        }
        break;

      case 'garden':
        newHistory.push(
          { text: "Spawning Zen Garden sandbox layout...", type: "success" },
          { text: "     🌅 SUNSET ZEN GARDEN 🌅", type: "logo" },
          { text: "  [WASD] Move   [R] Rake   [O] Stone", type: "info" },
          { text: "  [S] Sakura    [C] Clear  [X] Status", type: "info" },
          { text: "  +---------------------------------+", type: "text" },
          { text: "  | . . . . O . . . . . . . . . . . |", type: "text" },
          { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
          { text: "  | . . . . @ . . . . . . . . . . . |", type: "text" },
          { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
          { text: "  | . . . . . . . . . . . . * . . . |", type: "text" },
          { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
          { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
          { text: "  | . . . . . . . . . . . O . . . . |", type: "text" },
          { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
          { text: "  | . . . . . . . . . . . . . . . . |", type: "text" },
          { text: "  +---------------------------------+", type: "text" },
          { text: "  Status: A quiet mind rakes the sand.", type: "success" }
        );
        playCmdChime(true);
        break;

      case 'note':
        if (args.length === 0) {
          newHistory.push({ text: "Usage: note [message]\nExample: note take a deep breath", type: "error" });
          playCmdChime(false);
        } else {
          const msg = args.join(' ');
          const vfs = getFilesList();
          let notesFile = vfs.find(item => item.name.toLowerCase() === 'calm_notes.txt');
          if (notesFile) {
            notesFile.content += `\n- ${msg}`;
            const updated = vfs.map(item => item.id === notesFile.id ? notesFile : item);
            localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
          } else {
            const newFile = {
              id: Date.now().toString(),
              name: 'calm_notes.txt',
              type: 'file',
              parent: '1',
              content: `WELCOME TO CALM NOTES\n- ${msg}`
            };
            const updated = [...vfs, newFile];
            localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
          }
          window.dispatchEvent(new Event('sunset_vfs_changed'));
          newHistory.push({ text: "Note appended to Calm Notes.", type: "success" });
          playCmdChime(true);
        }
        break;

      case 'lofi':
        if (args.length === 0) {
          newHistory.push({ text: "Usage: lofi [1-3]\nPresets:\n  1 - Tranquility Arpeggio\n  2 - Serenity Breeze\n  3 - Golden Sunset Chord", type: "info" });
          playCmdChime(false);
        } else {
          const preset = parseInt(args[0]);
          if (preset === 1) {
            newHistory.push({ text: "Playing tranquility arpeggio...", type: "success" });
            if (typeof window !== 'undefined') {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const playToneAt = (freq, start, duration) => {
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.frequency.value = freq;
                  osc.type = 'triangle';
                  gain.gain.setValueAtTime(0.001, start);
                  gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
                  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                  osc.start(start);
                  osc.stop(start + duration);
                };
                const now = ctx.currentTime;
                playToneAt(440, now, 0.15);
                playToneAt(554, now + 0.15, 0.15);
                playToneAt(659, now + 0.30, 0.15);
                playToneAt(880, now + 0.45, 0.25);
              }
            }
          } else if (preset === 2) {
            newHistory.push({ text: "Playing serenity breeze...", type: "success" });
            if (typeof window !== 'undefined') {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const playToneAt = (freq, start, duration) => {
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.frequency.value = freq;
                  osc.type = 'triangle';
                  gain.gain.setValueAtTime(0.001, start);
                  gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
                  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                  osc.start(start);
                  osc.stop(start + duration);
                };
                const now = ctx.currentTime;
                playToneAt(523, now, 0.15);
                playToneAt(659, now + 0.15, 0.15);
                playToneAt(784, now + 0.30, 0.15);
                playToneAt(1046, now + 0.45, 0.25);
              }
            }
          } else if (preset === 3) {
            newHistory.push({ text: "Playing golden sunset chord...", type: "success" });
            if (typeof window !== 'undefined') {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const playToneAt = (freq, start, duration) => {
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.frequency.value = freq;
                  osc.type = 'triangle';
                  gain.gain.setValueAtTime(0.001, start);
                  gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
                  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                  osc.start(start);
                  osc.stop(start + duration);
                };
                const now = ctx.currentTime;
                playToneAt(349, now, 0.15);
                playToneAt(440, now + 0.15, 0.15);
                playToneAt(523, now + 0.30, 0.15);
                playToneAt(698, now + 0.45, 0.25);
              }
            }
          } else {
            newHistory.push({ text: "Error: Preset must be 1, 2, or 3.", type: "error" });
            playCmdChime(false);
          }
        }
        break;

      case 'clear':
        setHistory([]);
        setInput('');
        return;

      default:
        newHistory.push({ text: `command not found: ${command}. Type 'help' to review active console tools.`, type: "error" });
        playCmdChime(false);
    }

    setHistory(newHistory);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 text-emerald-400 font-mono text-xs p-4 selection:bg-emerald-500/20 leading-relaxed relative">
      
      {/* Tab Selection Header Bar */}
      <div className="flex items-center gap-1 bg-black/45 p-1 rounded-lg border border-white/5 mb-3 select-none">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 py-1.5 px-2 text-center rounded-md font-mono text-[10px] tracking-wider uppercase transition-all duration-300 ${
              activeTab === idx
                ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 font-bold border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.25)]'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
            }`}
          >
            Terminal {idx + 1}
          </button>
        ))}
      </div>
      
      {/* Matrix diagnostic overlay */}
      {isMatrixActive ? (
        <div 
          onClick={() => setIsMatrixActive(false)}
          className="absolute inset-0 bg-black text-emerald-500 font-mono flex flex-col justify-center items-center cursor-pointer select-none z-50 p-6 overflow-hidden"
        >
          <div className="animate-pulse mb-4 text-center">
            <h3 className="text-sm font-bold text-white mb-1">LAZ KERNEL HARDWARE DIAGNOSTICS</h3>
            <p className="text-[10px] text-white/50">Click screen to exit Matrix overlay</p>
          </div>
          <div className="w-full max-w-md h-40 opacity-80 overflow-hidden leading-normal border border-emerald-900 rounded-lg p-3 bg-black/80 flex flex-col gap-1">
            <p className="text-emerald-400">CPU Thread 0x01: OK (Clock 3.8GHz)</p>
            <p className="text-emerald-400">RAM Segments GDT[0x08] ... mapped</p>
            <p className="text-emerald-400">VGA video address offset: 0xB8000</p>
            <p className="text-emerald-400">Smart prediction vector: Active</p>
            <p className="text-emerald-500 font-bold animate-[pulse_1.5s_infinite]">BOOT STATUS: LAZ CORE ONLINE AND IDLE</p>
          </div>
        </div>
      ) : null}

      {/* Terminal Output history logs */}
      <div className="flex-1 overflow-y-auto mb-2 pr-1 space-y-1">
        {history.map((line, i) => {
          let colorClass = "text-white/80";
          if (line.type === 'input') colorClass = "text-yellow-400 font-semibold";
          else if (line.type === 'error') colorClass = "text-rose-400";
          else if (line.type === 'success') colorClass = "text-emerald-400";
          else if (line.type === 'info') colorClass = "text-indigo-300";
          else if (line.type === 'logo') colorClass = "text-orange-400 font-bold";
          else if (line.type === 'folder') colorClass = "text-amber-400 font-semibold";

          return (
            <div key={i} className={`whitespace-pre-wrap ${colorClass}`}>
              {line.text}
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal shell input prompt */}
      <div className="flex items-center gap-2 border-t border-white/5 pt-2">
        <span className="text-yellow-400 font-bold">ghuroob@sunset:/{cwd}$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            playTick();
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-emerald-400 font-mono text-xs caret-emerald-400"
          autoFocus
        />
      </div>
    </div>
  );
}
