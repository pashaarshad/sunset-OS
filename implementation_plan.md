# Sunset OS — Implementation Plan

We will build the foundation for **Sunset OS** (Ghuroob OS). Because compiling low-level operating system code requires a specialized toolchain (NASM, GCC, QEMU), we will deliver a **dual-track codebase**:

1. **The Real Low-Level OS Foundation**: Complete, compile-ready assembly and C source files for the **AP Bootloader** and **LAZ Kernel** structured exactly as outlined in the roadmap, accompanied by an automated environment setup and build suite for Windows.
2. **The Interactive Web Simulator & OS Dashboard**: A gorgeous, ultra-premium web application styled with vibrant sunset gradients, glassmorphism, and smooth animations that simulates the booted Sunset OS environment directly in the browser. It will feature a fully functional file system, media player, text editor, terminal, and a **Web-Speech AI Voice Assistant** (Ghuroob Voice) that responds to voice commands!

---

## User Review Required

Please review the proposed architecture and design choices:
> [!IMPORTANT]
> - **Toolchain Setup**: The real OS code requires NASM and QEMU. We provide an automated PowerShell script `tools/setup_env.ps1` that uses Windows Package Manager (`winget`) to install these dependencies safely.
> - **Web-Based Simulator**: Since a real custom kernel runs in an emulator without advanced UI/AI capabilities initially, the Web Simulator will serve as the rich, interactive "future vision" showcasing the voice-controlled UI, media suite, and calm, nature-inspired design. We will build this using a high-performance **Vite + React** web app initialized in the workspace root.

---

## Proposed Changes

We will construct a complete, professional repository structure.

### Component 1: Real OS Source Code (`/bootloader`, `/kernel`, `/tools`)

We will create the raw x86 assembly and C kernel source code files.

#### [NEW] [bootloader.asm](file:///d:/sunset-OS/bootloader/bootloader.asm)
* A 16-bit real mode bootloader using NASM assembly.
* Initializes the stack, segment registers, and clears the screen.
* Prints `"AP Bootloader: Loading Sunset OS..."` and a custom welcome ASCII art.
* Reads the kernel from the second sector of the disk into memory using BIOS interrupts (`int 0x13`).
* Jumps to the kernel entry point.

#### [NEW] [kernel.c](file:///d:/sunset-OS/kernel/kernel.c)
* The entry point of the **LAZ Kernel** written in C.
* Implements a basic VGA screen driver to write characters to memory address `0xB8000` (text mode).
* Displays a gorgeous, multi-colored startup screen: `"Welcome to Sunset OS (Ghuroob OS) - LAZ Kernel v0.1"`.
* Implements a simple keyboard listener via I/O ports (`0x60`) and displays keypresses on screen.

#### [NEW] [linker.ld](file:///d:/sunset-OS/kernel/linker.ld)
* A custom linker script to compile the kernel in flat binary format, positioning the entry point correctly.

#### [NEW] [setup_env.ps1](file:///d:/sunset-OS/tools/setup_env.ps1)
* A PowerShell script that automates the installation of **NASM**, **GCC (MinGW)**, and **QEMU** via `winget` and adds them to the environment path.

#### [NEW] [build.ps1](file:///d:/sunset-OS/tools/build.ps1)
* A PowerShell script that compiles `bootloader.asm` to a flat binary, compiles `kernel.c` using GCC, links them together into a bootable `sunset_os.img` floppy/disk image, and launches it in **QEMU**.

---

### Component 2: Interactive Sunset OS Simulator (Web App)

We will bootstrap a Vite + React web application in the root directory to deliver a visually stunning, calm, and fully interactive interface.

#### [NEW] [package.json](file:///d:/sunset-OS/package.json), [vite.config.js](file:///d:/sunset-OS/vite.config.js)
* Sets up a modern web app environment using Vite, React, and Lucide icons.

#### [NEW] [index.html](file:///d:/sunset-OS/index.html), [src/index.css](file:///d:/sunset-OS/src/index.css)
* Implements the **Sunset UI Design System**:
  - Warm, vibrant gradient backgrounds (deep oranges, soft purples, radiant pinks, nature greens).
  - Premium glassmorphism (frosted-glass panels, backdrop filters, soft drop shadows).
  - Modern typography using the **Outfit** Google Font.
  - Fluid micro-animations for app openings, window dragging, and button hovers.

