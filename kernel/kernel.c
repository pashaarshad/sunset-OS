/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — LAZ Kernel Core (Milestone 2)
 * File: kernel.c
 * Author: Arshad Pasha
 * Description: Low-level 32-bit freestanding kernel containing
 *              VGA display controls and an interactive Keyboard Driver.
 * ===================================================================== */

#define SCREEN_WIDTH 80
#define SCREEN_HEIGHT 25
#define VGA_ADDRESS 0xB8000

// VGA color attributes matching the sunset aesthetic
#define COLOR_LIGHT_ORANGE 0x0E // Yellow on Black
#define COLOR_DEEP_RED     0x0C // Light Red on Black
#define COLOR_GREENERY     0x0A // Light Green on Black
#define COLOR_DEFAULT      0x07 // Gray on Black

// State variables tracking cursor position
int cursor_row = 0;
int cursor_col = 0;

// Scancode to US Keyboard ASCII lookup mapping array
const char scancode_to_ascii[] = {
    0,  27, '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '\b',
    '\t', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\n',
    0, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', '`', 0, '\\',
    'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 0, '*', 0, ' '
};

// Function declarations
unsigned char inb(unsigned short port);
void outb(unsigned short port, unsigned char data);
void clear_screen(char color_attrib);
void print_char(char c, char color_attrib);
void print_string(const char* str, char color_attrib);
void handle_keyboard_input();

/* =====================================================================
 * KERNEL MAIN ENTRY POINT
 * ===================================================================== */
void kernel_main() {
    // 1. Reset VGA display
    clear_screen(COLOR_DEFAULT);

    // 2. Render welcome headers
    print_string("********************************************************************************\n", COLOR_LIGHT_ORANGE);
    print_string("*                    🌅 Welcome to Sunset OS (Ghuroob OS) 🌅                   *\n", COLOR_LIGHT_ORANGE);
    print_string("*                    Stage 2: LAZ Kernel 32-bit Core                            *\n", COLOR_DEEP_RED);
    print_string("********************************************************************************\n\n", COLOR_LIGHT_ORANGE);

    print_string("[OK] LAZ Kernel transitioned to 32-bit Protected Mode successfully.\n", COLOR_GREENERY);
    print_string("[OK] Polling keyboard controller driver active.\n", COLOR_GREENERY);
    print_string("[OK] Flat physical RAM address space mapped.\n\n", COLOR_DEFAULT);
    
    print_string("================================================================================\n", COLOR_DEEP_RED);
    print_string("Sunset Interactive Shell Console. Start typing below:\n", COLOR_LIGHT_ORANGE);
    print_string("sunset-OS:~$ ", COLOR_GREENERY);

    // 3. Keep listening for keyboard interrupts/polling
    while(1) {
        handle_keyboard_input();
    }
}

/* =====================================================================
 * LOW LEVEL HARDWARE I/O PORT WRAPPERS
 * ===================================================================== */

// inb: Reads a byte from the specified CPU I/O port address
unsigned char inb(unsigned short port) {
    unsigned char result;
    __asm__ volatile("in %%dx, %%al" : "=a" (result) : "d" (port));
    return result;
}

// outb: Writes a byte to the specified CPU I/O port address
void outb(unsigned short port, unsigned char data) {
    __asm__ volatile("out %%al, %%dx" : : "a" (data), "d" (port));
}

/* =====================================================================
 * INTERACTIVE KEYBOARD CONTROLLER DRIVER
 * ===================================================================== */
void handle_keyboard_input() {
    // Port 0x64 is the Status Register of the keyboard controller
    // Bit 0 (Output Buffer Full) is set to 1 when a key byte is available
    if (inb(0x64) & 0x01) {
        // Read raw scan code byte from Port 0x60
        unsigned char scancode = inb(0x60);
        
        // If Bit 7 is clear (scancode < 0x80), it means the key is pressed (Key Down)
        if (scancode < 0x80) {
            char ascii = scancode_to_ascii[scancode];
            
            if (ascii != 0) {
                // If it is backspace
                if (ascii == '\b') {
                    if (cursor_col > 12) { // Restrict deleting the shell prompt "sunset-OS:~$ "
                        cursor_col--;
                        print_char(' ', COLOR_DEFAULT);
                        cursor_col--; // Move back after writing a space
                    }
                } 
                // If it is Enter
                else if (ascii == '\n') {
                    print_char('\n', COLOR_DEFAULT);
                    print_string("sunset-OS:~$ ", COLOR_GREENERY);
                } 
                // Any regular character
                else {
                    print_char(ascii, COLOR_DEFAULT);
                }
            }
        }
    }
}

/* =====================================================================
 * VGA VIDEO DRIVER IMPLEMENTATION
 * ===================================================================== */
void clear_screen(char color_attrib) {
    char* video_memory = (char*)VGA_ADDRESS;
    for (int i = 0; i < SCREEN_WIDTH * SCREEN_HEIGHT; i++) {
        video_memory[i * 2] = ' ';
        video_memory[i * 2 + 1] = color_attrib;
    }
    cursor_row = 0;
    cursor_col = 0;
}

void print_char(char c, char color_attrib) {
    char* video_memory = (char*)VGA_ADDRESS;
    
    // Handle newline character
    if (c == '\n') {
        cursor_col = 0;
        cursor_row++;
        if (cursor_row >= SCREEN_HEIGHT) {
            clear_screen(COLOR_DEFAULT);
        }
        return;
    }

    int offset = (cursor_row * SCREEN_WIDTH + cursor_col) * 2;
    video_memory[offset] = c;
    video_memory[offset + 1] = color_attrib;
    
    cursor_col++;
    if (cursor_col >= SCREEN_WIDTH) {
        cursor_col = 0;
        cursor_row++;
        if (cursor_row >= SCREEN_HEIGHT) {
            clear_screen(COLOR_DEFAULT);
        }
    }
}

void print_string(const char* str, char color_attrib) {
    for (int i = 0; str[i] != '\0'; i++) {
        print_char(str[i], color_attrib);
    }
}
