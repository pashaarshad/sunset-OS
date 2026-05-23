/* =====================================================================
 * 🌅 Sunset OS — Interrupt Descriptor Table Implementation
 * File: idt.c
 * Description: Registers gates for protected mode CPU exceptions and
 *              reprograms 8259 PIC controllers for hardware IRQs.
 * ===================================================================== */

#include "idt.h"
#include "../memory/memory.h"

// Static IDT with 256 interrupt gates
static idt_entry_t idt[256];
static idt_register_t idt_reg;

// Low-level port I/O helper functions
static inline void outb(unsigned short port, unsigned char val) {
    __asm__ volatile("outb %0, %1" : : "a"(val), "Nd"(port));
}

static inline unsigned char inb(unsigned short port) {
    unsigned char result;
    __asm__ volatile("inb %1, %0" : "=a"(result) : "Nd"(port));
    return result;
}

// Reprogram the 8259 PIC vectors to avoid collision with CPU exceptions
static void pic_remap() {
    // Send ICW1 (Initialization command)
    outb(0x20, 0x11);
    outb(0xA0, 0x11);

    // Send ICW2 (Map Master PIC to 0x20-0x27, Slave PIC to 0x28-0x2F)
    outb(0x21, 0x20);
    outb(0xA1, 0x28);

    // Send ICW3 (Configure master/slave connection cascading)
    outb(0x21, 0x04);
    outb(0xA1, 0x02);

    // Send ICW4 (Set standard 8086 execution mode)
    outb(0x21, 0x01);
    outb(0xA1, 0x01);

    // Set OCW1 (Mask registers): Only enable IRQ0 (Timer, bit 0) and IRQ1 (Keyboard, bit 1)
    // Master PIC: 0xFC (11111100b), Slave PIC: 0xFF (11111111b)
    outb(0x21, 0xFC);
    outb(0xA1, 0xFF);
}

// Assembly stubs defined in interrupt.asm
extern void load_idt(unsigned int idt_reg_ptr);

// Exception stubs (0 to 31)
extern void isr0();  extern void isr1();  extern void isr2();  extern void isr3();
extern void isr4();  extern void isr5();  extern void isr6();  extern void isr7();
extern void isr8();  extern void isr9();  extern void isr10(); extern void isr11();
extern void isr12(); extern void isr13(); extern void isr14(); extern void isr15();
extern void isr16(); extern void isr17(); extern void isr18(); extern void isr19();
extern void isr20(); extern void isr21(); extern void isr22(); extern void isr23();
extern void isr24(); extern void isr25(); extern void isr26(); extern void isr27();
extern void isr28(); extern void isr29(); extern void isr30(); extern void isr31();

// Hardware IRQ stubs
extern void irq0();  // PIT Timer
extern void irq1();  // Keyboard

// Array of CPU exception diagnostic messages
static const char* exception_messages[] = {
    "Division By Zero Exception",
    "Debug Exception",
    "Non Maskable Interrupt Exception",
    "Breakpoint Exception",
    "Into Detected Overflow Exception",
    "Out of Bounds Exception",
    "Invalid Opcode Exception",
    "No Coprocessor Exception",
    "Double Fault Exception",
    "Coprocessor Segment Overrun Exception",
    "Bad TSS Exception",
    "Segment Not Present Exception",
    "Stack Fault Exception",
    "General Protection Fault Exception",
    "Page Fault Exception",
    "Unknown Interrupt Exception",
    "Coprocessor Fault Exception",
    "Alignment Check Exception",
    "Machine Check Exception",
    "Reserved Exception 19",
    "Reserved Exception 20",
    "Reserved Exception 21",
    "Reserved Exception 22",
    "Reserved Exception 23",
    "Reserved Exception 24",
    "Reserved Exception 25",
    "Reserved Exception 26",
    "Reserved Exception 27",
    "Reserved Exception 28",
    "Reserved Exception 29",
    "Reserved Exception 30",
    "Reserved Exception 31"
};

// Set gate descriptor
void set_idt_gate(unsigned char num, unsigned int base) {
    idt[num].low_offset = base & 0xFFFF;
    idt[num].selector = KERNEL_CS; // 0x08
    idt[num].always0 = 0;
    idt[num].flags = 0x8E;         // 32-bit Interrupt Gate, Ring 0 Privilege
    idt[num].high_offset = (base >> 16) & 0xFFFF;
}

// Master exception panic handler called by assembly stubs
void exception_handler(unsigned int exception_num) {
    if (exception_num < 32) {
        kpanic(exception_messages[exception_num]);
    } else {
        kpanic("Unknown Hardware Exception Exception");
    }
}

// Initialize IDT and reprogram PIC controllers
void init_idt() {
    // 1. Clear IDT memory structure
    memset(&idt, 0, sizeof(idt_entry_t) * 256);

    // 2. Remap PIC interrupts away from exception range
    pic_remap();

    // 3. Register CPU exception ISR handlers
    set_idt_gate(0, (unsigned int)isr0);     set_idt_gate(1, (unsigned int)isr1);
    set_idt_gate(2, (unsigned int)isr2);     set_idt_gate(3, (unsigned int)isr3);
    set_idt_gate(4, (unsigned int)isr4);     set_idt_gate(5, (unsigned int)isr5);
    set_idt_gate(6, (unsigned int)isr6);     set_idt_gate(7, (unsigned int)isr7);
    set_idt_gate(8, (unsigned int)isr8);     set_idt_gate(9, (unsigned int)isr9);
    set_idt_gate(10, (unsigned int)isr10);   set_idt_gate(11, (unsigned int)isr11);
    set_idt_gate(12, (unsigned int)isr12);   set_idt_gate(13, (unsigned int)isr13);
    set_idt_gate(14, (unsigned int)isr14);   set_idt_gate(15, (unsigned int)isr15);
    set_idt_gate(16, (unsigned int)isr16);   set_idt_gate(17, (unsigned int)isr17);
    set_idt_gate(18, (unsigned int)isr18);   set_idt_gate(19, (unsigned int)isr19);
    set_idt_gate(20, (unsigned int)isr20);   set_idt_gate(21, (unsigned int)isr21);
    set_idt_gate(22, (unsigned int)isr22);   set_idt_gate(23, (unsigned int)isr23);
    set_idt_gate(24, (unsigned int)isr24);   set_idt_gate(25, (unsigned int)isr25);
    set_idt_gate(26, (unsigned int)isr26);   set_idt_gate(27, (unsigned int)isr27);
    set_idt_gate(28, (unsigned int)isr28);   set_idt_gate(29, (unsigned int)isr29);
    set_idt_gate(30, (unsigned int)isr30);   set_idt_gate(31, (unsigned int)isr31);

    // 4. Register hardware interrupt request handler lines
    set_idt_gate(32, (unsigned int)irq0);    // Timer ticks (IRQ0)
    set_idt_gate(33, (unsigned int)irq1);    // Keyboard strokes (IRQ1)

    // 5. Load IDT pointer structure into IDTR register
    idt_reg.limit = (sizeof(idt_entry_t) * 256) - 1;
    idt_reg.base = (unsigned int)&idt;
    load_idt((unsigned int)&idt_reg);
}
