/* =====================================================================
 * 🌅 Sunset OS — Interrupt Descriptor Table Interface
 * File: idt.h
 * Description: Data structures and entry gates for Protected Mode interrupts.
 * ===================================================================== */

#ifndef IDT_H
#define IDT_H

#define KERNEL_CS 0x08

// Structure representing an IDT gate descriptor (8 bytes)
typedef struct {
    unsigned short low_offset;  // Lower 16 bits of the handler's address
    unsigned short selector;    // GDT Segment selector (0x08 for Code Segment)
    unsigned char always0;      // Reserved, must be 0
    unsigned char flags;        // Flags (Type & Attributes: 0x8E for 32-bit interrupt)
    unsigned short high_offset; // Higher 16 bits of the handler's address
} __attribute__((packed)) idt_entry_t;

// Structure representing the IDTR register contents
typedef struct {
    unsigned short limit;       // IDT table size - 1 (256 * 8 - 1)
    unsigned int base;          // Aligned base address of IDT
} __attribute__((packed)) idt_register_t;

// API declarations
void init_idt();
void set_idt_gate(unsigned char num, unsigned int base);

#endif
