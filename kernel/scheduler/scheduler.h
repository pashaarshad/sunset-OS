/* =====================================================================
 * 🌅 Sunset OS — Preemptive Multi-tasking Scheduler Interface
 * File: scheduler.h
 * Description: Process structures, task stacks, and Round-Robin scheduler.
 * ===================================================================== */

#ifndef SCHEDULER_H
#define SCHEDULER_H

#define MAX_TASKS 4
#define STACK_SIZE 16384 // 16 KB stack per task

typedef struct {
    unsigned int esp;             // Saved stack pointer (ESP) for context restore
    unsigned int active;          // 1 = Active thread, 0 = Dormant / Free slot
    const char* name;             // Human-readable task name
    unsigned char stack[STACK_SIZE]; // Dedicated stack space
} task_t;

// API Declarations
void init_scheduler();
int create_task(void (*entry_point)(), const char* name);
unsigned int schedule(unsigned int current_esp);

// Global system tick counter driven by PIT
extern volatile unsigned int system_ticks;

#endif
