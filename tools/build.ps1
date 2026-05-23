# =====================================================================
# 🌅 Sunset OS (Ghuroob OS) — Assembly & Compilation Build Script
# File: tools/build.ps1
# Description: Automates the compilation of assembly and C sources,
#              combines them into a bootable floppy image, and launches QEMU.
# =====================================================================

Write-Host '🌅 Sunset OS [Ghuroob OS] - Toolchain Build Automator' -ForegroundColor Yellow
Write-Host '=======================================================' -ForegroundColor DarkYellow

# 1. Ensure output folders exist
if (-not (Test-Path 'build')) {
    New-Item -ItemType Directory -Path 'build' | Out-Null
}

# 2. Check for NASM Assembler
if (-not (Get-Command nasm -ErrorAction SilentlyContinue)) {
    Write-Error 'NASM is not installed or not in your system environment PATH.'
    Write-Host 'Please follow the instructions inside docs/installation.md to set it up manually.' -ForegroundColor Gray
    Exit 1
}

# 3. Check for GCC Compiler
if (-not (Get-Command gcc -ErrorAction SilentlyContinue)) {
    Write-Error 'GCC (MinGW) is not installed or not in your system environment PATH.'
    Write-Host 'Please follow the instructions inside docs/installation.md to set it up manually.' -ForegroundColor Gray
    Exit 1
}

# 4. Assemble the Boot Sector (boot/bootloader.asm)
Write-Host 'Assembling boot/bootloader.asm...' -ForegroundColor Cyan
nasm -f bin boot/bootloader.asm -o build/bootloader.bin
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Failed to assemble bootloader.asm.'
    Exit 1
}
Write-Host 'Bootloader assembled successfully (512 bytes)!' -ForegroundColor Green

# 4.5 Assemble Kernel Entry Stub (kernel/core/entry.asm)
Write-Host 'Assembling kernel/core/entry.asm...' -ForegroundColor Cyan
nasm -f win32 kernel/core/entry.asm -o build/entry.o
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Failed to assemble entry.asm.'
    Exit 1
}
Write-Host 'Kernel entry stub assembled successfully!' -ForegroundColor Green

# 4.6 Assemble Interrupt Service Routine Stubs (kernel/interrupts/interrupt.asm)
Write-Host 'Assembling kernel/interrupts/interrupt.asm...' -ForegroundColor Cyan
nasm -f win32 kernel/interrupts/interrupt.asm -o build/interrupt.o
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Failed to assemble interrupt.asm.'
    Exit 1
}
Write-Host 'Interrupt assembly stubs assembled successfully!' -ForegroundColor Green

# 5. Compile C Kernel Modular Files
Write-Host 'Compiling C Kernel modular source files...' -ForegroundColor Cyan

# Define mapping of module names to their new relative source paths
$modules = @{
    'memory'    = 'kernel/memory/memory.c'
    'graphics'  = 'graphics/framebuffer/graphics.c'
    'font'      = 'graphics/font/font.c'
    'vfs'       = 'filesystem/vfs/vfs.c'
    'window'    = 'graphics/window_manager/window.c'
    'garden'    = 'graphics/garden/garden.c'
    'mouse'     = 'drivers/mouse/mouse.c'
    'sound'     = 'drivers/sound/sound.c'
    'net'       = 'drivers/net/net.c'
    'idt'       = 'kernel/interrupts/idt.c'
    'scheduler' = 'kernel/scheduler/scheduler.c'
    'rtc'       = 'drivers/rtc/rtc.c'
    'kernel'    = 'kernel/core/kernel.c'
}

$moduleOrder = @('memory', 'graphics', 'font', 'vfs', 'window', 'garden', 'mouse', 'sound', 'net', 'idt', 'scheduler', 'rtc', 'kernel')
$objFiles = @()

