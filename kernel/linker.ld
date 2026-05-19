/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — Linker Script
 * File: linker.ld
 * Description: Sets up the linking alignment for the C compiler and
 *              forces the flat binary entry point to locate at 0x1000.
 * ===================================================================== */

ENTRY(kernel_main)       /* Defines kernel_main as our starting entry point symbol */

SECTIONS
{
    . = 0x1000;          /* Relocate kernel segments starting at physical memory 0x1000 */

    .text : ALIGN(4096)  /* Align code text segments to 4KB pages */
    {
        *(.text)
    }

    .rodata : ALIGN(4096) /* Align read-only variables (like text strings) */
    {
        *(.rodata)
    }

    .data : ALIGN(4096)   /* Align pre-initialized globals */
    {
        *(.data)
    }

    .bss : ALIGN(4096)    /* Align uninitialized global buffers */
    {
        *(.COMMON)
        *(.bss)
    }
}
