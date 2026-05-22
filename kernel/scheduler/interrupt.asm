; =====================================================================
; 🌅 Sunset OS — Assembly Interrupt Service Routine Stubs
; File: interrupt.asm
; Description: Low-level interrupt entry points, context saving/restoration,
;              and PIT-driven preemptive task switches.
; =====================================================================

[bits 32]
section .text

; Global entry symbols
[global _load_idt]
[global _irq0]
[global _irq1]

; External C handlers
[extern _exception_handler]
[extern _schedule]
[extern _keyboard_handler]

; ---------------------------------------------------------------------
; load_idt: Loads the IDT register pointer into the CPU
; ---------------------------------------------------------------------
_load_idt:
    mov edx, [esp + 4]  ; Address of idt_register_t
    lidt [edx]          ; Load IDT
    ret

; ---------------------------------------------------------------------
; Exception ISR Macros
; ---------------------------------------------------------------------
%macro ISR_NOERRCODE 1
[global _isr%1]
_isr%1:
    cli
    push dword 0        ; Dummy error code
    push dword %1       ; Exception number
    jmp isr_common_stub
%endmacro

%macro ISR_ERRCODE 1
[global _isr%1]
_isr%1:
    cli
    push dword %1       ; Exception number
    jmp isr_common_stub
%endmacro

; Define all 32 Intel exceptions
ISR_NOERRCODE 0
ISR_NOERRCODE 1
ISR_NOERRCODE 2
ISR_NOERRCODE 3
ISR_NOERRCODE 4
ISR_NOERRCODE 5
ISR_NOERRCODE 6
ISR_NOERRCODE 7
ISR_ERRCODE   8
ISR_NOERRCODE 9
ISR_ERRCODE   10
ISR_ERRCODE   11
ISR_ERRCODE   12
ISR_ERRCODE   13
ISR_ERRCODE   14
ISR_NOERRCODE 15
ISR_NOERRCODE 16
ISR_ERRCODE   17
ISR_NOERRCODE 18
ISR_NOERRCODE 19
ISR_NOERRCODE 20
ISR_NOERRCODE 21
ISR_NOERRCODE 22
ISR_NOERRCODE 23
ISR_NOERRCODE 24
ISR_NOERRCODE 25
ISR_NOERRCODE 26
ISR_NOERRCODE 27
ISR_NOERRCODE 28
ISR_NOERRCODE 29
ISR_ERRCODE   30
ISR_NOERRCODE 31

; ---------------------------------------------------------------------
; Common Exception Stub: Saves state, calls C panic, and halts
; ---------------------------------------------------------------------
isr_common_stub:
    pusha               ; Save general registers EAX, ECX, EDX, EBX, ESP, EBP, ESI, EDI
    
    push ds             ; Save data segment registers
    push es
    push fs
    push gs

    mov ax, 0x10        ; Load kernel flat data selector
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax

    ; Push the exception number as the argument to exception_handler
    mov eax, [esp + 36] ; Offset: pusha (32) + segments (16) - wait, segment pushes are 4 bytes each in 32-bit: ds(4), es(4), fs(4), gs(4) = 16 bytes.
                        ; Total pushed: pusha(32) + segments(16) = 48 bytes.
                        ; Exception number was pushed BEFORE, so it's at esp + 48. Dummy error code at esp + 52.
    push dword [esp + 48]
    call _exception_handler
    
    ; exception_handler never returns as it calls kpanic and halts,
    ; but let's have clean stack unwind just in case.
    add esp, 4
    
    pop gs
    pop fs
    pop es
    pop ds
    popa
    add esp, 8          ; Clean error code and interrupt number
    sti
    iret

; ---------------------------------------------------------------------
; IRQ0: Hardware PIT Timer (Handles Preemptive Context Switching)
; ---------------------------------------------------------------------
_irq0:
    cli                 ; Disable interrupts during switch
    
    ; 1. Save execution context of active task
    pusha               ; Pushes EAX, ECX, EDX, EBX, ESP, EBP, ESI, EDI (32 bytes)
    push ds             ; Save segment registers (16 bytes)
    push es
    push fs
    push gs
    
    mov ax, 0x10        ; Select flat Ring 0 data segment
    mov ds, ax
    mov es, ax
    
    ; 2. Call scheduler with current task's ESP as argument
    push esp
    call _schedule      ; Returns stack pointer of next active task in EAX
    mov esp, eax        ; Switch stack to next task's saved context!
    
    ; 3. Acknowledge Interrupt (Send EOI to Master PIC)
    mov al, 0x20
    out 0x20, al
    
    ; 4. Restore next task's execution context
    pop gs
    pop fs
    pop es
    pop ds
    popa
    
    sti                 ; Re-enable interrupts
    iret                ; Return to next task's execution flow!

; ---------------------------------------------------------------------
; IRQ1: Hardware PS/2 Keyboard Stroke
; ---------------------------------------------------------------------
_irq1:
    pusha
    push ds
    push es
    
    mov ax, 0x10
    mov ds, ax
    mov es, ax
    
    ; Call C keyboard handler to read code from port 0x60
    call _keyboard_handler
    
    ; Send EOI to PIC
    mov al, 0x20
    out 0x20, al
    
    pop es
    pop ds
    popa
    iret
