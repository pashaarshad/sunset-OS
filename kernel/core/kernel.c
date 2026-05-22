/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — LAZ Kernel Main Coordinator
 * File: kernel.c
 * Author: Arshad Pasha
 * Copyright (c) 2026 Arshad Pasha. All Rights Reserved.
 * License: Private. Authorized use only under the Sunset OS License Agreement.
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
#include "vfs.h"
#include "../drivers/rtc.h"

// Scancode to US Keyboard ASCII mapping array (32-bit flat compatible)
static const char scancode_to_ascii[] = {
    0,  27, '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '\b',
    '\t', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\n',
    0, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', '`', 0, '\\',
    'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 0, '*', 0, ' '
};

// Shifted scancode map: Shift held — uppercase letters and symbol characters
static const char scancode_to_ascii_shifted[] = {
    0,  27, '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '\b',
    '\t', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '\n',
    0, 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', '~', 0, '|',
    'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 0, '*', 0, ' '
};

// Global interactive shell buffer states
static char shell_buffer[2048];
static int shell_len = 0;

static char garden_buffer[512];
static char notes_buffer[1024];
static char show_garden = 0;
static char cwd[32] = "";

static void helper_strcpy(char* dest, const char* src) {
    int i = 0;
    while (src[i] != '\0') {
        dest[i] = src[i];
        i++;
    }
    dest[i] = '\0';
}

static void format_time_string(int h, int m, int s, char* out) {
    out[0] = '[';
    out[1] = '0' + (h / 10);
    out[2] = '0' + (h % 10);
    out[3] = ':';
    out[4] = '0' + (m / 10);
    out[5] = '0' + (m % 10);
    out[6] = ':';
    out[7] = '0' + (s / 10);
    out[8] = '0' + (s % 10);
    out[9] = ']';
    out[10] = ' ';
    out[11] = 'O';
    out[12] = 'N';
    out[13] = 'L';
    out[14] = 'I';
    out[15] = 'N';
    out[16] = 'E';
    out[17] = '\0';
}

// Context memory history buffer
static char cmd_history[5][32];
static int history_count = 0;
static int history_nav_idx = 0; // Tracks current position for Up/Down arrow navigation

// Keyboard modifier state flags
static volatile char shift_pressed = 0;  // Left or Right Shift is held
static volatile char caps_lock    = 0;  // Caps Lock toggle state
static volatile char extended_key = 0;  // 0xE0 prefix seen (arrow/function keys)

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

        // ── Extended key prefix (E0 h) — arrow keys, Insert, Delete, etc.
        if (scancode == 0xE0) {
            extended_key = 1;
            return;
        }

        // ── Handle extended key follow-up
        if (extended_key) {
            extended_key = 0;
            if (scancode == 0x48) { // Up arrow → history-previous signal
                int next = (keyboard_head + 1) % KEYBOARD_BUFFER_SIZE;
                if (next != keyboard_tail) {
                    keyboard_queue[keyboard_head] = 0x01; // Internal: history up
                    keyboard_head = next;
                }
            } else if (scancode == 0x50) { // Down arrow → history-next signal
                int next = (keyboard_head + 1) % KEYBOARD_BUFFER_SIZE;
                if (next != keyboard_tail) {
                    keyboard_queue[keyboard_head] = 0x02; // Internal: history down
                    keyboard_head = next;
                }
            }
            return;
        }

        // ── Shift key press / release (Left=0x2A/0xAA, Right=0x36/0xB6)
        if (scancode == 0x2A || scancode == 0x36) { shift_pressed = 1; return; }
        if (scancode == 0xAA || scancode == 0xB6) { shift_pressed = 0; return; }

        // ── Caps Lock toggle (scancode 0x3A)
        if (scancode == 0x3A) { caps_lock = !caps_lock; return; }

        // ── Process make-codes (key-down, < 0x80)
        if (scancode < 0x80 && scancode < 58) {
            // Effective shift: Caps Lock inverts shift only for letter scancodes (0x10–0x32)
            char eff_shift = shift_pressed;
            if (caps_lock && scancode >= 0x10 && scancode <= 0x32) {
                eff_shift = !shift_pressed;
            }

            char ascii = eff_shift
                ? scancode_to_ascii_shifted[scancode]
                : scancode_to_ascii[scancode];

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

// Sakura falling animation coordinate states (thread-safe volatile)
static volatile int global_sakura_x = 750;
static volatile int global_sakura_y = 50;

static unsigned int mystrlen(const char* str) {
    unsigned int len = 0;
    while (str[len] != '\0') {
        len++;
    }
    return len;
}

static void append_to_shell(const char* str);

static void build_prompt(char* out) {
    helper_strcpy(out, "ghuroob@sunset:/");
    int len = mystrlen(out);
    if (cwd[0] != '\0') {
        helper_strcpy(out + len, cwd);
        len = mystrlen(out);
    }
    helper_strcpy(out + len, "$ ");
}

static int get_prompt_len() {
    return 17 + mystrlen(cwd);
}

static void append_prompt_to_shell() {
    append_to_shell("\n");
    char prompt[64];
    build_prompt(prompt);
    append_to_shell(prompt);
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

static int sh_strcmp(const char* s1, const char* s2) {
    int i = 0;
    while (s1[i] != '\0' && s2[i] != '\0') {
        if (s1[i] != s2[i]) return s1[i] - s2[i];
        i++;
    }
    return s1[i] - s2[i];
}

static int sh_strncmp(const char* s1, const char* s2, int n) {
    for (int i = 0; i < n; i++) {
        if (s1[i] == '\0' || s2[i] == '\0') {
            if (s1[i] != s2[i]) return s1[i] - s2[i];
            break;
        }
        if (s1[i] != s2[i]) return s1[i] - s2[i];
    }
    return 0;
}

static int find_last_prompt_pos() {
    const char* p = "ghuroob@sunset:";
    int p_len = 15;
    for (int k = shell_len - p_len; k >= 0; k--) {
        char match = 1;
        for (int p_idx = 0; p_idx < p_len; p_idx++) {
            if (shell_buffer[k + p_idx] != p[p_idx]) {
                match = 0;
                break;
            }
        }
        if (match) return k;
    }
    return 0;
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
    
    memcpy(diag_buffer + mystrlen(diag_buffer), "- Active Tasks: 4\n", 18);
    memcpy(diag_buffer + mystrlen(diag_buffer), "  [1] Desktop GUI (Core)\n", 25);
    memcpy(diag_buffer + mystrlen(diag_buffer), "  [2] Melody Loop (Sound)\n", 26);
    memcpy(diag_buffer + mystrlen(diag_buffer), "  [3] System Monitor (Active)\n", 30);
    memcpy(diag_buffer + mystrlen(diag_buffer), "  [4] Sakura Anim (Drifting)\n", 29);
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

// Task 3: Background Sakura Petal falling/drifting animation thread
void sakura_anim_task() {
    int sakura_y = 50;
    int sakura_x = 750;
    while (1) {
        sleep_ms(120); // Cooperative scheduler sleep
        
        // Update sakura position drifting downwards and left
        sakura_y += 3;
        sakura_x -= 2;
        
        // Wrap around boundaries
        if (sakura_y > 550 || sakura_x < 50) {
            sakura_y = 50;
            sakura_x = 750;
        }
        
        // Store coordinates thread-safely
        global_sakura_x = sakura_x;
        global_sakura_y = sakura_y;
    }
}

static void clear_shell() {
    memset(shell_buffer, 0, 2048);
    memcpy(shell_buffer, "[SunsetSH] Serene Active Workspace.\n", 36);
    shell_len = 36;
    char prompt[64];
    build_prompt(prompt);
    int p_len = mystrlen(prompt);
    memcpy(shell_buffer + shell_len, prompt, p_len);
    shell_len += p_len;
    shell_buffer[shell_len] = '\0';
}

static void append_to_shell(const char* str) {
    for (int i = 0; str[i] != '\0' && shell_len < 2000; i++) {
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

    // 3.5 Initialize Virtual File System RAM Disk
    vfs_init();

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

        // Clear quote area and cycle peaceful sunset quotes
        draw_rect(210, 360, 380, 30, 30, 25, 35);
        if (p < 20) {
            draw_string("\"Sunset reminds us tomorrow is another opportunity.\"", 208, 360, 245, 235, 230);
        } else if (p < 40) {
            draw_string("\"Peace is the beauty of life. It is sunshine.\"", 220, 360, 245, 235, 230);
        } else if (p < 60) {
            draw_string("\"Rest when you are weary. Refresh yourself.\"", 232, 360, 245, 235, 230);
        } else if (p < 80) {
            draw_string("\"Breathe in the calm. Let go of the noise.\"", 236, 360, 245, 235, 230);
        } else {
            draw_string("\"Every sunset brings the promise of a new dawn.\"", 216, 360, 245, 235, 230);
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
    create_task(sakura_anim_task, "Sakura Anim");

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

    vfs_write("notes.txt", "",
                "WELCOME TO SUNSET OS\n"
                "Watching natural sunsets brings\n"
                "peace, motivation and focus.\n\n"
                "LAZ Kernel is designed to remove\n"
                "distractions, letting you work\n"
                "in a serene computing environment.\n\n"
                "Breathe in. Rest. Reflect.");
    vfs_read("notes.txt", "", notes_buffer, 1024);
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

            // ── Up arrow: recall previous command from history
            } else if (ascii == 0x01) {
                if (history_count > 0 && history_nav_idx > 0) {
                    history_nav_idx--;
                    int last_prompt = find_last_prompt_pos();
                    shell_len = last_prompt + get_prompt_len();
                    shell_buffer[shell_len] = '\0';
                    append_to_shell(cmd_history[history_nav_idx % 5]);
                }

            // ── Down arrow: recall newer command from history
            } else if (ascii == 0x02) {
                if (history_nav_idx < history_count) {
                    history_nav_idx++;
                    int last_prompt = find_last_prompt_pos();
                    shell_len = last_prompt + get_prompt_len();
                    shell_buffer[shell_len] = '\0';
                    if (history_nav_idx < history_count) {
                        append_to_shell(cmd_history[history_nav_idx % 5]);
                    }
                }

            // ── Tab: smart autocomplete (command name or VFS filename)
            } else if (ascii == '\t') {
                int last_prompt = find_last_prompt_pos();
                int cmd_start  = last_prompt + get_prompt_len();
                if (shell_len > cmd_start) {
                    char partial[64];
                    int p_len = 0;
                    for (int k = cmd_start; k < shell_len && p_len < 63; k++) {
                        partial[p_len++] = shell_buffer[k];
                    }
                    partial[p_len] = '\0';

                    // Find first space → decides command vs. filename completion
                    int space_pos = -1;
                    for (int j = 0; j < p_len; j++) {
                        if (partial[j] == ' ') { space_pos = j; break; }
                    }

                    if (space_pos == -1) {
                        // Complete a command name
                        const char* cmds[] = {
                            "help", "clear", "ambient", "panic", "about", "chime",
                            "play", "history", "ifconfig", "ping", "fetch", "garden",
                            "note", "lofi", "ls", "cat", "touch", "write", "rm",
                            "mkdir", "cd", "pwd", "time", 0
                        };
                        const char* hit = 0; int cnt = 0;
                        for (int c = 0; cmds[c] != 0; c++) {
                            int ok = 1;
                            for (int j = 0; j < p_len; j++) {
                                if (cmds[c][j] == '\0' || cmds[c][j] != partial[j]) { ok=0; break; }
                            }
                            if (ok) { hit = cmds[c]; cnt++; }
                        }
                        if (cnt == 1 && hit) {
                            shell_len = cmd_start;
                            shell_buffer[shell_len] = '\0';
                            append_to_shell(hit);
                        }
                    } else {
                        // Complete a VFS filename after the command + space
                        char file_partial[32];
                        int fp_len = 0;
                        for (int j = space_pos + 1; j < p_len && fp_len < 31; j++) {
                            file_partial[fp_len++] = partial[j];
                        }
                        file_partial[fp_len] = '\0';
                        char matched_file[32];
                        int matches = vfs_find_prefix(cwd, file_partial, matched_file, 32);
                        if (matches == 1) {
                            // Erase the partial filename, write the completed one
                            shell_len = cmd_start + space_pos + 1;
                            shell_buffer[shell_len] = '\0';
                            append_to_shell(matched_file);
                        }
                    }
                }

            } else if (ascii == '\b') {
                int last_prompt = find_last_prompt_pos();
                if (shell_len > last_prompt + get_prompt_len()) {
                    shell_len--;
                    shell_buffer[shell_len] = '\0';
                }
            } else if (ascii == '\n') {
                // Extract typed command
                char cmd[128];
                int cmd_idx = 0;
                int last_prompt = find_last_prompt_pos();
                int cmd_start = last_prompt + get_prompt_len();
                for (int k = cmd_start; k < shell_len && cmd_idx < 120; k++) {
                    cmd[cmd_idx++] = shell_buffer[k];
                }
                cmd[cmd_idx] = '\0';

                // Save non-empty commands to history log
                if (cmd_idx > 0 && cmd_idx < 30) {
                    memcpy(cmd_history[history_count % 5], cmd, cmd_idx);
                    cmd_history[history_count % 5][cmd_idx] = '\0';
                    history_count++;
                    history_nav_idx = history_count; // Reset nav pointer to end
                }
                
                // Process shell commands
                if (cmd_idx == 0) {
                    append_prompt_to_shell();
                } else if (sh_strcmp(cmd, "help") == 0) {
                    append_to_shell("\nCommands: help, clear, ambient, panic,\n          about, chime, play, history,\n          ifconfig, ping [ip], fetch [url],\n          garden, note [msg], lofi [1-3],\n          ls, cd [dir], cd .., mkdir [dir],\n          pwd, cat [file], touch [file],\n          write [file] [txt], rm [file],\n          time");
                    append_prompt_to_shell();
                } else if (sh_strcmp(cmd, "ls") == 0) {
                    char file_list[512];
                    vfs_list(cwd, file_list, 512);
                    append_to_shell(file_list);
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "cat ", 4) == 0) {
                    const char* filename = cmd + 4;
                    while (*filename == ' ') filename++;
                    char file_content[512];
                    if (vfs_read(filename, cwd, file_content, 512)) {
                        append_to_shell("\n");
                        append_to_shell(file_content);
                        append_to_shell("\n");
                    } else {
                        append_to_shell("\n[Error] File not found: ");
                        append_to_shell(filename);
                        append_to_shell("\n");
                    }
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "touch ", 6) == 0) {
                    const char* filename = cmd + 6;
                    while (*filename == ' ') filename++;
                    if (vfs_write(filename, cwd, "")) {
                        append_to_shell("\n[OK] File created: ");
                        append_to_shell(filename);
                        append_to_shell("\n");
                    } else {
                        append_to_shell("\n[Error] Failed to create file.\n");
                    }
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "write ", 6) == 0) {
                    const char* p_arg = cmd + 6;
                    while (*p_arg == ' ') p_arg++;
                    
                    char filename[32];
                    int fn_idx = 0;
                    while (*p_arg != '\0' && *p_arg != ' ' && fn_idx < 31) {
                        filename[fn_idx++] = *p_arg++;
                    }
                    filename[fn_idx] = '\0';
                    
                    while (*p_arg == ' ') p_arg++;
                    
                    if (filename[0] != '\0') {
                        const char* content = p_arg;
                        if (*content == '"') {
                            content++;
                            char temp_content[512];
                            int tc_idx = 0;
                            while (*content != '\0' && *content != '"' && tc_idx < 511) {
                                temp_content[tc_idx++] = *content++;
                            }
                            temp_content[tc_idx] = '\0';
                            if (vfs_write(filename, cwd, temp_content)) {
                                append_to_shell("\n[OK] Wrote to ");
                                append_to_shell(filename);
                                append_to_shell("\n");
                                if (sh_strcmp(filename, "notes.txt") == 0 && cwd[0] == '\0') {
                                    vfs_read("notes.txt", "", notes_buffer, 1024);
                                    win_notes.content = notes_buffer;
                                }
                            } else {
                                append_to_shell("\n[Error] Write failed.\n");
                            }
                        } else {
                            if (vfs_write(filename, cwd, content)) {
                                append_to_shell("\n[OK] Wrote to ");
                                append_to_shell(filename);
                                append_to_shell("\n");
                                if (sh_strcmp(filename, "notes.txt") == 0 && cwd[0] == '\0') {
                                    vfs_read("notes.txt", "", notes_buffer, 1024);
                                    win_notes.content = notes_buffer;
                                }
                            } else {
                                append_to_shell("\n[Error] Write failed.\n");
                            }
                        }
                    } else {
                        append_to_shell("\nUsage: write [file] [text]\n");
                    }
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "rm ", 3) == 0) {
                    const char* filename = cmd + 3;
                    while (*filename == ' ') filename++;
                    if (vfs_delete(filename, cwd)) {
                        append_to_shell("\n[OK] File deleted: ");
                        append_to_shell(filename);
                        append_to_shell("\n");
                        if (sh_strcmp(filename, "notes.txt") == 0 && cwd[0] == '\0') {
                            notes_buffer[0] = '\0';
                            win_notes.content = notes_buffer;
                        }
                    } else {
                        append_to_shell("\n[Error] File not found.\n");
                    }
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "mkdir ", 6) == 0) {
                    const char* dirname = cmd + 6;
                    while (*dirname == ' ') dirname++;
                    if (dirname[0] != '\0') {
                        if (vfs_mkdir(dirname, cwd)) {
                            append_to_shell("\n[OK] Directory created: ");
                            append_to_shell(dirname);
                            append_to_shell("\n");
                        } else {
                            append_to_shell("\n[Error] Failed to create directory.\n");
                        }
                    } else {
                        append_to_shell("\nUsage: mkdir [directory_name]\n");
                    }
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "cd ", 3) == 0 || sh_strcmp(cmd, "cd") == 0) {
                    const char* dirname = "";
                    if (sh_strncmp(cmd, "cd ", 3) == 0) {
                        dirname = cmd + 3;
                        while (*dirname == ' ') dirname++;
                    }
                    
                    if (dirname[0] == '\0' || sh_strcmp(dirname, "/") == 0) {
                        cwd[0] = '\0';
                        append_prompt_to_shell();
                    } else if (sh_strcmp(dirname, "..") == 0) {
                        cwd[0] = '\0'; // flat parent back-to-root
                        append_prompt_to_shell();
                    } else {
                        if (vfs_dir_exists(dirname, cwd)) {
                            helper_strcpy(cwd, dirname);
                            append_prompt_to_shell();
                        } else {
                            append_to_shell("\n[Error] Directory not found: ");
                            append_to_shell(dirname);
                            append_prompt_to_shell();
                        }
                    }
                } else if (sh_strcmp(cmd, "pwd") == 0) {
                    append_to_shell("\n/");
                    if (cwd[0] != '\0') {
                        append_to_shell(cwd);
                    }
                    append_prompt_to_shell();
                } else if (sh_strcmp(cmd, "time") == 0) {
                    int h, m, s, dy, mo, yr;
                    rtc_get_time(&h, &m, &s, &dy, &mo, &yr);
                    
                    append_to_shell("\nDate: 20");
                    char yr_str[8];
                    uint_to_str(yr, yr_str);
                    if (yr < 10) append_to_shell("0");
                    append_to_shell(yr_str);
                    append_to_shell("-");
                    
                    char mo_str[8];
                    uint_to_str(mo, mo_str);
                    if (mo < 10) append_to_shell("0");
                    append_to_shell(mo_str);
                    append_to_shell("-");
                    
                    char dy_str[8];
                    uint_to_str(dy, dy_str);
                    if (dy < 10) append_to_shell("0");
                    append_to_shell(dy_str);
                    
                    append_to_shell(" | Time: ");
                    
                    char h_str[8];
                    uint_to_str(h, h_str);
                    if (h < 10) append_to_shell("0");
                    append_to_shell(h_str);
                    append_to_shell(":");
                    
                    char m_str[8];
                    uint_to_str(m, m_str);
                    if (m < 10) append_to_shell("0");
                    append_to_shell(m_str);
                    append_to_shell(":");
                    
                    char s_str[8];
                    uint_to_str(s, s_str);
                    if (s < 10) append_to_shell("0");
                    append_to_shell(s_str);
                    
                    append_to_shell(" UTC/Local\n");
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "note ", 5) == 0 || sh_strcmp(cmd, "note") == 0) {
                    const char* msg = cmd + 4;
                    if (sh_strncmp(cmd, "note ", 5) == 0) msg = cmd + 5;
                    while (*msg == ' ') msg++;
                    
                    if (*msg != '\0') {
                        char current_notes[1024];
                        memset(current_notes, 0, 1024);
                        vfs_read("notes.txt", "", current_notes, 1024);
                        
                        int cur_len = mystrlen(current_notes);
                        if (cur_len < 900) {
                            if (cur_len > 0) {
                                current_notes[cur_len++] = '\n';
                                current_notes[cur_len++] = '-';
                                current_notes[cur_len++] = ' ';
                            } else {
                                current_notes[cur_len++] = '-';
                                current_notes[cur_len++] = ' ';
                            }
                            int k = 0;
                            while (msg[k] != '\0' && cur_len < 1020) {
                                current_notes[cur_len++] = msg[k++];
                            }
                            current_notes[cur_len] = '\0';
                            
                            vfs_write("notes.txt", "", current_notes);
                            vfs_read("notes.txt", "", notes_buffer, 1024);
                            win_notes.content = notes_buffer;
                            append_to_shell("\n[OK] Note appended and synced to notes.txt");
                        } else {
                            append_to_shell("\nNotes buffer is full.");
                        }
                    } else {
                        append_to_shell("\nUsage: note [message]\nExample: note take a deep breath");
                    }
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "lofi ", 5) == 0 || sh_strcmp(cmd, "lofi") == 0) {
                    const char* p_arg = cmd + 4;
                    if (sh_strncmp(cmd, "lofi ", 5) == 0) p_arg = cmd + 5;
                    while (*p_arg == ' ') p_arg++;
                    int preset = *p_arg - '0';
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
                    append_prompt_to_shell();
                } else if (cmd[0] == 'i' && cmd[1] == 'f' && cmd[2] == 'c' && cmd[3] == 'o' && cmd[4] == 'n' && cmd[5] == 'f' && cmd[6] == 'i' && cmd[7] == 'g') {
                    char out_buf[1024];
                    net_ifconfig(out_buf, 1024);
                    append_to_shell(out_buf);
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "ping ", 5) == 0) {
                    const char* ip = cmd + 5;
                    while (*ip == ' ') ip++;
                    if (*ip != '\0') {
                        char out_buf[1024];
                        net_ping(ip, out_buf, 1024);
                        append_to_shell(out_buf);
                    } else {
                        append_to_shell("\nUsage: ping [ip]\nExample: ping 8.8.8.8\n");
                    }
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "fetch ", 6) == 0) {
                    const char* url = cmd + 6;
                    while (*url == ' ') url++;
                    if (*url != '\0') {
                        char out_buf[1024];
                        net_fetch(url, out_buf, 1024);
                        append_to_shell(out_buf);
                    } else {
                        append_to_shell("\nUsage: fetch [url]\nExample: fetch sunset://rest\n");
                    }
                    append_prompt_to_shell();
                } else if (sh_strcmp(cmd, "clear") == 0) {
                    clear_shell();
                } else if (sh_strcmp(cmd, "chime") == 0) {
                    append_to_shell("\nReplaying serene welcome chime...");
                    play_startup_chime();
                    append_prompt_to_shell();
                } else if (sh_strncmp(cmd, "play ", 5) == 0) {
                    const char* p_arg = cmd + 5;
                    while (*p_arg == ' ') p_arg++;
                    unsigned int freq = 0;
                    unsigned int ms = 0;
                    while (*p_arg >= '0' && *p_arg <= '9') {
                        freq = freq * 10 + (*p_arg - '0');
                        p_arg++;
                    }
                    if (*p_arg == ' ') p_arg++;
                    while (*p_arg >= '0' && *p_arg <= '9') {
                        ms = ms * 10 + (*p_arg - '0');
                        p_arg++;
                    }
                    if (freq > 0 && ms > 0) {
                        play_tone(freq);
                        sleep_ms(ms);
                        stop_tone();
                        append_to_shell("\nTone played successfully.");
                    } else {
                        append_to_shell("\nUsage: play [freq_hz] [duration_ms]\nExample: play 440 200");
                    }
                    append_prompt_to_shell();
                } else if (sh_strcmp(cmd, "about") == 0) {
                    append_to_shell("\nSUNSET OS naming philosophy:\nInspired by daily sunset walks between Asr and Maghrib.\nA restorative time that refreshes, motivates, and inspires.\nDesigned for serene focus.");
                    append_prompt_to_shell();
                } else if (sh_strcmp(cmd, "history") == 0) {
                    append_to_shell("\nRecent Command History Logs:");
                    int start = (history_count > 5) ? (history_count - 5) : 0;
                    for (int h = start; h < history_count; h++) {
                        append_to_shell("\n- ");
                        append_to_shell(cmd_history[h % 5]);
                    }
                    append_prompt_to_shell();
                } else if (sh_strcmp(cmd, "ambient") == 0) {
                    append_to_shell("\nInitiating breathing Ambient OS Mode...");
                    is_ambient = 1;
                    idle_timer = 500000;
                } else if (sh_strcmp(cmd, "garden") == 0) {
                    append_to_shell("\nSpawning Zen Garden sandbox window...");
                    show_garden = 1;
                    win_diag.active = 0;
                    win_notes.active = 0;
                    win_shell.active = 0;
                    win_garden.active = 1;
                    draw_garden_content(garden_buffer);
                    append_prompt_to_shell();
                } else if (sh_strcmp(cmd, "panic") == 0) {
                    kpanic("USER TRIGGERED CORE EXCEPTION PANIC");
                } else {
                    append_to_shell("\n[Error] Unknown command. Type 'help'");
                    append_prompt_to_shell();
                }
            } else {
                // Append normal characters
                if (shell_len < 2000) {
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

            // Render a delicate 5x5 drifting cherry blossom/sakura petal in the background
            int sx = global_sakura_x;
            int sy = global_sakura_y;
            draw_rect(sx + 2, sy,     2, 1, 245, 160, 190);
            draw_rect(sx + 1, sy + 1, 4, 1, 245, 150, 180);
            draw_rect(sx,     sy + 2, 5, 1, 240, 140, 175);
            draw_rect(sx + 1, sy + 3, 3, 1, 245, 150, 180);
            draw_rect(sx + 2, sy + 4, 1, 1, 245, 160, 190);

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
            
            draw_string("🌅 Sunset OS v0.5", 20, 574, 227, 133, 53);
            draw_string("Mode: VESA 800x600x24", 230, 574, 245, 235, 230);
            draw_string("Kernel: Ring 0 Core", 460, 574, 120, 220, 160);
            
            char clock_buf[32];
            int h, m, s, dy, mo, yr;
            rtc_get_time(&h, &m, &s, &dy, &mo, &yr);
            format_time_string(h, m, s, clock_buf);
            draw_string(clock_buf, 650, 574, 255, 255, 255);

            // 6. Plot mouse pointer overlay on top of everything
            draw_mouse_pointer();
        }

        // 7. Flush offscreen 1.44 MB buffer to physical Linear Frame Buffer (LFB)
        flush_buffer();

        // 8. Regulation delay
        delay(8000);
    }
}
