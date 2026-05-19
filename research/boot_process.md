# Sunset OS Research — x86 PC Boot Process

Understanding how a raw computer powers up and executes code is essential for developing the **AP Bootloader**. These notes outline the chronological sequence of events from pressing the power button to running our custom OS.

---

## 🕰️ Chronological Boot Sequence

```text
  [ Power On ]
       │
       ▼
  [ CPU Reset Vector (0xFFFF0) ] ──────> Executes hardware ROM BIOS
       │
       ▼
  [ POST (Power On Self Test) ] ───────> Checks RAM, keyboard, and peripherals
       │
       ▼
  [ Disk Scanning & Selection ] ──────> Scans USB, SSD, HDD for bootable device
       │
       ▼
  [ Boot Sector Loading ] ─────────────> Reads sector 1 into memory at 0x7C00
       │
       ▼
  [ Signature Validation ] ────────────> Looks for 0xAA55 signature in last 2 bytes
       │
       ▼
  [ JUMP to 0x7C00 ] ──────────────────> Transfers CPU execution control to AP Bootloader
```

---

## 🔍 Detailed Boot Stages

### 1. Power On & The Reset Vector
When the power button is pressed, the power supply stabilizes and sends a signal to the CPU. The CPU starts in **16-bit Real Mode** and immediately jumps to a hardcoded physical address known as the **Reset Vector**:
`0xFFFFFFF0` (or `0xFFFF0` in 16-bit segmented notation).
This address points directly to the read-only flash chip containing the system BIOS.

### 2. POST (Power-On Self-Test)
The BIOS executes diagnostic tests to ensure vital components (RAM, CPU registers, system clock, keyboard controller) are functional. If a failure occurs, the motherboard outputs a series of audio "beep codes".

### 3. Finding the Bootable Media
The BIOS scans the boot order configured in CMOS (USB drives, SSDs, floppy disks). It reads the very first sector of the selected drive.
* **Sector Size**: A standard boot sector is exactly **512 bytes** long.
* **The Magic Signature**: For a sector to be recognized as bootable, it must end with the specific hex sequence: `0x55` and `0xAA` (represented as `0xAA55` in little-endian format) at bytes 510 and 511.

### 4. Relocation to Address `0x7C00`
If the BIOS finds a valid `0xAA55` signature, it copies the 512-byte sector from the storage drive into physical RAM at address:
`0x0000:0x7C00` (or `0x07C0:0x0000`).
The BIOS then executes a long jump instruction (`jmp 0x0000:0x7C00`), handing over total control of the hardware to our custom **AP Bootloader**.
