# Sunset OS Dev Log — Entry 03

* **Date**: May 20, 2026
* **Author**: Arshad Pasha / Developer Team
* **Stage**: Stage 3 — Display & UI System
* **Current Milestone**: Sunset OS v0.3 (VESA 800x600x24 Graphics Mode, Double Buffering, Heap Memory Allocator, PS/2 Mouse Driver, Overlapping Draggable Windows, and idle Breathing Ambient OS Mode)

---

## 📅 Summary of Today's Work
Today we achieved the core graphics pipeline transition for **Sunset OS (Ghuroob OS)**. We evolved our OS from VGA Text Mode to a high-performance bare-metal graphical user interface. By introducing a Linear Frame Buffer, double-buffering, memory safety barriers, and a custom PS/2 mouse driver, the **LAZ Kernel** now supports multitasking window dragging, interactive shell execution, and a signature breathing background ambient mode!

### 🌟 What Worked
* **VESA VBE Graphics Mode Transition**:
  - Upgraded `bootloader/bootloader.asm` to query VBE mode `0x115` (`800x600x24` direct color) capabilities at physical memory address `0x8000`.
  - Stored and passed the 32-bit physical **Linear Frame Buffer (LFB)** address as a stack parameter into `kernel_main`.
  - Configured VBE graphics mode `0x4115` (enabling linear frame buffer mapping) before switching to 32-bit Protected Mode.
* **Heap Memory Safety Layer (`kernel/memory.c`)**:
  - Implemented an aligned physical heap space spanning from `0x700000` (7 MB) to `0xA00000` (10 MB).
  - Built a freestanding bump allocator `kmalloc` aligning requests to 4-byte boundaries for fast CPU accesses.
  - Constructed a deep-red crash diagnostics system panic screen (`kpanic`) that suspends the system on fatal memory or hardware timeout issues.
* **Double Buffering & Graphics Library (`kernel/graphics.c`)**:
  - Set up a **1.44 MB offscreen back-buffer** at RAM location `0x500000` (5 MB physical space).
  - Programmed standard 24-bit Blue-Green-Red (BGR) pixel plotting inside `draw_pixel`.
  - Engineered a linear vertical sunset background gradient interpolating from Deep Sunset Purple (`#2C1B4D` / RGB: 44,27,77) to Warm Sunset Red (`#A8203E` / RGB: 168,32,62) and finally to Orange-Gold (`#E38535` / RGB: 227,133,53).
  - Integrated `flush_buffer()` performing a fast physical memory block copy to eliminate screen tearing and flickering completely.
* **Embedded ASCII Typography (`kernel/font.c`)**:
  - Embedded a complete 8x8 bitmap block mapping printable ASCII symbols 32 to 127.
  - Built direct character rasterizers and autowrapping string renderers.
* **Auxiliary PS/2 Mouse Driver (`kernel/mouse.c`)**:
  - Programmed the keyboard controller auxiliary interface to enable packet streaming (commands `0xA8`, `0xD4`, `0xF6`, `0xF4`).
  - Decoded 3-byte movement packets in a polling loop, matching Status bit 0 (data ready) and Status bit 5 (data originates from mouse).
  - Implemented **sign extension** to support negative relative displacement offsets smoothly.
  - Constrained absolute cursor coordinates to `800x600` boundaries and rendered a custom glowing white pointer overlay.
* **Overlapping Draggable Window Manager (`kernel/window.c`)**:
  - Implemented structures tracking coordinate rectangles, title headers, active statuses, and console text bodies.
  - Designed title-bar collision checks: left-clicking a header enables dragging and moves the window.
  - Programmed **z-index focus sorting**: clicking a window elevates its drawing order so it draws on top of all other windows.
* **Signature "Ambient OS Mode" (`kernel.c`)**:
  - Integrated an inactivity timer. If no inputs (mouse movements, clicks, keyboard events) are registered for 50,000 loop cycles (~10 seconds), the system goes into a breathing sleep state.
  - In Ambient Mode, windows disappear and a breathing animation cycles the sky background gradient up and down while displaying a glowing gold-bordered card containing centered motivational, nature-inspired quotes (Lao Tzu).
* **Modular Compiler Build Automation (`tools/build.ps1`)**:
  - Modernized `build.ps1` to compile `memory.c`, `graphics.c`, `font.c`, `mouse.c`, `window.c`, and `kernel.c` separately.
  - Linked all intermediate objects using `ld` under a single memory footprint.

---

## 🧠 What I Learned Today
1. **Linear Frame Buffers (LFB)**: VESA modes mapped via BIOS default to bank-switching (A0000 segmented memory blocks). Setting bit 14 of the mode selector (using `0x4115` instead of `0x115`) requests a Linear Frame Buffer, allowing us to treat the entire video RAM as a single, contiguous array of pixels.
2. **Double-Buffering Memory Segments**: Offscreen buffers are necessary for high-framerate GUI rendering. Direct hardware writing is too slow and causes visible flickering (tearing). Writing to a 1.44 MB buffer in high RAM (`0x500000`) and performing a fast block `memcpy` to the hardware LFB is standard for liquid-smooth animations.
3. **PS/2 Mouse Displacements**: Relative displacements inside PS/2 bytes 1 and 2 are signed 8-bit integers. If the sign bit in the first byte is set, we must pad the higher bits with `1`s (`dx |= 0xFFFFFF00`) to properly interpret the negative coordinates as 32-bit values.
4. **VBE Mode Info Queries**: The BIOS `int 0x10` VBE query returns a Mode Information Block. Byte offset 40 inside this block contains the physical start address of the Linear Frame Buffer. Extracting this dynamically ensures GPU compatibility.
5. **Freestanding Header Multi-plexing**: When performing polling-based polling loops, keyboard scancodes and mouse bytes are read from the same I/O data register `0x60`. We must inspect status port `0x64` bits (Bit 0 for data available, Bit 5 for mouse auxiliary data) to multiplex keyboard keys and mouse packets without corruption.

---

## ❌ Failures & Blocks
* **NASM TIMES Overflow Error**:
  - *Problem*: Bootloader compilation failed with `error: TIMES value -12 is negative`.
  - *Cause*: Evolving the bootloader with GDT segments, Protected Mode stack arguments, and VESA VBE mode queries pushed the code size to 522 bytes, exceeding the 512-byte limit for the first sector.
  - *Resolution*: Shortened verbose diagnostic strings (`msg_loading`, `msg_disk`, etc.) inside `bootloader.asm` to compact the footprint. This reduced the compiled code to ~420 bytes, leaving a safe buffer.
* **Mouse Cursor Coordinate Jump Bugs**:
  - *Problem*: The mouse pointer would jitter or jump to the screen edges upon minor physical movements.
  - *Cause*: Omission of sign-extension checks for relative displacement bytes. Without sign extension, negative displacements (e.g. `-1` as `0xFF`) were processed as huge positive changes (`+255` pixels).
  - *Resolution*: Added sign-extension checks (`if (mouse_bytes[0] & 0x10) dx |= 0xFFFFFF00` / `if (mouse_bytes[0] & 0x20) dy |= 0xFFFFFF00`) to support backward displacements smoothly.

---

## 🔮 Next Target
1. **Milestone 4 — Voice & Intelligence**:
   - Evolve the OS architecture to prepare for voice assistants and context engines.
   - Build a sound system mapping audio buffers for text-to-speech output in the kernel.
   - Expand the console shell keyboard input to handle advanced typing commands.
