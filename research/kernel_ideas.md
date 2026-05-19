# Sunset OS Research — Laz Kernel Design Ideas

The **Laz Engine** represents our vision for a custom, highly optimized, and smart kernel. This document tracks our design strategies, architectural choices, and the low-level graphics techniques required to display the system.

---

## 🏗️ 1. Kernel Architecture: Monolithic vs. Microkernel
When design begins, we must choose how core drivers and services run:

### Monolithic Kernel (Proposed for Sunset OS)
* **How it works**: The entire operating system (scheduler, memory management, filesystem, keyboard/mouse drivers) runs in a single, large executable file inside **Ring 0** (kernel space).
* **Pros**: Extremely fast because there are no boundaries or message-passing delays between drivers and the CPU.
* **Cons**: If a single driver crashes, it can take down the entire system (causing a crash/kernel panic).

### Microkernel
* **How it works**: Only the absolute bare minimum (task scheduling and physical memory mapping) runs in Ring 0. All drivers (filesystem, keyboard, display) run as standard processes in **Ring 3** (user space) and communicate via Message Passing.
* **Pros**: Incredibly stable. If the keyboard driver crashes, the kernel simply restarts it without restarting the PC.
* **Cons**: Slower due to the high overhead of Inter-Process Communication (IPC).

---

## 🎨 2. VGA Text Mode Rendering (Address `0xB8000`)
Before we have advanced graphical desktop environments (v0.3), the kernel communicates with the user using **VGA Text Mode**.
* **Memory Mapping**: The VGA video memory begins at physical address `0xB8000`.
* **Layout**: The screen has a default resolution of **80 columns** by **25 rows**.
* **Character Encoding**: Each character on the screen requires exactly **2 bytes** in video memory:
  - **Byte 1 (Even Address)**: The ASCII character code (e.g., `'A'`, `'B'`, `'\n'`).
  - **Byte 2 (Odd Address)**: The attribute byte (color).

### The VGA Attribute Byte Format
The 8 bits of the attribute byte dictate the background and foreground colors:

```text
  Bit 7      Bit 6  Bit 5  Bit 4       Bit 3      Bit 2  Bit 1  Bit 0
+----------+---------------------+----------+---------------------+
| Blink    | Background Color    | Bright   | Foreground Color    |
+----------+---------------------+----------+---------------------+
```

* **Colors Available**: Black (0), Blue (1), Green (2), Cyan (3), Red (4), Magenta (5), Brown (6), Light Gray (7), Dark Gray (8), Light Blue (9), Light Green (A), Light Cyan (B), Light Red (C), Light Magenta (D), Yellow (E), White (F).
* **Sunset Colors in VGA**: To make the console match our "calm sunset" vibe, we will use combinations of **Yellow (14 / 0xE)**, **Light Red (12 / 0xC)**, and **Dark Gray (8 / 0x8)** for console outputs!
