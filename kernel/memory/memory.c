/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Memory & Safety Layer
 * File: memory.c
 * Description: First-Fit heap allocator, block splitting, adjacent
 *              free coalescing, CPU register dump and visual panic.
 * ===================================================================== */

#include "memory.h"

// Declaring external rendering functions to use in kpanic
extern void clear_screen_color(unsigned char r, unsigned char g, unsigned char b);
extern void draw_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b);
extern void draw_string(const char* str, int x, int y, unsigned char r, unsigned char g, unsigned char b);
extern void flush_buffer();

/* ── Low-level Formatting Helpers ── */

static void hex_to_str(unsigned int val, char* buf) {
    const char* hex_chars = "0123456789ABCDEF";
    buf[0] = '0';
    buf[1] = 'x';
    for (int i = 7; i >= 0; i--) {
        buf[2 + i] = hex_chars[val & 0xF];
        val >>= 4;
    }
    buf[10] = '\0';
}

static void uint_to_str(unsigned int val, char* buf) {
    int i = 0;
    if (val == 0) {
        buf[i++] = '0';
        buf[i] = '\0';
        return;
    }
    char temp[16];
    int t_idx = 0;
    while (val > 0) {
        temp[t_idx++] = '0' + (val % 10);
        val /= 10;
    }
    for (int j = t_idx - 1; j >= 0; j--) {
        buf[i++] = temp[j];
    }
    buf[i] = '\0';
}

static void s_copy(char* dest, const char* src) {
    int i = 0;
    while (src[i]) {
        dest[i] = src[i];
        i++;
    }
    dest[i] = '\0';
}

static unsigned int s_length(const char* str) {
    unsigned int len = 0;
    while (str[len] != '\0') {
        len++;
    }
    return len;
}

/* ── Public API ── */

void init_memory() {
    // Set up the entire heap (3MB space) as a single huge free memory block header at the start
    memory_header_t* first_block = (memory_header_t*)HEAP_START;
    first_block->size = (HEAP_MAX - HEAP_START) - sizeof(memory_header_t);
    first_block->is_free = 1;
    first_block->next = 0;
}

void* kmalloc(unsigned int size) {
    // 1. Aligns size to 4-byte boundaries for CPU alignment performance
    size = (size + 3) & ~3;
    
    memory_header_t* curr = (memory_header_t*)HEAP_START;
    while (curr != 0) {
        if (curr->is_free && curr->size >= size) {
            // 2. Can we split this block? (Requires space for a new header and minimum payload)
            if (curr->size >= size + sizeof(memory_header_t) + 4) {
                memory_header_t* new_block = (memory_header_t*)((char*)curr + sizeof(memory_header_t) + size);
                new_block->size = curr->size - size - sizeof(memory_header_t);
                new_block->is_free = 1;
                new_block->next = curr->next;
                
                curr->size = size;
                curr->next = new_block;
            }
            
            // Mark block as allocated and return the usable payload address
            curr->is_free = 0;
            return (void*)((char*)curr + sizeof(memory_header_t));
        }
        curr = curr->next;
    }
    
    // Heap exhaustion! Raise exception
    kpanic("OUT OF SYSTEM MEMORY (kmalloc Heap Exhaustion)");
    return 0;
}

void kfree(void* ptr) {
    if (ptr == 0) return;
    
    // Retrieve preceding block header address
    memory_header_t* block = (memory_header_t*)((char*)ptr - sizeof(memory_header_t));
    block->is_free = 1;
    
    // Coalescing: merge any consecutive adjacent blocks that are both free
    memory_header_t* curr = (memory_header_t*)HEAP_START;
    while (curr != 0) {
        while (curr->is_free && curr->next != 0 && curr->next->is_free) {
            curr->size += sizeof(memory_header_t) + curr->next->size;
            curr->next = curr->next->next;
        }
        curr = curr->next;
    }
}

