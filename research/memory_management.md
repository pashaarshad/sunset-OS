# Sunset OS Research — Memory Management Notes

For an operating system to be stable and fast, it must manage physical Random Access Memory (RAM) efficiently. These notes detail how Sunset OS structures its physical memory map and how it transitions from segmented addressing to flat paging.

---

## 📍 1. Real Mode Physical Memory Map (First 1 MB)
When Sunset OS boots in Real Mode, the first **1 Megabyte** of RAM is mapped in a highly standardized structure determined by IBM PC compatibility:

```text
+-----------------------------------+ 0x100000 (1 MB)
| BIOS System ROM                   |
+-----------------------------------+ 0x0F0000
| Motherboard BIOS / BIOS ROM       |
+-----------------------------------+ 0x0E0000
| Video Display Buffer (VGA Text)   | <-- VGA text mode memory begins at 0xB8000
+-----------------------------------+ 0x0A0000
| Extended BIOS Data Area (EBDA)    |
+-----------------------------------+ 0x09FC00
| Conventional Memory (Free RAM)    | <-- This is where we load the kernel (e.g., 0x1000)
+-----------------------------------+ 0x007C00 <-- AP Bootloader is loaded here by BIOS
| Conventional Memory (Free RAM)    |
+-----------------------------------+ 0x000500
| BIOS Data Area (BDA)              |
+-----------------------------------+ 0x000400
| Interrupt Vector Table (IVT)      |
+-----------------------------------+ 0x000000
```

---

## 🔀 2. Addressing in Real Mode (Segmented Addressing)
Since 16-bit registers can only store numbers up to `0xFFFF` (65,535), they cannot directly address 1 MB of memory (which requires a 20-bit address). To solve this, the CPU uses two registers to compute the final address:

$$\text{Physical Address} = (\text{Segment Register} \times 0\text{x}10) + \text{Offset Register}$$

### Example Calculation
If `CS` (Code Segment) = `0x07C0` and `IP` (Instruction Pointer) = `0x0005`:
$$\text{Physical Address} = (0\text{x}07\text{C}0 \times 16) + 0\text{x}0005$$
$$\text{Physical Address} = 0\text{x}07\text{C}00 + 0\text{x}0005 = 0\text{x}07\text{C}05$$

---

## 🧱 3. The Stack (Last-In, First-Out Memory)
The Stack is an area of RAM used to store local variables, function return addresses, and register backups.
* **Stack Growth**: On x86 processors, the stack grows **downward** (towards lower memory addresses).
* **ESP / SP**: Points to the current top of the stack.
* **EBP / BP**: Points to the base of the current stack frame.

In `bootloader.asm`, we will set up the stack safely away from our code (e.g., setting the stack base `BP` to `0x9000` and stack pointer `SP` to `0x9000` so it grows downward towards `0x8000` without colliding with our bootloader at `0x7C00`).

---

## 🚀 4. Protected Mode & Paging (Sunset OS v0.2 Plan)
In v0.2, the **LAZ Kernel** will enable virtual memory by:
1. **Setting up the GDT (Global Descriptor Table)**: Defines memory segments spanning the entire 4GB address space to eliminate the 16-bit segmented limits.
2. **Paging**: Divides memory into small **4KB pages**. The kernel maps these virtual pages to physical blocks in RAM, protecting user applications from accessing kernel memory space and enabling smooth task switching.