foreach ($module in $moduleOrder) {
    $srcPath = $modules[$module]
    Write-Host "Compiling ${srcPath}..." -ForegroundColor Gray
    gcc -m32 -ffreestanding `
        -Ikernel/core -Ikernel/memory -Ikernel/scheduler -Ikernel/interrupts `
        -Idrivers/mouse -Idrivers/sound -Idrivers/net -Idrivers/rtc `
        -Ifilesystem/vfs -Igraphics/framebuffer -Igraphics/window_manager `
        -Igraphics/font -Igraphics/garden `
        -c $srcPath -o "build/${module}.o"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to compile ${srcPath}"
        Exit 1
    }
    $objFiles += "build/${module}.o"
}
Write-Host 'All kernel C modules compiled successfully!' -ForegroundColor Green

# 6. Link bootloader and kernel using linker.ld
Write-Host 'Linking Kernel binary segments together...' -ForegroundColor Cyan
# We use standard Windows PE link with --image-base 0 to override default base address constraints
ld -m i386pe -T kernel/core/linker.ld -o build/kernel.pe build/entry.o build/interrupt.o $objFiles --image-base 0
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Failed to link kernel into PE object.'
    Exit 1
}

# Extract flat binary format using objcopy
Write-Host 'Extracting raw binary segment using objcopy...' -ForegroundColor Cyan
if (-not (Get-Command objcopy -ErrorAction SilentlyContinue)) {
    Write-Error 'objcopy is not found in your system environment PATH. MinGW-w64 utility required.'
    Exit 1
}
objcopy -O binary build/kernel.pe build/kernel.bin
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Failed to extract raw binary from linked PE object.'
    Exit 1
}
Write-Host 'Kernel linked and extracted successfully: build/kernel.bin!' -ForegroundColor Green

# 7. Merge Bootloader and Kernel into bootable floppy image (sunset_os.img)
Write-Host 'Merging Bootloader and Kernel into sunset_os.img (Padded to 1.44MB floppy standard)...' -ForegroundColor Cyan
try {
    $bootloaderBytes = [System.IO.File]::ReadAllBytes('build/bootloader.bin')
    $kernelBytes = [System.IO.File]::ReadAllBytes('build/kernel.bin')
    
    # 1.44MB Floppy Standard: 2880 sectors * 512 bytes = 1,474,560 bytes
    $combinedBytes = New-Object byte[] 1474560
    
    # Copy bootloader (Sector 1, offset 0)
    [System.Buffer]::BlockCopy($bootloaderBytes, 0, $combinedBytes, 0, $bootloaderBytes.Length)
    # Copy kernel (Sector 2 onwards, offset 512)
    [System.Buffer]::BlockCopy($kernelBytes, 0, $combinedBytes, $bootloaderBytes.Length, $kernelBytes.Length)
    
    [System.IO.File]::WriteAllBytes('build/sunset_os.img', $combinedBytes)
    Write-Host 'Sunset OS image created successfully: build/sunset_os.img (1.44MB floppy size)!' -ForegroundColor Green
} catch {
    Write-Error "Failed to merge and pad binaries into floppy image: $_"
    Exit 1
}

# 8. Check and run QEMU
if ($env:NO_QEMU -eq 'true' -or $args -contains '-no-qemu') {
    Write-Host 'Skipping QEMU boot execution as requested.' -ForegroundColor Yellow
} elseif (-not (Get-Command qemu-system-x86_64 -ErrorAction SilentlyContinue)) {
    Write-Host 'QEMU was not found in your system environment PATH.' -ForegroundColor Yellow
    Write-Host 'Your OS is fully compiled, but QEMU is needed to emulate booting.' -ForegroundColor Gray
} else {
    Write-Host 'Booting Sunset OS inside QEMU Emulator...' -ForegroundColor Cyan
    
    # Launch QEMU Emulator as a Floppy Disk with explicit format and PC Speaker audio enabled
    qemu-system-x86_64 -audiodev dsound,id=snd0 -machine pcspk-audiodev=snd0 -drive format=raw,file=build/sunset_os.img,if=floppy
}
