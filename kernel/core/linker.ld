/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — Linker Script (Optimized)
 * File: linker.ld
 * Description: Sets up the linking alignment for the C compiler.
 *              Tightly packs binary segments to minimize binary size.
 * ===================================================================== */

ENTRY(kernel_main)

SECTIONS
{
    . = 0x10000;          /* Relocate kernel segments starting at 0x10000 (64KB) */

    .text :              /* Text segment (instructions) */
    {
        *(.text)
    }

    .rodata :            /* Read-only data segment (constants/strings) */
    {
        *(.rodata)
    }

    .data :              /* Data segment (global initialized variables) */
    {
        *(.data)
    }

    .bss :               /* BSS segment (uninitialized globals) */
    {
        *(.COMMON)
        *(.bss)
    }
}
