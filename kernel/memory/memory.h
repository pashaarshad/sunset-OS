/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Memory & Safety Layer
 * File: memory.h
 * Description: Aligned bump heap allocator, kpanic screen, and
 *              standard memory utility blocks.
 * ===================================================================== */

#ifndef MEMORY_H
#define MEMORY_H

#define HEAP_START 0x700000
#define HEAP_MAX   0xA00000

// Memory header node structure for linked-list First-Fit allocations
typedef struct memory_header {
    unsigned int size;            // Usable size of this block (excluding header)
    char is_free;                 // 1 if block is free, 0 if allocated
    struct memory_header* next;   // Pointer to the next block in heap
} memory_header_t;

// Initialize memory system and heap pointer
void init_memory();

// Freestanding aligned heap block allocator
void* kmalloc(unsigned int size);

// Deallocate previously allocated heap memory block
void kfree(void* ptr);

// Custom deep-red graphics Panic screen
void kpanic(const char* message);

// Low-level memory byte block copy
void* memcpy(void* dest, const void* src, unsigned int count);

// Low-level memory byte block setting
void* memset(void* dest, int val, unsigned int count);

#endif
