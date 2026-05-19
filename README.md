# 🌅 Sunset OS (Ghuroob OS)

> "A calm, nature-inspired, lightweight operating system designed for human focus, simplicity, and a voice-controlled future."

Sunset OS (or Ghuroob OS) is a custom operating system built from the ground up to strip away the noise of modern computing and deliver a peaceful, distraction-free environment. Named after the serenity and motivational cycle of nature’s sunsets, this OS merges low-level systems engineering with predictive, voice-first intelligence.

---

## 🧭 Rules of Sunset OS (Core Identity)

Every design decision, system driver, and application written for Sunset OS must follow these unbreakable rules:

1. **Lightweight First**: The system must run flawlessly on modern and vintage hardware.
2. **Minimal RAM Usage**: No unnecessary background bloat, analytics, or hidden services.
3. **Calm Experience**: Soft gradients, nature-inspired UI elements, and soothing audio environments.
4. **Human-Friendly**: Designed for productivity, focus, and emotional connection.
5. **Voice-First Future**: Built with hands-free, natural language voice controls as a first-class citizen.
6. **Fast Booting**: Cold boot directly to the desktop in seconds.
7. **Predictive & Intelligent**: Task loading should be smart, context-aware, and highly resource-efficient.

---

## ⚡ The Laz Engine Philosophy

The heart of the Sunset OS kernel is the **Laz Engine**. The engine is built around a unique architecture that challenges heavy modern kernels:

* **Smart Task Loading**: Applications are loaded predictive-style, pre-fetching blocks based on user habits to avoid standard disk I/O bottlenecks.
* **Minimal CPU Footprint**: Keeps thread scheduling tight, placing the CPU in low-power idle states unless performing active work.
* **Context-Aware Resource Allocation**: Dynamically shifts resources to active focus windows while instantly freezing inactive ones.
* **Predictive Task Management**: Seamlessly prepares files and tools just before you need them, offering an AI-orchestrated environment at the kernel level.

---

## 🗓️ Version Planning & Roadmap

To maintain focus and organization, Sunset OS development is divided into structured, iterative releases:

### 📦 Sunset OS v0.1 — Stage 1: Foundation (Current)
* **AP Bootloader**: Custom 16-bit boot sector loading raw code.
* **Laz Kernel**: VGA Text Mode screen driver, color rendering, and screen messages.
* **First boot**: Boots in emulator displaying: `"Welcome to Sunset OS"`.

### 📦 Sunset OS v0.2 — Stage 2: Driver & File Essentials
* **Keyboard Driver**: Custom interrupt handlers for typing input.
* **Memory Management**: Basic paging and physical RAM allocation maps.
* **File System**: Custom simple file system (SunsetFS) or FAT32 support for file creation, renaming, and folder management.

### 📦 Sunset OS v0.3 — Stage 3: Display & UI System
* **VESA Graphics Mode**: High-definition graphical screen buffers.
* **Mouse Driver**: Cursor movement and pointer actions.
* **UI Window Manager**: Simple overlapping windows, buttons, and desktop shortcuts.

### 📦 Sunset OS v0.4 — Stage 4: Voice & Intelligence
* **Ghuroob Voice Assistant**: Speech-to-Text and Text-to-Speech system integration.
* **Context Engine**: Personalized voice commands like *"Open my notes"* or *"Play lo-fi"* to orchestrate OS windows.

### 📦 Sunset OS v0.5 — Stage 5: Networking & Cloud
* **Ethernet & Wi-Fi Drivers**: Basic socket operations.
* **Lightweight Browser**: Minimalist web rendering engine for clean browsing.

---

## 📂 Directory Layout

```text
/sunset-OS
├── bootloader/       # AP Bootloader assembly source code
├── kernel/           # Laz Engine C kernel source code
├── research/         # Engineering notes, CPU architectures, and design logs
├── devlogs/          # Daily developer logs and learning logs
├── tools/            # Compiling scripts, configurations, and build recipes
├── docs/             # Manual installation guides and user manuals
├── assets/           # Wallpaper, icons, and audio assets
└── src/              # Web Emulator & Dashboard code (Vite + React)
```

---

## 🚀 Getting Started

1. **Manual Toolchain Setup**:
   To set up your PC to compile the real bootloader and kernel, check out the step-by-step guide:  
   👉 [docs/installation.md](file:///d:/sunset-OS/docs/installation.md)

2. **Run the Interactive Simulator**:
   To explore the gorgeous sunset design, virtual file system, terminal shell, and the voice-activated assistant immediately in your web browser:
   ```bash
   npm install
   npm run dev
   ```

---

## 📝 Research & Development logs
Keep track of our learning process and technical studies inside the research folder:
- [research/boot_process.md](file:///d:/sunset-OS/research/boot_process.md) — How the CPU wakes up and loads code.
- [devlogs/devlog_v0.1.md](file:///d:/sunset-OS/devlogs/devlog_v0.1.md) — Daily coding logs and progress tracking.
