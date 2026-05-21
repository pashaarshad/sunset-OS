/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — LAZ Kernel Main Coordinator
 * File: kernel.c
 * Author: Arshad Pasha
 * Description: High-performance 32-bit modular freestanding graphics kernel.
 *              Now features preemptive multi-tasking, PIT scheduling, and
 *              interrupt-driven keyboard buffers.
 * ===================================================================== */

#include "memory.h"
#include "graphics.h"
#include "font.h"
#include "mouse.h"
#include "window.h"
#include "sound.h"
#include "net.h"
#include "../scheduler/idt.h"
#include "../scheduler/scheduler.h"
#include "garden.h"

// Scancode to US Keyboard ASCII mapping array (32-bit flat compatible)
static const char scancode_to_ascii[] = {
    0,  27, '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '\b',
    '\t', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\n',
    0, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', '`', 0, '\\',
    'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 0, '*', 0, ' '
};

// Global interactive shell buffer states
static char shell_buffer[256];
static int shell_len = 0;

static char garden_buffer[512];
static char notes_buffer[1024];
static char show_garden = 0;

static void helper_strcpy(char* dest, const char* src) {
    int i = 0;
    while (src[i] != '\0') {
        dest[i] = src[i];
        i++;
    }
    dest[i] = '\0';
}

// Context memory history buffer
static char cmd_history[5][32];
static int history_count = 0;

// ---------------------------------------------------------------------
// Interrupt-Driven Keyboard Driver with Ring Buffer Queue
// ---------------------------------------------------------------------
#define KEYBOARD_BUFFER_SIZE 256
static char keyboard_queue[KEYBOARD_BUFFER_SIZE];
static volatile int keyboard_head = 0;
static volatile int keyboard_tail = 0;

// Low-level hardware reading port wrapper
static inline unsigned char inb(unsigned short port) {
    unsigned char result;
    __asm__ volatile("in %%dx, %%al" : "=a" (result) : "d" (port));
    return result;
}

// Low-level hardware writing port wrapper
static inline void outb(unsigned short port, unsigned char val) {
    __asm__ volatile("outb %0, %1" : : "a"(val), "Nd"(port));
}

// C Interrupt Handler called by irq1_stub in interrupt.asm
void keyboard_handler() {
    unsigned char status = inb(0x64);
    // Bit 0 must be 1 (output buffer full) and Bit 5 must be 0 (keyboard data, not mouse)
    if ((status & 0x21) == 0x01) {
        unsigned char scancode = inb(0x60);
        // Process make-codes (keydown events, < 0x80)
        if (scancode < 0x80) {
            char ascii = scancode_to_ascii[scancode];
            if (ascii != 0) {
                int next = (keyboard_head + 1) % KEYBOARD_BUFFER_SIZE;
                if (next != keyboard_tail) {
                    keyboard_queue[keyboard_head] = ascii;
                    keyboard_head = next;
                }
            }
        }
    }
}

// Non-blocking getter to read keyboard characters from interrupt buffer queue
char kgetc() {
    if (keyboard_head == keyboard_tail) {
        return 0; // Queue empty
    }
    char c = keyboard_queue[keyboard_tail];
    keyboard_tail = (keyboard_tail + 1) % KEYBOARD_BUFFER_SIZE;
    return c;
}

// ---------------------------------------------------------------------
// Shared Strings and Multitasking Monitoring Panels
// ---------------------------------------------------------------------
static char diag_buffer[512];

static unsigned int mystrlen(const char* str) {
    unsigned int len = 0;
    while (str[len] != '\0') {
        len++;
    }
    return len;
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

extern volatile unsigned int context_switches;

static void update_diagnostics() {
    memset(diag_buffer, 0, 512);
    memcpy(diag_buffer, "LAZ MULTITASKING KERNEL:\n", 25);
    memcpy(diag_buffer + mystrlen(diag_buffer), "- CPU Privilege: Ring 0 Core\n", 29);
    memcpy(diag_buffer + mystrlen(diag_buffer), "- Threading: Preemptive PIT\n", 29);
    memcpy(diag_buffer + mystrlen(diag_buffer), "- Slices: 10ms Round-Robin\n", 28);
    
    memcpy(diag_buffer + mystrlen(diag_buffer), "- System Ticks: ", 16);
    char tick_str[16];
    uint_to_str(system_ticks, tick_str);
    memcpy(diag_buffer + mystrlen(diag_buffer), tick_str, mystrlen(tick_str));
    memcpy(diag_buffer + mystrlen(diag_buffer), "\n", 1);
    
    memcpy(diag_buffer + mystrlen(diag_buffer), "- Context Switches: ", 20);
    char switch_str[16];
    uint_to_str(context_switches, switch_str);
    memcpy(diag_buffer + mystrlen(diag_buffer), switch_str, mystrlen(switch_str));
    memcpy(diag_buffer + mystrlen(diag_buffer), "\n", 1);
    
    memcpy(diag_buffer + mystrlen(diag_buffer), "- Active Tasks: 3\n", 18);
    memcpy(diag_buffer + mystrlen(diag_buffer), "  [1] Desktop GUI (Core)\n", 25);
    memcpy(diag_buffer + mystrlen(diag_buffer), "  [2] Melody Loop (Sound)\n", 26);
    memcpy(diag_buffer + mystrlen(diag_buffer), "  [3] System Monitor (Active)\n", 30);
}

// Task 1: Background Melody Chime Thread
void melody_chime_task() {
    while (1) {
        // Sleep for a tranquil interval (approx 15 seconds)
        for (int i = 0; i < 15; i++) {
            sleep_ms(1000);
        }
        
        // Play an elegant relaxing major chord arpeggio sequence
        play_tone(440); // A4
        sleep_ms(180);
        play_tone(554); // C#5
        sleep_ms(180);
        play_tone(659); // E5
        sleep_ms(180);
        play_tone(880); // A5
        sleep_ms(300);
        stop_tone();
    }
}

// Task 2: Background System Diagnostics Update Thread
void sys_monitor_task() {
    while (1) {
        sleep_ms(50); // Periodic refreshes every 50ms
        update_diagnostics();
    }
}

static void clear_shell() {
    memset(shell_buffer, 0, 256);
    memcpy(shell_buffer, "[OK] Shell active.\nsunset-OS:~$ ", 32);
    shell_len = 32;
}

static void append_to_shell(const char* str) {
    for (int i = 0; str[i] != '\0' && shell_len < 240; i++) {
        shell_buffer[shell_len++] = str[i];
    }
    shell_buffer[shell_len] = '\0';
}

// Delay generator to regulate kernel loop speeds
static void delay(int count) {
    volatile int i = count;
    while (i--);
}

/* =====================================================================
 * KERNEL ENTRY POINT (Receives physical LFB pointer from bootloader)
 * ===================================================================== */
void kernel_main(unsigned int* vesa_framebuffer) {
    // 1. Initialize Memory safety layers first
    init_memory();

    // Initialize Network stack configuration
    init_net();

    // 2. Initialize VESA graphics drivers
    init_graphics((unsigned char*)vesa_framebuffer);

    // 3. Initialize auxiliary hardware Mouse driver
    init_mouse();

    // 4. Render Serene Boot Loading Screen
    draw_gradient(0);
    
    // Draw Gorgeous Centered Loading Panel
    draw_rect(200, 180, 400, 240, 30, 25, 35); // Sleek charcoal-purple card
    draw_rect_outline(199, 179, 402, 242, 227, 133, 53); // Glowing gold borders
    
    draw_string("🌅 Sunset OS", 335, 210, 227, 133, 53);
    draw_string("Breathe in. Rest. Reflect.", 285, 240, 245, 235, 230);
    
    // Draw Progress Bar Outline
    draw_rect_outline(250, 280, 300, 16, 227, 133, 53);
    
    // Play the serene welcome melody chime as loading starts
    play_startup_chime();

    for (int p = 0; p <= 100; p++) {
        // Fill Progress Bar
        int fill_width = (296 * p) / 100;
        draw_rect(252, 282, fill_width, 12, 227, 133, 53); // Sunset Gold fill
        
        // Clear and render loading status message
        draw_rect(210, 320, 380, 30, 30, 25, 35); // Clear text area
        
        if (p < 25) {
            draw_string("Loading kernel systems...", 290, 320, 220, 220, 220);
        } else if (p < 50) {
            draw_string("Initializing memory buffers...", 275, 320, 220, 220, 220);
        } else if (p < 75) {
            draw_string("Mounting virtual drives...", 290, 320, 220, 220, 220);
        } else if (p < 90) {
            draw_string("Starting preemptive scheduler...", 265, 320, 220, 220, 220);
        } else {
            draw_string("Opening serene workspace...", 285, 320, 220, 220, 220);
        }
        
        flush_buffer();
        delay(1200000); // Smooth progress delay
    }

    // 5. Initialize Interrupts and IDT Remapping
    init_idt();

    // 6. Initialize Preemptive Multitasking Scheduler
    init_scheduler();

    // 7. Register concurrent thread tasks
    create_task(melody_chime_task, "Melody Loop");
    create_task(sys_monitor_task, "System Monitor");

    // 8. Dynamically render initial system statistics buffer
    update_diagnostics();

    // 9. Enable hardware interrupts globally via CPU flag setting
    __asm__ volatile("sti");

    // 10. Set up interactive windows
    Window win_diag;
    Window win_notes;
    Window win_shell;
    Window win_garden;

    init_garden();

    init_window(&win_diag, 40, 70, 320, 210, "System Diagnostics", diag_buffer);

    helper_strcpy(notes_buffer,
                "WELCOME TO SUNSET OS\n"
                "Watching natural sunsets brings\n"
                "peace, motivation and focus.\n\n"
                "LAZ Kernel is designed to remove\n"
                "distractions, letting you work\n"
                "in a serene computing environment.\n\n"
                "Breathe in. Rest. Reflect.");

    init_window(&win_notes, 440, 70, 320, 210, "Calm Notes", notes_buffer);

    clear_shell();
    init_window(&win_shell, 180, 300, 440, 220, "Sunset Shell Interface", shell_buffer);
    win_shell.active = 1; // Shell window active at boot

    init_window(&win_garden, 220, 150, 360, 240, "Zen Garden Sandbox", garden_buffer);

    // State trackers for signature idle breathing Ambient Mode
    unsigned int idle_timer = 0;
    char is_ambient = 0;
    int ambient_shift = 0;
    char breathing_up = 1;
    
    // Previous mouse state variables to detect movements
    int prev_mouse_x = mouse_x;
    int prev_mouse_y = mouse_y;

    // Loop state
    while (1) {
        // Ticks idle timer
        idle_timer++;
        
        // Keep Diagnostics content pointer synced to our dynamic buffer
        win_diag.content = diag_buffer;

        // -------------------------------------------------------------
        // I. POLL INPUT DEVICES
        // -------------------------------------------------------------
        
        // 1. Update Mouse controller inputs
        update_mouse();
        
        // Detect active mouse inputs
        if (mouse_x != prev_mouse_x || mouse_y != prev_mouse_y || mouse_left_clicked) {
            idle_timer = 0;
            is_ambient = 0;
            prev_mouse_x = mouse_x;
            prev_mouse_y = mouse_y;
        }

        // 2. Read from the Interrupt-Driven Keyboard buffer
        char ascii = kgetc();
        if (ascii != 0) {
            idle_timer = 0;
            is_ambient = 0;
            
            if (show_garden && win_garden.active) {
                if (ascii == 27 || ascii == 'q' || ascii == 'Q') {
                    show_garden = 0;
                    win_garden.active = 0;
                    win_shell.active = 1;
                } else {
                    handle_garden_input(ascii);
                    draw_garden_content(garden_buffer);
                }
            } else if (ascii == '\b') {
                // Disallow removing standard shell prompt prefix
                if (shell_len > 32) {
                    shell_len--;
                    shell_buffer[shell_len] = '\0';
                }
            } else if (ascii == '\n') {
                // Extract typed command
                char cmd[32];
                int cmd_idx = 0;
                for (int k = 32; k < shell_len && cmd_idx < 30; k++) {
                    cmd[cmd_idx++] = shell_buffer[k];
                }
                cmd[cmd_idx] = '\0';

                // Save non-empty commands to history log
                if (cmd_idx > 0 && cmd_idx < 30) {
                    memcpy(cmd_history[history_count % 5], cmd, cmd_idx);
                    cmd_history[history_count % 5][cmd_idx] = '\0';
                    history_count++;
                }
                
                // Process shell commands
                if (cmd_idx == 0) {
                    append_to_shell("\nsunset-OS:~$ ");
                } else if (cmd[0] == 'h' && cmd[1] == 'e' && cmd[2] == 'l' && cmd[3] == 'p') {
                    append_to_shell("\nCommands: help, clear, ambient, panic,\n          about, chime, play, history,\n          ifconfig, ping [ip], fetch [url],\n          garden, note [msg], lofi [1-3]");
                    append_to_shell("\nsunset-OS:~$ ");
                } else if (cmd[0] == 'i' && cmd[1] == 'f' && cmd[2] == 'c' && cmd[3] == 'o' && cmd[4] == 'n' && cmd[5] == 'f' && cmd[6] == 'i' && cmd[7] == 'g') {
                    char out_buf[1024];
                    net_ifconfig(out_buf, 1024);
                    append_to_shell(out_buf);
                    append_to_shell("sunset-OS:~$ ");
                } else if (cmd[0] == 'p' && cmd[1] == 'i' && cmd[2] == 'n' && cmd[3] == 'g') {
                    int idx = 4;
                    while (cmd[idx] == ' ') idx++;
                    if (cmd[idx] != '\0') {
                        char out_buf[1024];
                        net_ping(cmd + idx, out_buf, 1024);
                        append_to_shell(out_buf);
                    } else {
                        append_to_shell("\nUsage: ping [ip]\nExample: ping 8.8.8.8\n");
                    }
                    append_to_shell("sunset-OS:~$ ");
                } else if (cmd[0] == 'f' && cmd[1] == 'e' && cmd[2] == 't' && cmd[3] == 'c' && cmd[4] == 'h') {
                    int idx = 5;
                    while (cmd[idx] == ' ') idx++;
                    if (cmd[idx] != '\0') {
                        char out_buf[1024];
                        net_fetch(cmd + idx, out_buf, 1024);
                        append_to_shell(out_buf);
                    } else {
                        append_to_shell("\nUsage: fetch [url]\nExample: fetch sunset://rest\n");
                    }
                    append_to_shell("sunset-OS:~$ ");
                } else if (cmd[0] == 'c' && cmd[1] == 'l' && cmd[2] == 'e' && cmd[3] == 'a' && cmd[4] == 'r') {
                    clear_shell();
                } else if (cmd[0] == 'c' && cmd[1] == 'h' && cmd[2] == 'i' && cmd[3] == 'm' && cmd[4] == 'e') {
                    append_to_shell("\nReplaying serene welcome chime...");
                    play_startup_chime();
                    append_to_shell("\nsunset-OS:~$ ");
                } else if (cmd[0] == 'p' && cmd[1] == 'l' && cmd[2] == 'a' && cmd[3] == 'y') {
                    // play [freq] [ms]
                    int idx = 5;
                    unsigned int freq = 0;
                    unsigned int ms = 0;
                    while (cmd[idx] >= '0' && cmd[idx] <= '9') {
                        freq = freq * 10 + (cmd[idx] - '0');
                        idx++;
                    }
                    if (cmd[idx] == ' ') idx++;
                    while (cmd[idx] >= '0' && cmd[idx] <= '9') {
                        ms = ms * 10 + (cmd[idx] - '0');
                        idx++;
                    }
                    if (freq > 0 && ms > 0) {
                        play_tone(freq);
                        sleep_ms(ms);
                        stop_tone();
                        append_to_shell("\nTone played successfully.");
                    } else {
                        append_to_shell("\nUsage: play [freq_hz] [duration_ms]\nExample: play 440 200");
                    }
                    append_to_shell("\nsunset-OS:~$ ");
                } else if (cmd[0] == 'a' && cmd[1] == 'b' && cmd[2] == 'o' && cmd[3] == 'u' && cmd[4] == 't') {
                    append_to_shell("\nSUNSET OS naming philosophy:\nInspired by daily sunset walks between Asr and Maghrib.\nA restorative time that refreshes, motivates, and inspires.\nDesigned for serene focus.");
                    append_to_shell("\nsunset-OS:~$ ");
                } else if (cmd[0] == 'h' && cmd[1] == 'i' && cmd[2] == 's' && cmd[3] == 't' && cmd[4] == 'o' && cmd[5] == 'r' && cmd[6] == 'y') {
                    append_to_shell("\nRecent Command History Logs:");
                    int start = (history_count > 5) ? (history_count - 5) : 0;
                    for (int h = start; h < history_count; h++) {
                        append_to_shell("\n- ");
                        append_to_shell(cmd_history[h % 5]);
                    }
                    append_to_shell("\nsunset-OS:~$ ");
                } else if (cmd[0] == 'a' && cmd[1] == 'm' && cmd[2] == 'b' && cmd[3] == 'i' && cmd[4] == 'e' && cmd[5] == 'n' && cmd[6] == 't') {
                    append_to_shell("\nInitiating breathing Ambient OS Mode...");
                    is_ambient = 1;
                    idle_timer = 500000; // Trigger threshold instantly
                } else if (cmd[0] == 'g' && cmd[1] == 'a' && cmd[2] == 'r' && cmd[3] == 'd' && cmd[4] == 'e' && cmd[5] == 'n') {
                    append_to_shell("\nSpawning Zen Garden sandbox window...");
                    show_garden = 1;
                    win_diag.active = 0;
                    win_notes.active = 0;
                    win_shell.active = 0;
                    win_garden.active = 1;
                    draw_garden_content(garden_buffer);
                    append_to_shell("\nsunset-OS:~$ ");
                } else if (cmd[0] == 'n' && cmd[1] == 'o' && cmd[2] == 't' && cmd[3] == 'e') {
                    int idx = 4;
                    while (cmd[idx] == ' ') idx++;
                    if (cmd[idx] != '\0') {
                        int notes_len = 0;
                        while (notes_buffer[notes_len] != '\0') {
                            notes_len++;
                        }
                        if (notes_len < 900) {
                            notes_buffer[notes_len++] = '\n';
                            notes_buffer[notes_len++] = '-';
                            notes_buffer[notes_len++] = ' ';
                            int k = idx;
                            while (cmd[k] != '\0' && notes_len < 1020) {
                                notes_buffer[notes_len++] = cmd[k++];
                            }
                            notes_buffer[notes_len] = '\0';
                            append_to_shell("\nNote appended to Calm Notes.");
                        } else {
                            append_to_shell("\nNotes buffer is full.");
                        }
                    } else {
                        append_to_shell("\nUsage: note [message]\nExample: note take a deep breath");
                    }
                    append_to_shell("\nsunset-OS:~$ ");
                } else if (cmd[0] == 'l' && cmd[1] == 'o' && cmd[2] == 'f' && cmd[3] == 'i') {
                    int idx = 4;
                    while (cmd[idx] == ' ') idx++;
                    int preset = cmd[idx] - '0';
                    if (preset == 1) {
                        append_to_shell("\nPlaying tranquility arpeggio...");
                        play_tone(440); sleep_ms(150);
                        play_tone(554); sleep_ms(150);
                        play_tone(659); sleep_ms(150);
                        play_tone(880); sleep_ms(250);
                        stop_tone();
                    } else if (preset == 2) {
                        append_to_shell("\nPlaying serenity breeze...");
                        play_tone(523); sleep_ms(150);
                        play_tone(659); sleep_ms(150);
                        play_tone(784); sleep_ms(150);
                        play_tone(1046); sleep_ms(250);
                        stop_tone();
                    } else if (preset == 3) {
                        append_to_shell("\nPlaying golden sunset chord...");
                        play_tone(349); sleep_ms(150);
                        play_tone(440); sleep_ms(150);
                        play_tone(523); sleep_ms(150);
                        play_tone(698); sleep_ms(250);
                        stop_tone();
                    } else {
                        append_to_shell("\nUsage: lofi [1-3]\nPresets: 1 (Tranquility), 2 (Serenity), 3 (Golden Sunset)");
                    }
                    append_to_shell("\nsunset-OS:~$ ");
                } else if (cmd[0] == 'p' && cmd[1] == 'a' && cmd[2] == 'n' && cmd[3] == 'i' && cmd[4] == 'c') {
                    kpanic("USER TRIGGERED CORE EXCEPTION PANIC");
                } else {
                    append_to_shell("\n[Error] Unknown command. Type 'help'");
                    append_to_shell("\nsunset-OS:~$ ");
                }
            } else {
                // Append normal characters
                if (shell_len < 240) {
                    shell_buffer[shell_len++] = ascii;
                    shell_buffer[shell_len] = '\0';
                }
            }
            
            // Keep shell window console content updated
            win_shell.content = shell_buffer;
        }

        // -------------------------------------------------------------
        // II. SYSTEM AND GRAPHICS STATE HANDLERS
        // -------------------------------------------------------------
        
        // Idle detection: 50,000 loop ticks without updates switches to Ambient OS Mode
        if (idle_timer > 50000) {
            is_ambient = 1;
        }

        if (is_ambient) {
            // 1. Calculate linear Breathing gradient offsets
            if (breathing_up) {
                ambient_shift++;
                if (ambient_shift > 45) breathing_up = 0;
            } else {
                ambient_shift--;
                if (ambient_shift < -45) breathing_up = 1;
            }
            
            // 2. Render relaxing sky gradient shift offscreen
            draw_gradient(ambient_shift);
            
            // 3. Render gorgeous breathing quote center-card overlay
            draw_rect(100, 200, 600, 180, 255, 255, 255);
            draw_rect(102, 202, 596, 176, 30, 25, 35); // Dark Purple card body
            
            draw_rect_outline(101, 201, 598, 178, 227, 133, 53); // Glowing gold borders
            
            draw_string("  NATURAL SYSTEM STATE: CALMING ACTIVE SLEEP CYCLE", 130, 225, 227, 133, 53);
            draw_string("\"Nature does not hurry, yet everything is accomplished.\"", 130, 265, 255, 255, 255);
            draw_string("                       - Lao Tzu", 130, 285, 245, 235, 230);
            
            draw_string("Press any key or move the mouse to wake Sunset OS.", 130, 335, 120, 200, 255);
            
            // Sleep / HLT brief delay to reduce CPU heat in idle states
            __asm__ volatile("hlt");
        } else {
            // 1. Dragging mechanics collisions logic
            handle_window_dragging(&win_diag, mouse_x, mouse_y, mouse_left_clicked);
            handle_window_dragging(&win_notes, mouse_x, mouse_y, mouse_left_clicked);
            handle_window_dragging(&win_shell, mouse_x, mouse_y, mouse_left_clicked);
            if (show_garden) {
                handle_window_dragging(&win_garden, mouse_x, mouse_y, mouse_left_clicked);
            }

            // 2. Window active focus layering sorting
            if (mouse_left_clicked) {
                if (win_diag.is_dragging) {
                    win_diag.active = 1;
                    win_notes.active = 0;
                    win_shell.active = 0;
                    win_garden.active = 0;
                } else if (win_notes.is_dragging) {
                    win_diag.active = 0;
                    win_notes.active = 1;
                    win_shell.active = 0;
                    win_garden.active = 0;
                } else if (win_shell.is_dragging) {
                    win_diag.active = 0;
                    win_notes.active = 0;
                    win_shell.active = 1;
                    win_garden.active = 0;
                } else if (show_garden && win_garden.is_dragging) {
                    win_diag.active = 0;
                    win_notes.active = 0;
                    win_shell.active = 0;
                    win_garden.active = 1;
                }
            }

            // 3. Clear offscreen back-buffer rendering sunset gradient
            draw_gradient(0);

            // 4. Render Windows based on focus order (Active window draws last on top)
            if (win_shell.active) {
                draw_window(&win_diag);
                draw_window(&win_notes);
                if (show_garden) draw_window(&win_garden);
                draw_window(&win_shell);
            } else if (win_notes.active) {
                draw_window(&win_diag);
                draw_window(&win_shell);
                if (show_garden) draw_window(&win_garden);
                draw_window(&win_notes);
            } else if (show_garden && win_garden.active) {
                draw_window(&win_diag);
                draw_window(&win_notes);
                draw_window(&win_shell);
                draw_window(&win_garden);
            } else {
                draw_window(&win_shell);
                draw_window(&win_notes);
                if (show_garden) draw_window(&win_garden);
                draw_window(&win_diag);
            }

            // 5. Draw visual bottom desktop Taskbar (Charcoal-purple bar)
            draw_rect(0, 560, 800, 40, 22, 18, 25);
            draw_rect(0, 558, 800, 2, 255, 255, 255); // Top glow line
            
            draw_string("🌅 Sunset OS v0.4", 20, 574, 227, 133, 53);
            draw_string("Mode: VESA 800x600x24", 230, 574, 245, 235, 230);
            draw_string("Kernel: Ring 0 Core", 460, 574, 120, 220, 160);
            draw_string("Active Shell", 680, 574, 255, 255, 255);

            // 6. Plot mouse pointer overlay on top of everything
            draw_mouse_pointer();
        }

        // 7. Flush offscreen 1.44 MB buffer to physical Linear Frame Buffer (LFB)
        flush_buffer();

        // 8. Regulation delay
        delay(8000);
    }
}
