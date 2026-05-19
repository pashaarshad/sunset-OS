/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — Laz Engine Kernel Core
 * File: kernel.c
 * Author: Arshad Pasha
 * Description: Low-level monolithic kernel entry in C.
 *              Directly interfaces with VGA video memory (0xB8000)
 *              to output text on screen without standard libraries.
 * ===================================================================== */

// Define screen dimensions for VGA Text Mode
#define SCREEN_WIDTH 80
#define SCREEN_HEIGHT 25
#define VGA_ADDRESS 0xB8000

// Define custom sunset-themed text colors (VGA attribute formatting)
#define COLOR_LIGHT_ORANGE 0x0E // Yellow/Light Orange text, Black background
#define COLOR_DEEP_RED     0x0C // Light Red text, Black background
#define COLOR_GREENERY     0x0A // Light Green text, Black background
#define COLOR_DEFAULT      0x07 // Gray text, Black background

// Function declarations
void clear_screen(char color_attrib);
void print_string(const char* str, int row, int col, char color_attrib);

/* =====================================================================
 * KERNEL MAIN ENTRY POINT
 * ===================================================================== */
void kernel_main() {
    // 1. Initialize screen - Clear all characters with black backgrounds
    clear_screen(COLOR_DEFAULT);

    // 2. Render a gorgeous, calm nature-themed ASCII layout
    print_string("*************************************************", 2, 15, COLOR_LIGHT_ORANGE);
    print_string("*       🌅 Welcome to Sunset OS (Ghuroob OS) 🌅   *", 3, 15, COLOR_LIGHT_ORANGE);
    print_string("*              Laz Engine Kernel v0.1           *", 4, 15, COLOR_DEEP_RED);
    print_string("*************************************************", 5, 15, COLOR_LIGHT_ORANGE);

    // 3. Output boot metrics
    print_string("[OK] Laz Engine initialized in 32-bit Protected Mode.", 8, 10, COLOR_GREENERY);
    print_string("[OK] System Stack loaded at physical offset 0x9000.", 9, 10, COLOR_DEFAULT);
    print_string("[OK] Hardware Interfacing Status: CALM & STABLE.", 10, 10, COLOR_DEFAULT);
    print_string("[OK] Smart Loading Cache activated.", 11, 10, COLOR_GREENERY);

    // 4. Instructional prompt
    print_string("You have successfully reached Milestone 2.", 14, 15, COLOR_LIGHT_ORANGE);
    print_string("Standing by for user commands...", 15, 15, COLOR_DEFAULT);

    // 5. Enter CPU halt loop
    while(1) {
        // Keep CPU running safely in Ring 0
    }
}

/* =====================================================================
 * VGA CONSOLE UTILITIES
 * ===================================================================== */

// clear_screen: Clears all VGA characters with spaces and sets background attribute
void clear_screen(char color_attrib) {
    char* video_memory = (char*)VGA_ADDRESS;
    for (int i = 0; i < SCREEN_WIDTH * SCREEN_HEIGHT; i++) {
        video_memory[i * 2] = ' ';           // Set text character to space
        video_memory[i * 2 + 1] = color_attrib; // Set attribute byte (color)
    }
}

// print_string: Prints a null-terminated string at a specific row and column
void print_string(const char* str, int row, int col, char color_attrib) {
    char* video_memory = (char*)VGA_ADDRESS;
    int offset = (row * SCREEN_WIDTH + col) * 2; // Calculate offset in VGA memory

    for (int i = 0; str[i] != '\0'; i++) {
        video_memory[offset] = str[i];           // ASCII value
        video_memory[offset + 1] = color_attrib;   // Color attribute
        offset += 2;                             // Move to next screen cell (2 bytes)
    }
}