#### [NEW] [src/App.jsx](file:///d:/sunset-OS/src/App.jsx)
* The main desktop layout, taskbar, boot sequence simulator, and application manager.
* **Boot Sequence**: Simulates the AP Bootloader loading the LAZ Kernel with realistic boot messages before fading into the gorgeous desktop.
* **Ambient Soundscape**: An automatic background music loop playing calming nature/sunset lofi tracks.

#### [NEW] [src/components/FileManager.jsx](file:///d:/sunset-OS/src/components/FileManager.jsx)
* An interactive File Explorer with a virtual file system (stored in `localStorage` for persistence):
  - Folders: `Documents`, `Music`, `Videos`, `Pictures`, `Downloads`.
  - Operations: Create file/folder, Delete, Rename, Drag & Drop files between folders.
  - Responsive file icons based on extensions (`.txt`, `.mp3`, `.mp4`, `.jpg`).

#### [NEW] [src/components/TextEditor.jsx](file:///d:/sunset-OS/src/components/TextEditor.jsx)
* A beautiful, distraction-free markdown text editor that allows creating, editing, and saving text files directly into the virtual file system.

#### [NEW] [src/components/MediaSuite.jsx](file:///d:/sunset-OS/src/components/MediaSuite.jsx)
* Three mini-apps in a unified media bundle:
  - **Image Viewer**: Displays beautiful high-definition sunset wallpapers (generated by AI).
  - **Music Player**: A fully functional audio player playing calming ambient lo-fi tracks, featuring a play/pause toggle, track progress bar, track list, and an interactive audio frequency visualizer (equalizer animation).
  - **Video Player**: Play virtual relaxing cinematic clips of sunsets and nature, with seek and volume controls.

#### [NEW] [src/components/Terminal.jsx](file:///d:/sunset-OS/src/components/Terminal.jsx)
* A terminal shell simulating `SunsetSH` with support for actual interactive commands:
  - `help` - List available commands.
  - `ls`, `cat [file]`, `rm [file]`, `create [file] [content]`, `mkdir [dir]` - Work with the virtual file system!
  - `neofetch` - Display a gorgeous ASCII logo of Sunset OS and system specifications.
  - `theme [sunset|greenery|dusk]` - Dynamically switch the desktop color theme.
  - `voice` - Open the AI Voice Assistant window.

#### [NEW] [src/components/VoiceAssistant.jsx](file:///d:/sunset-OS/src/components/VoiceAssistant.jsx)
* **Ghuroob Voice AI Assistant**:
  - Implements the Web Speech API (`SpeechRecognition` and `SpeechSynthesis`) so the user can speak directly to the assistant.
  - Text-to-Speech support so the assistant answers back in a warm, calming voice.
  - Deep system integrations. Speech commands will trigger actual UI actions:
    - *"Open file manager"* / *"Open files"* -> Launches File Manager.
    - *"Play music"* / *"Stop music"* -> Plays/pauses the ambient audio player.
    - *"Create file named [name]"* -> Creates a file in the virtual filesystem.
    - *"Open editor"* / *"Open terminal"* -> Launches respective apps.
    - *"Tell me a sunset quote"* / *"Motivate me"* -> Speaks and displays a beautiful motivational sunset/nature quote.

#### [NEW] [src/assets/bg.jpg](file:///d:/sunset-OS/src/assets/bg.jpg)
* A beautiful, premium, nature-and-sunset-inspired background wallpaper that we will generate using the `generate_image` tool!

---

## Verification Plan

### Automated / Local Tests
1. **Compilation Check**: Run the PowerShell script to verify GCC and NASM compile the raw assembly and C files without errors.
2. **QEMU Emulation**: Boot the compiled `sunset_os.img` in QEMU to see the real AP Bootloader and custom kernel loading text.
3. **Web Dev Validation**: Start the Vite dev server (`npm run dev`) and run automated code linting/loading tests.

### Manual Verification
1. **Desktop UI Flow**: Boot the web simulator, verify the glassmorphism layout, drag/drop files, open/close multiple overlapping windows.
2. **Persistent Storage**: Create a text file, edit it in the Text Editor, close the app, open it again, and verify the edits persist via `localStorage`.
3. **Voice Interaction**: Click the microphone icon, say *"Play music"* or *"Open terminal"*, and verify the browser accurately recognizes the voice and triggers the action, speaking back the confirmation.
