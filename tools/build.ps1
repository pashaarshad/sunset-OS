# =====================================================================
# 🌅 Sunset OS (Ghuroob OS) — Assembly & Compilation Build Script
# File: tools/build.ps1
# Description: Automates the compilation of assembly and C sources,
#              combines them into a bootable floppy image, and launches QEMU.
# =====================================================================

Write-Host "🌅 Sunset OS [Ghuroob OS] — Toolchain Build Automator" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor DarkYellow

# 1. Ensure output folders exist
if (-not (Test-Path "build")) {
    New-Item -ItemType Directory -Path "build" | Out-Null
}

# 2. Check for NASM Assembler
if (-not (Get-Command nasm -ErrorAction SilentlyContinue)) {
    Write-Error "[FATAL] NASM is not installed or not in your system environment PATH."
    Write-Host "Please follow the instructions inside docs/installation.md to set it up manually." -ForegroundColor Gray
    Exit 1
}

# 3. Assemble the Boot Sector (bootloader.asm)
Write-Host "[*] Assembling bootloader/bootloader.asm..." -ForegroundColor Cyan
nasm -f bin bootloader/bootloader.asm -o build/bootloader.bin
if ($LASTEXITCODE -ne 0) {
    Write-Error "[FAILED] Failed to assemble bootloader.asm."
    Exit 1
}
Write-Host "[+] Bootloader assembled successfully! (512 bytes)" -ForegroundColor Green

# 4. Check for QEMU Emulator
if (-not (Get-Command qemu-system-x86_64 -ErrorAction SilentlyContinue)) {
    Write-Host "[WARNING] QEMU was not found in your system environment PATH." -ForegroundColor Yellow
    Write-Host "You can still write and compile your code, but QEMU is needed to emulate booting." -ForegroundColor Gray
} else {
    Write-Host "[*] Preparing Sunset OS bootable media image..." -ForegroundColor Cyan
    
    # In Stage 1, our bootloader stands alone as a bootable sector.
    # We copy our bootloader directly into our disk floppy image.
    Copy-Item build/bootloader.bin build/sunset_os.img
    
    Write-Host "[+] Sunset OS image created successfully: build/sunset_os.img" -ForegroundColor Green
    Write-Host "[*] Booting Sunset OS in QEMU Emulator..." -ForegroundColor Cyan
    
    # Launch QEMU Emulator
    qemu-system-x86_64 -drive format=raw,file=build/sunset_os.img
}
