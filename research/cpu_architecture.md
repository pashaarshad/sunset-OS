# Sunset OS Research — x86 CPU Architecture Notes

Operating system development begins by studying the processor architecture. Sunset OS is targeted at **x86 CPU architectures** (Intel, AMD, Ryzen, and older processors). Below are the engineering notes on the CPU behavior, registers, and modes.

---

## 🏎️ 1. CPU Registers (The Fastest Storage)
Registers are ultra-fast memory slots built directly inside the CPU. For standard x86 processors, we use:

### General Purpose Registers (16-bit / 32-bit equivalents)
- **AX (EAX)**: The **Accumulator**. Used for arithmetic calculations, I/O operations, and return values.
- **BX (EBX)**: The **Base Register**. Used as a pointer to data in memory.
- **CX (ECX)**: The **Counter Register**. Used for loop counters and string operations.
- **DX (EDX)**: The **Data Register**. Used for I/O port addresses and overflow values in arithmetic.

### Index Registers (Pointers into Memory Arrays)
- **SI (ESI)**: **Source Index**. Points to source strings or arrays.
- **DI (EDI)**: **Destination Index**. Points to destination strings or arrays.
- **BP (EBP)**: **Base Pointer**. Points to the base of the current stack frame.
- **SP (ESP)**: **Stack Pointer**. Points to the top of the current stack frame.

### Segment Registers (For Memory Segmentation)
In 16-bit Mode, the CPU divides memory into 64KB blocks (segments) using:
- **CS**: **Code Segment**. Points to the memory region containing instructions.
- **DS**: **Data Segment**. Points to the memory region containing variable data.
- **SS**: **Stack Segment**. Points to the memory region containing the system stack.
- **ES, FS, GS**: Extra data segments.

---

## 🚦 2. CPU Operating Modes: Real vs. Protected Mode

When the computer powers on, the CPU boots into an ancient mode for backward compatibility called **Real Mode**.

| Feature | Real Mode (16-bit) | Protected Mode (32-bit) |
| :--- | :--- | :--- |
| **Active Registers** | 16-bit registers (`ax`, `bx`, etc.) | 32-bit registers (`eax`, `ebx`, etc.) |
| **Max Memory Address** | **1 MB** (using segment arithmetic) | **4 GB** (flat direct memory access) |
| **Memory Protection** | **None** (any code can overwrite BIOS) | **Hardware Protection** (rings 0-3, page faults) |
| **Addressing Method** | `Segment * 16 + Offset` | Global Descriptor Table (GDT) and Offset |
| **Interrupts** | Real Mode IVT (Interrupt Vector Table) | IDT (Interrupt Descriptor Table) |

---

## ⚡ 3. The Rings of Protection (Privilege Levels)
x86 CPUs implement 4 privilege rings, although modern operating systems primarily use two:

```text
       ┌────────────────────────┐
       │   Ring 3: User Apps    │  <-- Least Privileged (Web browsers, text editors)
       │ ┌────────────────────┐ │
       │ │ Ring 2: Device Drv │ │
       │ │ ┌────────────────┐ │ │
       │ │ │ Ring 1: Drivers│ │ │
       │ │ │ ┌────────────┐ │ │ │
│ │ │ │   Ring 0:  │ │ │ │  <-- Most Privileged (LAZ Kernel - Direct CPU/Hardware access)
       │ │ │ │   Kernel   │ │ │ │
       │ │ │ └────────────┘ │ │ │
       │ │ └────────────────┘ │ │
       │ └────────────────────┘ │
       └────────────────────────┘
```

Sunset OS boots into **Ring 0**, granting the **LAZ Kernel** total control over physical memory, disk access, and external peripherals.