void kpanic(const char* message) {
    // 1. Capture CPU registers using inline assembly immediately at call moment
    unsigned int eax_val, ebx_val, ecx_val, edx_val;
    unsigned int esp_val, ebp_val;
    __asm__ volatile("mov %%eax, %0" : "=r"(eax_val));
    __asm__ volatile("mov %%ebx, %0" : "=r"(ebx_val));
    __asm__ volatile("mov %%ecx, %0" : "=r"(ecx_val));
    __asm__ volatile("mov %%edx, %0" : "=r"(edx_val));
    __asm__ volatile("mov %%esp, %0" : "=r"(esp_val));
    __asm__ volatile("mov %%ebp, %0" : "=r"(ebp_val));
    
    // 2. Scan heap blocks to calculate active allocations metrics
    unsigned int allocated_bytes = 0;
    unsigned int free_bytes = 0;
    memory_header_t* curr_heap = (memory_header_t*)HEAP_START;
    while (curr_heap != 0) {
        if (curr_heap->is_free) {
            free_bytes += curr_heap->size;
        } else {
            allocated_bytes += curr_heap->size;
        }
        curr_heap = curr_heap->next;
    }
    
    // 3. Clear Screen to Deep Burgundy (Sunset Panic tone: RGB 120, 10, 10)
    clear_screen_color(120, 10, 10);
    
    // Draw diagnostic box
    draw_rect(50, 50, 700, 80, 20, 20, 20); // Charcoal title box
    
    draw_string("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", 70, 65, 255, 255, 255);
    draw_string("🌅 SUNSET OS KERNEL PANIC - Ring 0 Fatal Execution Blocked 🌅", 70, 85, 255, 255, 255);
    draw_string("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", 70, 105, 255, 255, 255);
    
    draw_string("A fatal error occurred and the LAZ Kernel was forced to suspend.", 70, 160, 255, 200, 200);
    
    draw_string("DIAGNOSTIC LOG MESSAGE:", 70, 195, 255, 255, 0);
    draw_string(message, 70, 220, 255, 255, 255);
    
    // Render CPU Registers dump
    draw_string("CPU REGISTERS DUMP (INLINE ASSEMBLY READOUT):", 70, 260, 255, 255, 0);
    
    char reg_row1[128];
    s_copy(reg_row1, "EAX: ");
    hex_to_str(eax_val, reg_row1 + 5);
    s_copy(reg_row1 + 15, "  EBX: ");
    hex_to_str(ebx_val, reg_row1 + 22);
    s_copy(reg_row1 + 32, "  ECX: ");
    hex_to_str(ecx_val, reg_row1 + 39);
    s_copy(reg_row1 + 49, "  EDX: ");
    hex_to_str(edx_val, reg_row1 + 56);
    draw_string(reg_row1, 70, 285, 220, 220, 220);

    char reg_row2[128];
    s_copy(reg_row2, "ESP: ");
    hex_to_str(esp_val, reg_row2 + 5);
    s_copy(reg_row2 + 15, "  EBP: ");
    hex_to_str(ebp_val, reg_row2 + 22);
    draw_string(reg_row2, 70, 310, 220, 220, 220);
    
    // Render Heap Diagnostics dump
    draw_string("HEAP MEMORY DIAGNOSTICS:", 70, 350, 255, 255, 0);
    
    char mem_info1[128];
    s_copy(mem_info1, "Total Allocated Payload: ");
    char alloc_str[16];
    uint_to_str(allocated_bytes, alloc_str);
    s_copy(mem_info1 + s_length(mem_info1), alloc_str);
    s_copy(mem_info1 + s_length(mem_info1), " Bytes");
    draw_string(mem_info1, 70, 375, 220, 220, 220);

    char mem_info2[128];
    s_copy(mem_info2, "Total Free Recyclable:   ");
    char free_str[16];
    uint_to_str(free_bytes, free_str);
    s_copy(mem_info2 + s_length(mem_info2), free_str);
    s_copy(mem_info2 + s_length(mem_info2), " Bytes");
    draw_string(mem_info2, 70, 400, 220, 220, 220);
    
    draw_string("Please restart your machine or QEMU emulator instance.", 70, 445, 200, 255, 200);
    draw_string("Sunset OS - Breathing in the twilight. Sleep well.", 70, 475, 255, 200, 100);
    
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
