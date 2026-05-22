/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Memory & Safety Layer
 * File: memory.c
 * Description: Memory allocations, block copies, and panic systems.
 * ===================================================================== */

#include "memory.h"

static unsigned char* heap_curr = (unsigned char*)HEAP_START;

// Declaring external rendering functions to use in kpanic
extern void clear_screen_color(unsigned char r, unsigned char g, unsigned char b);
extern void draw_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b);
extern void draw_string(const char* str, int x, int y, unsigned char r, unsigned char g, unsigned char b);
extern void flush_buffer();

void init_memory() {
    heap_curr = (unsigned char*)HEAP_START;
}

void* kmalloc(unsigned int size) {
    // Aligns size to 4-byte boundaries for CPU performance
    size = (size + 3) & ~3;
    
    if (heap_curr + size > (unsigned char*)HEAP_MAX) {
        kpanic("OUT OF SYSTEM MEMORY (kmalloc Heap Exhaustion)");
        return 0;
    }
    
    void* allocated_address = (void*)heap_curr;
    heap_curr += size;
    return allocated_address;
}

void kpanic(const char* message) {
    // Deep Red/Burgundy background color matching Sunset's dark tones: RGB (120, 10, 10)
    clear_screen_color(120, 10, 10);
    
    // Draw a prominent black header box for diagnostics
    draw_rect(50, 50, 700, 80, 20, 20, 20);
    
    // Render the panic notices
    draw_string("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", 70, 65, 255, 255, 255);
    draw_string("🌅 SUNSET OS KERNEL PANIC - Ring 0 Fatal Execution Blocked 🌅", 70, 85, 255, 255, 255);
    draw_string("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", 70, 105, 255, 255, 255);
    
    draw_string("A fatal error occurred and the LAZ Kernel was forced to suspend.", 70, 160, 255, 200, 200);
    
    draw_string("DIAGNOSTIC LOG MESSAGE:", 70, 200, 255, 255, 0);
    draw_string(message, 70, 225, 255, 255, 255);
    
    draw_string("HARDWARE / SYSTEM STATE:", 70, 280, 255, 255, 0);
    draw_string("- CPU Mode: 32-bit Protected Mode (Ring 0 active)", 70, 305, 220, 220, 220);
    draw_string("- Paging: Disabled (Flat physical segment addressing)", 70, 325, 220, 220, 220);
    draw_string("- Sound: Inactive", 70, 345, 220, 220, 220);
    draw_string("- Keyboard/Mouse Ports: 0x60, 0x64 (polling mode)", 70, 365, 220, 220, 220);
    
    draw_string("Please restart your machine or QEMU emulator instance.", 70, 430, 200, 255, 200);
    draw_string("Sunset OS - Breathing in the twilight. Sleep well.", 70, 460, 255, 200, 100);
    
    // Flush back-buffer to the screen
    flush_buffer();
    
    // Hang CPU indefinitely
    while (1) {
        __asm__ volatile("cli; hlt");
    }
}

void* memcpy(void* dest, const void* src, unsigned int count) {
    char* dst_c = (char*)dest;
    const char* src_c = (const char*)src;
    for (unsigned int i = 0; i < count; i++) {
        dst_c[i] = src_c[i];
    }
    return dest;
}

void* memset(void* dest, int val, unsigned int count) {
    char* dst_c = (char*)dest;
    for (unsigned int i = 0; i < count; i++) {
        dst_c[i] = (char)val;
    }
    return dest;
}
