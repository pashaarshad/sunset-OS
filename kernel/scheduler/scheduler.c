/* =====================================================================
 * 🌅 Sunset OS — Preemptive Multi-tasking Scheduler
 * File: scheduler.c
 * Description: Implements PIT-driven Round-Robin context switcher.
 * ===================================================================== */

#include "scheduler.h"
#include "../memory/memory.h"

// Global task list
static task_t task_list[MAX_TASKS];
static int current_task_idx = 0;

// Context switch counter and tick monitor
volatile unsigned int system_ticks = 0;
volatile unsigned int context_switches = 0;

// Low-level port I/O helper
static inline void outb(unsigned short port, unsigned char val) {
    __asm__ volatile("outb %0, %1" : : "a"(val), "Nd"(port));
}

// Initialize the preemptive scheduler and configure PIT at 100 Hz
void init_scheduler() {
    // 1. Program PIT Channel 0 for a 100 Hz rate generator (10ms time slices)
    // PIT base frequency = 1193182 Hz. Divisor = 1193182 / 100 = 11931 (approx 0x2E9B)
    unsigned int divisor = 11931;
    outb(0x43, 0x36);                 // Channel 0, lobyte/hibyte, square wave mode
    outb(0x40, divisor & 0xFF);       // Low byte of divisor
    outb(0x40, (divisor >> 8) & 0xFF); // High byte of divisor

    // 2. Clear all task slots
    memset(task_list, 0, sizeof(task_t) * MAX_TASKS);

    // 3. Register primary task (Task 0) as active "Desktop GUI"
    // Since task 0 is already running, its stack is the main bootloader stack.
    // Its stack pointer (ESP) will be saved on the very first timer interrupt context switch.
    task_list[0].active = 1;
    task_list[0].name = "Desktop GUI";
    
    current_task_idx = 0;
    system_ticks = 0;
    context_switches = 0;
}

// Create a new concurrent thread of execution
int create_task(void (*entry_point)(), const char* name) {
    // Find an empty task slot
    int slot = -1;
    for (int i = 0; i < MAX_TASKS; i++) {
        if (!task_list[i].active) {
            slot = i;
            break;
        }
    }

    if (slot == -1) {
        return -1; // Out of task slots
    }

    // 1. Setup task details
    task_list[slot].active = 1;
    task_list[slot].name = name;

    // 2. Initialize the task stack frame to mimic a suspended interrupt context
    // Stack grows downwards, so we start at the top memory boundary of stack array.
    unsigned int* stack_top = (unsigned int*)(&task_list[slot].stack[STACK_SIZE]);

    // Push standard IRET frame (EFLAGS, CS, EIP)
    stack_top--; *stack_top = 0x202;                     // EFLAGS: IF = 1 (Interrupts Enabled)
    stack_top--; *stack_top = 0x08;                      // CS: Kernel Code Segment selector (0x08)
    stack_top--; *stack_top = (unsigned int)entry_point;  // EIP: Entry function pointer

    // Push dummy general registers (EAX, ECX, EDX, EBX, ESP, EBP, ESI, EDI)
    stack_top--; *stack_top = 0;                         // EAX
    stack_top--; *stack_top = 0;                         // ECX
    stack_top--; *stack_top = 0;                         // EDX
    stack_top--; *stack_top = 0;                         // EBX
    stack_top--; *stack_top = 0;                         // ESP (ignored by popa)
    stack_top--; *stack_top = 0;                         // EBP
    stack_top--; *stack_top = 0;                         // ESI
    stack_top--; *stack_top = 0;                         // EDI

    // Push segment registers (DS, ES, FS, GS) - all using standard flat 32-bit data segment selector 0x10
    stack_top--; *stack_top = 0x10;                      // DS
    stack_top--; *stack_top = 0x10;                      // ES
    stack_top--; *stack_top = 0x10;                      // FS
    stack_top--; *stack_top = 0x10;                      // GS

    // Save final stack pointer (ESP) to the task struct
    task_list[slot].esp = (unsigned int)stack_top;

    return slot;
}

// Preemptive Round-Robin schedule picker called from Assembly timer ISR
unsigned int schedule(unsigned int current_esp) {
    system_ticks++;

    // Save active task stack pointer context
    task_list[current_task_idx].esp = current_esp;

    // Pick next active task in round-robin fashion
    int next_idx = current_task_idx;
    do {
        next_idx = (next_idx + 1) % MAX_TASKS;
    } while (task_list[next_idx].active == 0);

    if (next_idx != current_task_idx) {
        context_switches++;
        current_task_idx = next_idx;
    }

    // Return stack pointer of the chosen task to be restored by assembly
    return task_list[current_task_idx].esp;
}
