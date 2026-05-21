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

// Initialize memory system and heap pointer
void init_memory();

// Freestanding aligned heap block allocator
void* kmalloc(unsigned int size);

// Custom deep-red graphics Panic screen
void kpanic(const char* message);

// Low-level memory byte block copy
void* memcpy(void* dest, const void* src, unsigned int count);

// Low-level memory byte block setting
void* memset(void* dest, int val, unsigned int count);

#endif
