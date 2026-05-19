import React, { useState, useEffect, useRef } from 'react';

export default function Terminal({ openVoiceAssistant, changeDesktopTheme, openTextEditor }) {
  const [history, setHistory] = useState([
    { text: "Welcome to SunsetSH (Sunset OS Shell) v0.1", type: "system" },
    { text: "Type 'help' to list available system commands.", type: "info" },
    { text: "", type: "info" }
  ]);
  const [input, setInput] = useState('');
  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const terminalEndRef = useRef(null);

  // Auto scroll to bottom of logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

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

    switch (command) {
      case 'help':
        newHistory.push(
          { text: "Available Commands:", type: "info" },
          { text: "  help        - Display list of shell tools.", type: "text" },
          { text: "  ls          - List files & folders in current directory.", type: "text" },
          { text: "  cat [file]  - Display contents of a text file.", type: "text" },
          { text: "  create [file] [msg] - Create a text file with message.", type: "text" },
          { text: "  rm [file]   - Remove/Delete a file.", type: "text" },
          { text: "  neofetch    - Display operating system parameters.", type: "text" },
          { text: "  theme [name]- Change color theme (sunset, greenery, dusk).", type: "text" },
          { text: "  voice       - Trigger the AI Voice Assistant window.", type: "text" },
          { text: "  matrix      - Activate green-rain console diagnostic overlay.", type: "text" },
          { text: "  clear       - Clear screen logs.", type: "text" }
        );
        break;

      case 'ls':
        const files = getFilesList();
        // Since we simulate a single level view for shell simplicity
        const roots = files.filter(item => item.parent === 'root' || item.parent === '1');
        if (roots.length === 0) {
          newHistory.push({ text: "Empty directory.", type: "text" });
        } else {
          newHistory.push({ text: "Contents of /Home:", type: "info" });
          roots.forEach(f => {
            const indicator = f.type === 'folder' ? '[DIR]  ' : '       ';
            const colorClass = f.type === 'folder' ? 'text-amber-400' : 'text-slate-200';
            newHistory.push({ text: `  ${indicator} ${f.name}`, type: f.type === 'folder' ? "folder" : "file" });
          });
        }
        break;

      case 'cat':
        if (args.length === 0) {
          newHistory.push({ text: "Error: Please specify file name. Usage: cat welcome.txt", type: "error" });
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
          } else {
            newHistory.push({ text: `Error: File '${targetName}' not found. Ensure file exists and contains .txt extension.`, type: "error" });
          }
        }
        break;

      case 'create':
        if (args.length < 2) {
          newHistory.push({ text: "Error: Please specify filename and content. Usage: create sunset.txt 'Hello World'", type: "error" });
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
        }
        break;

      case 'rm':
        if (args.length === 0) {
          newHistory.push({ text: "Error: Specify file to delete. Usage: rm design_rules.txt", type: "error" });
        } else {
          const vfs = getFilesList();
          const targetName = args[0];
          const match = vfs.find(item => item.name.toLowerCase() === targetName.toLowerCase());
          if (match) {
            const updated = vfs.filter(item => item.id !== match.id);
            localStorage.setItem('sunset_os_vfs', JSON.stringify(updated));
            window.dispatchEvent(new Event('sunset_vfs_changed'));
            newHistory.push({ text: `[-] Deleted file '${match.name}' successfully.`, type: "success" });
          } else {
            newHistory.push({ text: `Error: File '${targetName}' not found.`, type: "error" });
          }
        }
        break;

      case 'neofetch':
        newHistory.push(
          { text: "   🌅🌅🌅🌅      Sunset OS (Ghuroob OS)", type: "logo" },
          { text: " 🌅        🌅    ----------------------", type: "logo" },
          { text: "🌅  🌄  🌅  🌅   Host: Arshad Pasha Custom PC", type: "logo" },
          { text: "🌅    🌅    🌅   OS Name: Sunset OS v0.1 (Stage 1)", type: "logo" },
          { text: " 🌅        🌅    Kernel Core: LAZ Kernel v0.1 (Ring 0)", type: "logo" },
          { text: "   🌅🌅🌅🌅      Shell: SunsetSH (Terminal Console)", type: "logo" },
          { text: "                 RAM Usage: 14 MB / 8192 MB (0.1%)", type: "logo" },
          { text: "                 Design Ethos: Calm, Lightweight, Intelligent", type: "logo" }
        );
        break;

      case 'theme':
        if (args.length === 0) {
          newHistory.push({ text: "Error: Specify theme name. Available: sunset, greenery, dusk. Usage: theme dusk", type: "error" });
        } else {
          const selectedTheme = args[0].toLowerCase();
          if (['sunset', 'greenery', 'dusk'].includes(selectedTheme)) {
            changeDesktopTheme(selectedTheme);
            newHistory.push({ text: `[+] Theme changed to: ${selectedTheme.toUpperCase()}`, type: "success" });
          } else {
            newHistory.push({ text: `Error: Theme '${selectedTheme}' not recognized. Use 'sunset', 'greenery', or 'dusk'.`, type: "error" });
          }
        }
        break;

      case 'voice':
        openVoiceAssistant();
        newHistory.push({ text: "[+] Initializing Ghuroob Voice AI Assistant engine...", type: "success" });
        break;

      case 'matrix':
        setIsMatrixActive(true);
        newHistory.push({ text: "[!] Booting system diagnostics in matrix mode. Click shell screen to close.", type: "success" });
        break;

      case 'clear':
        setHistory([]);
        setInput('');
        return;

      default:
        newHistory.push({ text: `command not found: ${command}. Type 'help' to review active console tools.`, type: "error" });
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
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-emerald-400 font-mono text-xs caret-emerald-400"
          autoFocus
        />
      </div>
    </div>
  );
}
