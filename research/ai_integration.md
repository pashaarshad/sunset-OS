# Sunset OS Research — AI & Voice Integration Notes

One of Sunset OS's defining features is its **Ghuroob Voice Assistant** and **AI Memory System**. These notes outline how standard desktop operations map to natural language, how speech recognition works locally or web-based, and how we build context-aware scheduling.

---

## 🎙️ 1. Audio Processing & Speech Architecture

The AI Voice Assistant operates on a three-stage pipeline to convert sounds into actual operating system events:

```text
  [ User Speaks ] ──> [ Audio Capture ] ──> [ Speech-to-Text ] ──> [ Command Parser ] ──> [ OS Action ]
                                                                             │
                                                                             ▼
                                                                     [ Text-to-Speech ] ──> [ Audio Feedback ]
```

### Stage A: Speech-to-Text (STT)
* **Web Simulator Implementation**: Uses the standard W3C Web Speech API (`webkitSpeechRecognition`). It operates directly inside the browser, utilizing system-level speech models to perform extremely fast, low-latency translation of words to text.
* **Low-Level Native OS Target (Future)**: Porting local speech recognition using a compiled C++ implementation of **Whisper.cpp** running against a compact, quantized language model (e.g., Whisper-Tiny) to operate fully offline.

### Stage B: NLP Command Mapping
Once speech is converted to text, it passes through a parser. For v0.4, a rule-based matching system processes the instructions, mapping triggers to OS calls:
- `"open file manager"` / `"show downloads"` $\rightarrow$ Triggers UI launch callback `openApp('filemanager')`
- `"play lofi music"` / `"relax me"` $\rightarrow$ Invokes audio system event `audioPlayer.play()`
- `"create file named [X]"` $\rightarrow$ Parses variable string and calls Virtual File System `vfs.createFile('X.txt', '')`
- `"tell me a sunset quote"` $\rightarrow$ Selects a random motivational string and triggers Speech Synthesis.

### Stage C: Text-to-Speech (TTS)
* Uses the browser’s **SpeechSynthesisUtterance** class.
* We configure a custom warm, low-frequency, calm-speaking voice profile (lowering the `pitch` slightly and setting `rate` to `0.9` for a slow, calming voice).

---

## 🧠 2. Context-Aware Predictive Memory
The "smart loading" aspect of the Laz Engine tracks user behaviors over time.
- **Activity Logs**: Keeps a secure local queue of the last 20 actions (files edited, times opened, music tracks played).
- **Time-of-day Weighting**: Sunset OS tracks when specific files are opened. If you edit `notes.txt` every evening at sunset, the Laz Engine pre-fetches the file sectors into system RAM cache cache as twilight approaches, reducing disk load latency to 0ms when you open it.
- **Ambient Adaptation**: The system tracks noise levels or ambient lighting. If dark, it transitions the desktop seamlessly into dark, relaxing red-dusk gradients.
