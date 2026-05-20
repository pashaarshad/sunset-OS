/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — LAZ Kernel Main Coordinator
 * File: kernel.c
 * Author: Arshad Pasha
 * Description: High-performance 32-bit modular freestanding graphics kernel.
 * ===================================================================== */

#include "memory.h"
#include "graphics.h"
#include "font.h"
#include "mouse.h"
#include "window.h"

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

// Low-level hardware reading port wrapper
static inline unsigned char inb(unsigned short port) {
    unsigned char result;
    __asm__ volatile("in %%dx, %%al" : "=a" (result) : "d" (port));
    return result;
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

    // 2. Initialize VESA graphics drivers
    init_graphics((unsigned char*)vesa_framebuffer);

    // 3. Initialize auxiliary hardware Mouse driver
    init_mouse();

    // 4. Set up interactive windows
    Window win_diag;
    Window win_notes;
    Window win_shell;

    init_window(&win_diag, 40, 70, 320, 210, "System Diagnostics", 
                "LAZ KERNEL DIAGNOSTICS:\n"
                "- Rings: Ring 0 Privilege\n"
                "- CPU: 32-bit Protected x86\n"
                "- Allocator: kmalloc Heap Ok\n"
                "- Framebuffer: 800x600 LFB\n"
                "- Display: VESA VBE 1.2 Ok\n"
                "- Graphics Buffer: Offscreen\n"
                "- Double-buffering: Active\n"
                "- Device: PS/2 Mouse Polled\n"
                "- Build Pipeline: Modular PE");

    init_window(&win_notes, 440, 70, 320, 210, "Calm Notes",
                "WELCOME TO SUNSET OS\n"
                "Watching natural sunsets brings\n"
                "peace, motivation and focus.\n\n"
                "LAZ Kernel is designed to remove\n"
                "distractions, letting you work\n"
                "in a serene computing environment.\n\n"
                "Breathe in. Rest. Reflect.");

    clear_shell();
    init_window(&win_shell, 180, 300, 440, 220, "Sunset Shell Interface", shell_buffer);
    win_shell.active = 1; // Shell window active at boot

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

        // 2. Poll and update Keyboard input
        // Status Register port 0x64: Bit 0 set = keyboard key data ready
        // Bit 5 must be 0 (ensures key data is from keyboard, not mouse)
        if ((inb(0x64) & 0x21) == 0x01) {
            unsigned char scancode = inb(0x60);
            
            // Handle keydown releases
            if (scancode < 0x80) {
                idle_timer = 0;
                is_ambient = 0;
                
                char ascii = scancode_to_ascii[scancode];
                if (ascii != 0) {
                    if (ascii == '\b') {
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
                        
                        // Process shell commands
                        if (cmd_idx == 0) {
                            append_to_shell("\nsunset-OS:~$ ");
                        } else if (cmd[0] == 'h' && cmd[1] == 'e' && cmd[2] == 'l' && cmd[3] == 'p') {
                            append_to_shell("\nCommands: help, clear, ambient, panic");
                            append_to_shell("\nsunset-OS:~$ ");
                        } else if (cmd[0] == 'c' && cmd[1] == 'l' && cmd[2] == 'e' && cmd[3] == 'a' && cmd[4] == 'r') {
                            clear_shell();
                        } else if (cmd[0] == 'a' && cmd[1] == 'm' && cmd[2] == 'b' && cmd[3] == 'i' && cmd[4] == 'e' && cmd[5] == 'n' && cmd[6] == 't') {
                            append_to_shell("\nInitiating breathing Ambient OS Mode...");
                            is_ambient = 1;
                            idle_timer = 500000; // Trigger threshold instantly
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
            }
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

            // 2. Window active focus layering sorting
            if (mouse_left_clicked) {
                if (win_diag.is_dragging) {
                    win_diag.active = 1;
                    win_notes.active = 0;
                    win_shell.active = 0;
                } else if (win_notes.is_dragging) {
                    win_diag.active = 0;
                    win_notes.active = 1;
                    win_shell.active = 0;
                } else if (win_shell.is_dragging) {
                    win_diag.active = 0;
                    win_notes.active = 0;
                    win_shell.active = 1;
                }
            }

            // 3. Clear offscreen back-buffer rendering sunset gradient
            draw_gradient(0);

            // 4. Render Windows based on focus order (Active window draws last on top)
            if (win_shell.active) {
                draw_window(&win_diag);
                draw_window(&win_notes);
                draw_window(&win_shell);
            } else if (win_notes.active) {
                draw_window(&win_diag);
                draw_window(&win_shell);
                draw_window(&win_notes);
            } else {
                draw_window(&win_shell);
                draw_window(&win_notes);
                draw_window(&win_diag);
            }

            // 5. Draw visual bottom desktop Taskbar (Charcoal-purple bar)
            draw_rect(0, 560, 800, 40, 22, 18, 25);
            draw_rect(0, 558, 800, 2, 255, 255, 255); // Top glow line
            
            draw_string("🌅 Sunset OS v0.3", 20, 574, 227, 133, 53);
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
