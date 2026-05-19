; =====================================================================
; 🌅 Sunset OS (Ghuroob OS) — AP Bootloader (Milestone 2)
; File: bootloader.asm
; Author: Arshad Pasha
; Description: Custom 16-bit to 32-bit bootloader sector.
;              Initializes CPU, loads C kernel from disk, switches
;              to 32-bit Protected Mode, and jumps to C entry.
; =====================================================================

[org 0x7C00]          ; BIOS loads the boot sector here

KERNEL_OFFSET equ 0x1000 ; Memory offset where we will load our C kernel

start:
    ; 1. Initialize Segment Registers and Stack
    cli
    xor ax, ax
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov bp, 0x9000
    mov sp, bp
    sti

    ; Save the boot drive number passed in DL by BIOS
    mov [BOOT_DRIVE], dl

    ; 2. Clear screen and print loading notice
    mov ah, 0x06
    mov al, 0
    mov bh, 0x0E      ; Yellow text on Black
    mov ch, 0
    mov cl, 0
    mov dh, 24
    mov dl, 79
    int 0x10

    ; Set cursor at (0,0)
    mov ah, 0x02
    mov bh, 0
    mov dh, 0
    mov dl, 0
    int 0x10

    mov si, msg_loading
    call print_string

    ; 3. Load Kernel from disk
    call load_kernel

    ; 4. Switch to 32-bit Protected Mode
    cli               ; Disable interrupts
    lgdt [gdt_descriptor] ; Load our Global Descriptor Table

    mov eax, cr0
    or eax, 0x1       ; Set Protected Mode Enable bit in CR0
    mov cr0, eax

    jmp CODE_SEG:init_pm ; Perform far jump to flush 16-bit pipeline

; =====================================================================
; 16-BIT REAL MODE UTILITIES
; =====================================================================
print_string:
    push ax
    push bx
    mov ah, 0x0E
    mov bh, 0
    mov bl, 0x0E
.loop:
    lodsb
    cmp al, 0
    je .done
    int 0x10
    jmp .loop
.done:
    pop bx
    pop ax
    ret

load_kernel:
    mov si, msg_disk
    call print_string

    mov ah, 0x02      ; BIOS Read Sector function
    mov al, 35        ; Number of sectors to read (17.5KB - loads entire C kernel)
    mov ch, 0         ; Cylinder 0
    mov dh, 0         ; Head 0
    mov cl, 2         ; Start reading at sector 2 (immediately after boot sector)
    mov dl, [BOOT_DRIVE] ; Use the saved boot drive number
    mov bx, KERNEL_OFFSET ; Destination address: ES:BX = 0x0000:0x1000
    int 0x13
    jc disk_error     ; Jump if carry flag set (disk read failed)

    mov si, msg_disk_ok
    call print_string
    ret

disk_error:
    mov si, msg_disk_fail
    call print_string
    jmp $             ; Hang on failure

; =====================================================================
; GLOBAL DESCRIPTOR TABLE (GDT) DEFINITION
; =====================================================================
gdt_start:
    ; 1. Null Descriptor (8 bytes of zeros)
    dd 0x0
    dd 0x0

gdt_code:
    ; 2. Code Segment Descriptor (flat 4GB range)
    ; base=0x0, limit=0xfffff, granularity=1, 32-bit default, type=Code(read/execute)
    dw 0xffff       ; Limit (bits 0-15)
    dw 0x0          ; Base (bits 0-15)
    db 0x0          ; Base (bits 16-23)
    db 0x9a         ; Present(1) Privilege(00) Type(1) Code(1) Conforming(0) Readable(1) Accessed(0)
    db 0xcf         ; Granularity(1) 32-bit(1) 64-bit(0) Limit (bits 16-19)
    db 0x0          ; Base (bits 24-31)

gdt_data:
    ; 3. Data Segment Descriptor (flat 4GB range)
    ; base=0x0, limit=0xfffff, granularity=1, 32-bit default, type=Data(read/write)
    dw 0xffff       ; Limit (bits 0-15)
    dw 0x0          ; Base (bits 0-15)
    db 0x0          ; Base (bits 16-23)
    db 0x92         ; Present(1) Privilege(00) Type(1) Data(1) ExpandDown(0) Writable(1) Accessed(0)
    db 0xcf         ; Granularity(1) 32-bit(1) 64-bit(0) Limit (bits 16-19)
    db 0x0          ; Base (bits 24-31)

gdt_end:

gdt_descriptor:
    dw gdt_end - gdt_start - 1 ; GDT limit (size - 1)
    dd gdt_start               ; GDT base physical address

; Segment Selector Constants
CODE_SEG equ gdt_code - gdt_start
DATA_SEG equ gdt_data - gdt_start

; =====================================================================
; 32-BIT PROTECTED MODE ENTRY
; =====================================================================
[bits 32]
init_pm:
    ; Update segment registers to point to our flat GDT data descriptor
    mov ax, DATA_SEG
    mov ds, ax
    mov ss, ax
    mov es, ax
    mov fs, ax
    mov gs, ax

    ; Relocate Stack pointers safely in 32-bit space
    mov ebp, 0x90000
    mov esp, ebp

    ; Execute custom C kernel loaded at offset 0x1000
    call KERNEL_OFFSET
    
    ; Hang in case the kernel returns
    jmp $

; =====================================================================
; BOOT SECTOR DATA
; =====================================================================
BOOT_DRIVE    db 0           ; Store boot drive number here
msg_loading   db '🌅 [AP Bootloader v0.1] Initiated...', 13, 10, 0
msg_disk      db '[*] Loading LAZ Kernel from drive...', 13, 10, 0
msg_disk_ok   db '[+] Disk load successful! Launching Protected Mode...', 13, 10, 0
msg_disk_fail db '[FATAL] Disk sector read failed. System halted.', 13, 10, 0

times 510-($-$$) db 0 ; Pad remaining sector with zeros
dw 0xAA55             ; Boot magic signature
