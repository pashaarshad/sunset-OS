; =====================================================================
; 🌅 Sunset OS (Ghuroob OS) — AP Bootloader
; File: bootloader.asm
; Author: Arshad Pasha
; Description: Custom 16-bit Real Mode boot sector.
;              Initializes CPU, clears the screen, prints our custom
;              nature-inspired welcome banner, and transfers control.
; =====================================================================

[org 0x7C00]          ; BIOS loads the bootloader at physical address 0x7C00

; =====================================================================
; 1. CPU INITIALIZATION
; =====================================================================
start:
    cli               ; Disable CPU interrupts while setting up registers
    xor ax, ax        ; Clear AX (AX = 0)
    mov ds, ax        ; Set Data Segment (DS) to 0
    mov es, ax        ; Set Extra Segment (ES) to 0
    mov ss, ax        ; Set Stack Segment (SS) to 0
    mov bp, 0x9000    ; Set Stack Base Pointer (BP) safely at 0x9000
    mov sp, bp        ; Set Stack Pointer (SP) to BP (stack grows downwards)
    sti               ; Re-enable CPU interrupts

; =====================================================================
; 2. CLEAR THE SCREEN (Using BIOS Video Interrupts)
; =====================================================================
clear_screen:
    mov ah, 0x06      ; BIOS Interrupt: Scroll Window Up (clears screen)
    mov al, 0         ; AL = 0 (Clear entire screen)
    mov bh, 0x0E      ; BH = 0x0E (Yellow text on Black background - Sunset vibe!)
    mov ch, 0         ; Upper-left row = 0
    mov cl, 0         ; Upper-left column = 0
    mov dh, 24        ; Lower-right row = 24
    mov dl, 79        ; Lower-right column = 79
    int 0x10          ; Call BIOS Video Service

; =====================================================================
; 3. SET CURSOR POSITION TO HOME (0, 0)
; =====================================================================
set_cursor:
    mov ah, 0x02      ; BIOS Interrupt: Set Cursor Position
    mov bh, 0         ; Page number 0
    mov dh, 2         ; Row = 2
    mov dl, 5         ; Column = 5
    int 0x10          ; Call BIOS Video Service

; =====================================================================
; 4. PRINT THE SUNSET OS BANNERS
; =====================================================================
print_banner:
    mov si, banner_line1
    call print_string

    mov si, banner_line2
    call print_string

    mov si, banner_line3
    call print_string

    mov si, welcome_msg
    call print_string

    mov si, status_msg
    call print_string

; =====================================================================
; 5. HANG THE CPU IN AN INFINITE LOOP (Stage 1 Target achieved!)
; =====================================================================
hang:
    jmp hang          ; Infinite loop

; =====================================================================
; UTILITY FUNCTIONS
; =====================================================================
; print_string: Prints a null-terminated string pointed to by SI
print_string:
    push ax           ; Back up registers to stack
    push bx
    mov ah, 0x0E      ; BIOS Interrupt: Teletype Output (prints char in AL)
    mov bh, 0         ; Page number 0
    mov bl, 0x0E      ; Text color: Yellow/Orange
.loop:
    lodsb             ; Load byte from [SI] into AL and increment SI
    cmp al, 0         ; Check if byte is null terminator (0)
    je .done          ; If 0, exit function
    int 0x10          ; Call BIOS Video Service to print character
    jmp .loop         ; Repeat for next character
.done:
    pop bx            ; Restore registers from stack
    pop ax
    ret

; =====================================================================
; DATA SEGMENT (Strings & Messages)
; =====================================================================
; Carriage return (13) and Line feed (10) for newlines
banner_line1 db '  ___________________________________________  ', 13, 10, 0
banner_line2 db ' /                                           \ ', 13, 10, 0
banner_line3 db ' |      🌅  Sunset OS (Ghuroob OS)  🌅        | ', 13, 10, 0
welcome_msg  db ' \___________________________________________/ ', 13, 10, 13, 10, 0
status_msg   db '  [+] AP Bootloader loaded successfully!     ', 13, 10,
             db '  [+] System: x86 CPU initialized in Real Mode.', 13, 10,
             db '  [+] Calm Environment Ready.', 13, 10, 13, 10,
             db '  Press Ctrl+Alt+Del to restart or Shutdown...', 13, 10, 0

; =====================================================================
; BOOT SECTOR STRUCTURE ENFORCEMENT
; =====================================================================
times 510-($-$$) db 0 ; Pad the rest of the 512-byte sector with zeros
dw 0xAA55             ; The magic boot signature in the last 2 bytes
