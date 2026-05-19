# Sunset OS — Manual Toolchain Setup Guide (Windows)

To build and emulate a real operating system, you need a low-level compiler toolchain. Follow these step-by-step instructions to download, install, and configure your development environment manually.

---

## 🛠️ Step 1: Install NASM (Netwide Assembler)
NASM is the assembler that compiles your 16-bit and 32-bit x86 Assembly code (`.asm`) into binary files.

1. **Download**:
   - Go to the official NASM downloads page: [https://nasm.us/](https://nasm.us/)
   - Click on the **Stable** release (e.g., `2.16.03` or later).
   - Choose `win64/` (for 64-bit Windows) and download the installer ending in `-installer-x64.exe` (e.g., `nasm-2.16.03-installer-x64.exe`).
2. **Install**:
   - Run the downloaded `.exe` installer.
   - Choose **Install for anyone using this computer** or **Just for me**.
   - Keep the default installation directory: `C:\Program Files\NASM` (or note down where it installs).
   - Click through to complete the installation.

---

## 💻 Step 2: Install GCC Compiler & Linker (MinGW-w64)
GCC compiles our C kernel files. MinGW-w64 provides GCC for Windows.

1. **Download**:
   - Go to the official MinGW-w64 download site or the popular Github release: [WinLibs](https://winlibs.com/) (recommended for a simple zip extraction).
   - Under the **MSVCRT** or **UCRT** section, look for **MinGW-w64 GCC (stable release)**.
   - Download the **Zip archive** (e.g., `win64` without LLVM/Clang for a smaller download).
2. **Install**:
   - Extract the downloaded `.zip` file.
   - Move the extracted folder (named `mingw64`) directly to the root of your `C:` drive:
     `C:\mingw64`
   - Your GCC compiler executables (like `gcc.exe` and `ld.exe`) will be inside `C:\mingw64\bin`.

---

## 📺 Step 3: Install QEMU (Virtual Emulator)
QEMU simulates an x86 computer inside Windows, allowing us to safely boot our custom `sunset_os.img` without touching your real hardware.

1. **Download**:
   - Go to the official QEMU Windows downloads: [https://www.qemu.org/download/#windows](https://www.qemu.org/download/#windows)
   - Click on the **64-bit installer** link, which redirects you to the setup repository hosted by Stefan Weil.
   - Download the latest `.exe` installer (e.g., `qemu-w64-setup-xxxxxxxx.exe`).
2. **Install**:
   - Run the installer.
   - Keep the default installation path: `C:\Program Files\qemu`.
   - Complete the setup wizard.

---

## 🌐 Step 4: Configure Windows System Environment Path
To run `nasm`, `gcc`, and `qemu-system-x86_64` directly from your VS Code terminal or PowerShell, you must add them to your Windows System Path variables.

1. Press the **Windows Key** and type `env`. Select **Edit the system environment variables**.
2. In the System Properties window, click the **Environment Variables...** button at the bottom.
3. Under the **User variables** (or **System variables** to apply to all users), locate the variable named `Path` and double-click it.
4. Click the **New** button on the right and add the following paths one by one:
   - `C:\Program Files\NASM`
   - `C:\mingw64\bin`
   - `C:\Program Files\qemu`
5. Click **OK** on all open windows to save the changes.
6. **Restart your terminal** or VS Code to apply the environment paths.

---

## ✅ Step 5: Verify Your Installation
Open a fresh **PowerShell** window and type the following commands. If configured correctly, each will return its version details:

```powershell
# Verify NASM
nasm --version

# Verify GCC
gcc --version

# Verify Linker (ld)
ld --version

# Verify QEMU Emulator
qemu-system-x86_64 --version
```

You are now fully equipped to build and boot real operating systems from scratch!
