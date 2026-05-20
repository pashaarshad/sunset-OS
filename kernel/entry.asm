; =====================================================================
; Sunset OS (Ghuroob OS) — LAZ Kernel 32-bit Entry Stub
; File: kernel/entry.asm
; Description: Guaranteed first code at 0x1000. Forwards the bootloader's
;              stack frame (VESA LFB address argument) directly to
;              kernel_main in the C kernel without altering the stack.
; =====================================================================

[bits 32]
[extern _kernel_main]

; The bootloader executed:
;   push dword [VESA_LFB_ADDRESS]
;   call KERNEL_OFFSET            ; KERNEL_OFFSET = 0x1000
;
; Stack layout when we arrive here:
;   [esp]   = return address (from bootloader's CALL)
;   [esp+4] = VESA LFB physical address (the argument)
;
; A JMP preserves this stack frame exactly, so kernel_main(unsigned int*)
; sees the LFB address as its first cdecl parameter at [esp+4].

jmp _kernel_main
