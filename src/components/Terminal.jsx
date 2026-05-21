import React, { useState, useEffect, useRef } from 'react';

export default function Terminal({ openVoiceAssistant, changeDesktopTheme, openTextEditor, triggerSystemAction }) {
  const [history, setHistory] = useState([
    { text: "Welcome to SunsetSH (Sunset OS Shell) v0.1", type: "system" },
    { text: "Type 'help' to list available system commands.", type: "info" },
    { text: "", type: "info" }
  ]);
  const [input, setInput] = useState('');
  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [cmdHistoryList, setCmdHistoryList] = useState([]);
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

  const handleCommand = (cmdStr) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newHistory = [...history, { text: `sunset-OS:~$ ${trimmed}`, type: "input" }];
    
    // Save to cmd history list
    setCmdHistoryList(prev => [...prev, trimmed]);

    switch (command) {
      case 'help':
        newHistory.push(
          { text: "Available Commands:", type: "info" },
          { text: "  help        - Display list of shell tools.", type: "text" },
          { text: "  ls          - List files & folders in current directory.", type: "text" },
          { text: "  cat [file]  - Display contents of a text file.", type: "text" },
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
            playToneAt(523, now, 0.15);
            playToneAt(659, now + 0.15, 0.15);
            playToneAt(784, now + 0.30, 0.35);
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

      case 'ls':
        const files = getFilesList();
        // Since we simulate a single level view for shell simplicity
        const roots = files.filter(item => item.parent === 'root' || item.parent === '1');
        if (roots.length === 0) {
          newHistory.push({ text: "Empty directory.", type: "text" });
          playCmdChime(false);
        } else {
          newHistory.push({ text: "Contents of /Home:", type: "info" });
          roots.forEach(f => {
            const indicator = f.type === 'folder' ? '[DIR]  ' : '       ';
            const colorClass = f.type === 'folder' ? 'text-amber-400' : 'text-slate-200';
            newHistory.push({ text: `  ${indicator} ${f.name}`, type: f.type === 'folder' ? "folder" : "file" });
          });
          playCmdChime(true);
        }
        break;

      case 'cat':
        if (args.length === 0) {
          newHistory.push({ text: "Error: Please specify file name. Usage: cat welcome.txt", type: "error" });
          playCmdChime(false);
        } else {
          const vfs = getFilesList();
          const targetName = args[0];
          const target = vfs.find(item => item.name.toLowerCase() === targetName.toLowerCase() && item.type === 'file');
          if (target) {
            newHistory.push({ text: `=== Content of ${target.name} ===`, type: "info" });
            const lines = target.content.split('\n');
            lines.forEach(line => {
              newHistory.push({ text: line, type: "text" });
            });
            playCmdChime(true);
          } else {
            newHistory.push({ text: `Error: File '${targetName}' not found. Ensure file exists and contains .txt extension.`, type: "error" });
            playCmdChime(false);
          }
        }
        break;

      case 'create':
        if (args.length < 2) {
          newHistory.push({ text: "Error: Please specify filename and content. Usage: create sunset.txt 'Hello World'", type: "error" });
          playCmdChime(false);
        } else {
          const vfs = getFilesList();
          const fileName = args[0].endsWith('.txt') ? args[0] : `${args[0]}.txt`;
          const content = args.slice(1).join(' ').replace(/['"]/g, ''); // strip quotes
          
          const newFile = {
            id: Date.now().toString(),
            name: fileName,
            type: 'file',
            parent: '1', // Documents default
            content: content
          };
          
          const updated = [...vfs, newFile];
          localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
          window.dispatchEvent(new Event('sunset_vfs_changed'));
          newHistory.push({ text: `[+] Success: File '${fileName}' created in Documents folder.`, type: "success" });
          playCmdChime(true);
        }
        break;

      case 'rm':
        if (args.length === 0) {
          newHistory.push({ text: "Error: Specify file to delete. Usage: rm design_rules.txt", type: "error" });
          playCmdChime(false);
        } else {
          const vfs = getFilesList();
          const targetName = args[0];
          const match = vfs.find(item => item.name.toLowerCase() === targetName.toLowerCase());
          if (match) {
            const updated = vfs.filter(item => item.id !== match.id);
            localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
            window.dispatchEvent(new Event('sunset_vfs_changed'));
            newHistory.push({ text: `[-] Deleted file '${match.name}' successfully.`, type: "success" });
            playCmdChime(true);
          } else {
            newHistory.push({ text: `Error: File '${targetName}' not found.`, type: "error" });
            playCmdChime(false);
          }
        }
        break;

      case 'neofetch':
        newHistory.push(
          { text: "   🌅🌅🌅🌅      Sunset OS (Ghuroob OS)", type: "logo" },
          { text: " 🌅        🌅    ----------------------", type: "logo" },
          { text: "🌅  🌄  🌅  🌅   Host: Arshad Pasha Custom PC", type: "logo" },
          { text: "🌅    🌅    🌅   OS Name: Sunset OS v0.4 (Stage 4)", type: "logo" },
          { text: " 🌅        🌅    Kernel Core: LAZ Kernel v0.4 (Sound enabled)", type: "logo" },
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
        } else {
          const ip = args[0];
          newHistory.push(
            { text: `PING ${ip} (${ip}) 56(84) bytes of data.`, type: "info" },
            { text: `64 bytes from ${ip}: icmp_seq=1 ttl=64 time=14ms`, type: "text" },
            { text: `64 bytes from ${ip}: icmp_seq=2 ttl=64 time=18ms`, type: "text" },
            { text: `64 bytes from ${ip}: icmp_seq=3 ttl=64 time=11ms`, type: "text" },
            { text: `64 bytes from ${ip}: icmp_seq=4 ttl=64 time=15ms`, type: "text" },
            { text: `\n--- ${ip} ping statistics ---`, type: "info" },
            { text: `4 packets transmitted, 4 received, 0% packet loss, time 54ms`, type: "success" }
          );
          playCmdChime(true);
        }
        break;

      case 'fetch':
        if (args.length === 0) {
          newHistory.push({ text: "Usage: fetch [url]\nExample: fetch sunset://rest", type: "error" });
          playCmdChime(false);
        } else {
          const urlStr = args[0];
          newHistory.push(
            { text: `Connecting to ${urlStr}... HTTP/1.1 200 OK`, type: "info" }
          );
          
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
              { text: "        +-----+-----+-----+-----+-----+", type: "text" },
              { text: "        | .   | Sakura | .   |  .  | Lavender |", type: "text" },
              { text: "        +-----+-----+-----+-----+-----+", type: "text" },
              { text: "        | .   |  .  | Lily| .   |  .  |", type: "text" },
              { text: "        +-----+-----+-----+-----+-----+", type: "text" },
              { text: "        | Sakura | .  |  .  |  .  | Lily|", type: "text" },
              { text: "        +-----+-----+-----+-----+-----+", type: "text" },
              { text: "        | .   | Lavender | . | Sakura | . |", type: "text" },
              { text: "        +-----+-----+-----+-----+-----+", type: "text" }
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
        <span className="text-yellow-400 font-bold">sunset-OS:~$</span>
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
