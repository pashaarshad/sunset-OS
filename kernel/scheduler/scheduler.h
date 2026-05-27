/* =====================================================================
 * 🌅 Sunset OS — Preemptive Multi-tasking Scheduler Interface
 * File: scheduler.h
 * Description: Process structures, task stacks, and Round-Robin scheduler.
 * ===================================================================== */

#ifndef SCHEDULER_H
#define SCHEDULER_H

#define MAX_TASKS 8
#define STACK_SIZE 16384 // 16 KB stack per task

typedef enum {
    TASK_STATE_DORMANT = 0,
    TASK_STATE_READY,
    TASK_STATE_RUNNING,
    TASK_STATE_SLEEPING
} task_state_t;

typedef struct {
    unsigned int esp;                 // Saved stack pointer (ESP) for context restore
    task_state_t state;               // Task state (READY, RUNNING, SLEEPING, DORMANT)
    unsigned int sleep_ticks;         // Ticks remaining to sleep
    const char* name;                 // Human-readable task name
    unsigned char stack[STACK_SIZE];  // Dedicated stack space
} task_t;

typedef struct {
    volatile int locked;
} mutex_t;

// API Declarations
void init_scheduler();
int create_task(void (*entry_point)(), const char* name);
unsigned int schedule(unsigned int current_esp);
void sys_yield();
void scheduler_sleep(unsigned int ticks);
int terminate_task(int slot);

// Atomic Mutex synchronization APIs
void mutex_lock(mutex_t* mtx);
void mutex_unlock(mutex_t* mtx);

// Global system tick counter driven by PIT
extern volatile unsigned int system_ticks;

#endif
