# Sunset OS Dev Log — Entry 02

* **Date**: May 20, 2026
* **Author**: Arshad Pasha / Developer Team
* **Stage**: Stage 2 — Driver & File Essentials
* **Current Milestone**: Sunset OS v0.2 (32-bit Protected Mode, GDT, Flat Kernel Loading, Interactive Keyboard Driver)

---

## 📅 Summary of Today's Work
We successfully achieved a monumental transition: moving from 16-bit Real Mode into **32-bit Protected Mode** with a custom **Global Descriptor Table (GDT)**, loading our freestanding flat-binary **Laz Engine C Kernel** from raw disk sectors into physical memory at `0x1000`, and implementing a polling-based **Interactive Keyboard Driver** that maps hardware key interrupts to VGA character rendering!

### 🌟 What Worked
- **AP Bootloader Upgrade**:
  - Configured BIOS interrupt `int 0x13` to load 35 raw sectors (17.5KB capacity) starting at Sector 2 directly into memory offset `0x1000`.
  - Constructed the **Global Descriptor Table (GDT)** with three segment descriptors: Null, Code (read/execute, 4GB limit), and Data (read/write, 4GB limit).
  - Switched the CPU control register `CR0` bit 0 to `1` to enter 32-bit Protected Mode.
  - Flushed the 16-bit pipeline executing a far jump `jmp CODE_SEG:init_pm` and loaded 32-bit segment selectors (`DS`, `SS`, `ES`, `FS`, `GS`).
  - Successfully jumped to the C-entry address at physical address `0x1000`.
- **Freestanding C Kernel**:
  - Implemented standard assembly wrapper inline functions `inb` and `outb` to communicate directly with hardware port registers.
  - Formulated a **Keyboard Polling loop** that continuously reads scancodes from port `0x60` and polls the command register status port `0x64`.
  - Implemented a lookup table mapping US keyboard scan codes to standard ASCII characters.
  - Designed an active cursor position tracking system handling typing, backspacing (restricted to prompt boundary), and entering newlines with standard VGA screen scrolling.
- **MinGW Windows Toolchain Linking Resolution**:
  - Solved two critical Windows Linker (`ld.exe`) bugs:
    1. Direct linking to flat binary (`--oformat binary`) throwing `cannot perform PE operations on non PE output file`.
    2. Section positioning `. = 0x1000` throwing `section below image base`.
  - **Verified Pipeline Solution**: Linked the kernel with `--image-base 0` to bypass PE image base constraints: `ld -m i386pe -T kernel/linker.ld -o build/kernel.pe build/kernel.o --image-base 0`.
  - Extracted the raw binary segment using: `objcopy -O binary build/kernel.pe build/kernel.bin`.
- **Floppy Disk Size Padding**:
  - Solved BIOS disk read sector carries (`jc disk_error`) by padding the compiled image `sunset_os.img` to a standard **1.44MB floppy size (1,474,560 bytes)** in PowerShell.
  - Successfully booted the whole system inside **QEMU Emulator** displaying the custom orange/red/green sunset layout, accepting interactive keyboard typing!

---

## 🧠 What I Learned Today
1. **Protected Mode Switches**: Disabling interrupts via `cli` is crucial before loading GDT or editing control registers. Without it, standard BIOS interrupts executing in real-mode memory would crash the processor once CR0 changes.
2. **GDT Structure**: Understanding the segment descriptors, base addresses, limits, access bytes, and granularity bits. A flat memory model sets the segment base to `0x0` and limit to `0xFFFFF` with 4KB granularity to allow code and data access to all 4GB of physical address space.
3. **Hardware Port I/O**: Interfacing directly with the keyboard controller 8042 chip via CPU registers. Reading Status Register at `0x64` to verify if a new key has arrived (Bit 0 set) before reading the Scancode data byte from Port `0x60`.
4. **Binary Padding**: A 1.44MB floppy disk image must be fully sized to allow standard BIOS sector loading. If the floppy file size is truncated, BIOS read interrupts return errors when trying to fetch sectors past the end of the file.
5. **BIOS Boot Drive Preservation**: The BIOS passes the boot drive identifier (e.g. `0x00` or `0x80`) in the `DL` register. Standard video interrupts like `int 0x10` (e.g., clearing the screen) overwrite `DL`. Saving `DL` immediately into a memory variable before calling screen functions and restoring it before `int 0x13` is vital to prevent disk loading errors!

---

## ❌ Failures & Blocks
- **QEMU Disk Sector Read Error - File Size**:
  - *Problem*: BIOS reported fatal disk error while trying to read 35 sectors.
  - *Cause*: The combined raw binary image was only 12.8 KB (25 sectors). BIOS tried to read 35 sectors, and the read request failed because the file size was too small.
  - *Resolution*: Updated the PowerShell build script `tools/build.ps1` to automatically instantiate a 1.44MB byte buffer (1,474,560 bytes) initialized to zero, copy the bootloader and kernel into it, and write the padded image file.
- **QEMU Disk Sector Read Error - DL Register Corruption**:
  - *Problem*: Even with a 1.44MB floppy disk size, the BIOS sector read failed on some configurations.
  - *Cause*: The BIOS screen-clear interrupt `int 0x10` corrupted the `DL` register (holding screen columns or state) before we read the disk. Thus, the BIOS tried to read from an invalid drive ID (e.g., `0x4F` instead of the boot drive `0x00`).
  - *Resolution*: Upgraded `bootloader.asm` to save `DL` immediately into a `BOOT_DRIVE` variable in RAM after setting up the stack, and then move `[BOOT_DRIVE]` back into `DL` right before invoking `int 0x13`.
- **Port 3000 In Use**:
  - *Problem*: Vite reported Port 3000 in use and defaulted to Port 3001.
  - *Resolution*: Perfect, Vite handled the port mapping dynamically, serving the simulator interface flawlessly on `http://localhost:3001`.

---

## 🔮 Next Target
1. **Milestone 3 — VESA Graphics Mode**:
   - Upgrade the bootloader to set high-definition VESA graphics mode (such as `1024x768x32`) utilizing BIOS VBE extensions before jumping to Protected Mode.
   - Design a high-performance double-buffered framebuffer drawing system in the C kernel to draw pixels, boxes, and custom lines.
2. **Graphics & Mouse Driver**:
   - Implement basic PS/2 mouse cursor hardware tracking.
   - Design interactive mouse pointer overlays on top of the sunset background graphics canvas in our C kernel!
