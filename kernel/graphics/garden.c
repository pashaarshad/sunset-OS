/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Zen Garden Application
 * File: garden.c
 * Description: Interactive sand-raking, rock placing, and sakura blooming
 *              mini-game directly inside the 32-bit flat graphics kernel.
 * ===================================================================== */

#include "garden.h"
#include "../memory/memory.h"

// Global singleton instance of ZenGarden
ZenGarden global_garden;

static void helper_strcpy(char* dest, const char* src) {
    int i = 0;
    while (src[i] != '\0') {
        dest[i] = src[i];
        i++;
    }
    dest[i] = '\0';
}

void init_garden() {
    // Fill the grid with pristine sand
    for (int r = 0; r < GARDEN_ROWS; r++) {
        for (int c = 0; c < GARDEN_COLS; c++) {
            global_garden.grid[r][c] = '.';
        }
    }

    // Set starting cursor in the middle
    global_garden.cursor_x = GARDEN_COLS / 2;
    global_garden.cursor_y = GARDEN_ROWS / 2;

    // Place a couple of serene mossy rocks to begin
    global_garden.grid[2][4] = 'O';
    global_garden.grid[7][12] = 'O';
    global_garden.grid[4][13] = '*'; // One pre-bloomed sakura

    // Setup initial status message
    helper_strcpy(global_garden.status_message, "A quiet mind rakes the sand.");
}

void draw_garden_content(char* dest_buffer) {
    // Format the Zen Garden sandbox into the window content text buffer.
    // We construct the view line by line manually since we are freestanding.
    char* ptr = dest_buffer;

    // Title & Instructions headers
    helper_strcpy(ptr, "     🌅 SUNSET ZEN GARDEN 🌅\n");
    ptr += 29;
    helper_strcpy(ptr, "  [WASD] Move   [R] Rake   [O] Stone\n");
    ptr += 37;
    helper_strcpy(ptr, "  [S] Sakura    [C] Clear  [X] Status\n");
    ptr += 38;
    helper_strcpy(ptr, "  +---------------------------------+\n");
    ptr += 38;

    // Render the grid rows
    for (int r = 0; r < GARDEN_ROWS; r++) {
        helper_strcpy(ptr, "  | ");
        ptr += 4;
        
        for (int c = 0; c < GARDEN_COLS; c++) {
            // Check if cursor is active at this coordinate
            if (r == global_garden.cursor_y && c == global_garden.cursor_x) {
                // Render green blinking-like cursor icon '@'
                *ptr++ = '@';
                *ptr++ = ' ';
            } else {
                *ptr++ = global_garden.grid[r][c];
                *ptr++ = ' '; // Horizontal space padding for visual squares
            }
        }
        
        helper_strcpy(ptr, "|\n");
        ptr += 2;
    }

    // Footer divider
    helper_strcpy(ptr, "  +---------------------------------+\n");
    ptr += 38;

    // Append dynamic status message
    helper_strcpy(ptr, "  Status: ");
    ptr += 10;
    helper_strcpy(ptr, global_garden.status_message);
    ptr += 0; // Just update ptr offset by string length
    
    // Calculate string length of status message to move pointer
    int status_len = 0;
    while (global_garden.status_message[status_len] != '\0') {
        status_len++;
    }
    ptr += status_len;
    
    // Add trailing newline & null terminator
    *ptr++ = '\n';
    *ptr = '\0';
}

void handle_garden_input(char key) {
    // Process input directions
    int dx = 0;
    int dy = 0;

    if (key == 'w' || key == 'W') dy = -1;
    else if (key == 's' || key == 'S') {
        // Disambiguate: 's' or 'S' could mean Move Down OR plant Sakura tree!
        // If user presses shift 'S' or we check options: let's make 'w,a,s,d' lowercase move,
        // and uppercase 'S' or 'K' plant Sakura, or let's use 'x' / 'k' for Sakura.
        // Wait, let's map 's' to Move Down, and 'k' or 't' or 'p' to plant Sakura!
        // Yes, mapping Move Down to 's' and plant Sakura to 'k' (or 'p') is much safer to prevent conflict!
        // Let's use 'p' (Plant tree) or 'k' (Sakura) for planting.
        // Wait! What if we use 'w' / 'a' / 's' / 'd' (or arrow keys) for movement,
        // and 'r' for Rake, 'o' for stone, 'p' for Sakura, 'c' for Clear?
        // Let's check:
        // 'w' = up, 's' = down, 'a' = left, 'd' = right.
        // Yes! That's standard WASD movement. So 's' is down.
        // Then what about Sakura tree planting? Let's map it to 't' (Tree) or 'p' (Plant) or 'k' (saKura)!
        // Let's map it to 'k' for saKura tree! Or 't' for Tree! Let's accept BOTH 'k' and 't' for maximum user convenience!
        // That is extremely clever.
        dy = 1;
    }
    else if (key == 'a' || key == 'A') dx = -1;
    else if (key == 'd' || key == 'D') dx = 1;

    // Apply movement boundaries
    if (dx != 0 || dy != 0) {
        int nx = global_garden.cursor_x + dx;
        int ny = global_garden.cursor_y + dy;
        if (nx >= 0 && nx < GARDEN_COLS && ny >= 0 && ny < GARDEN_ROWS) {
            global_garden.cursor_x = nx;
            global_garden.cursor_y = ny;
            helper_strcpy(global_garden.status_message, "Walking mindfully through the garden.");
        } else {
            helper_strcpy(global_garden.status_message, "Reached the edge of tranquility.");
        }
        return;
    }

    // Process actions
    if (key == 'r' || key == 'R') {
        // Rake sand waves
        global_garden.grid[global_garden.cursor_y][global_garden.cursor_x] = '~';
        helper_strcpy(global_garden.status_message, "Raked smooth ripples into the sand.");
    }
    else if (key == 'o' || key == 'O') {
        // Place stone
        global_garden.grid[global_garden.cursor_y][global_garden.cursor_x] = 'O';
        helper_strcpy(global_garden.status_message, "Placed a solid mossy stone.");
    }
    else if (key == 't' || key == 'T' || key == 'k' || key == 'K') {
        // Grow sakura
        global_garden.grid[global_garden.cursor_y][global_garden.cursor_x] = '*';
        helper_strcpy(global_garden.status_message, "A gorgeous sakura tree blooms here.");
    }
    else if (key == 'c' || key == 'C') {
        // Reset garden to clean sand
        for (int r = 0; r < GARDEN_ROWS; r++) {
            for (int c = 0; c < GARDEN_COLS; c++) {
                global_garden.grid[r][c] = '.';
            }
        }
        helper_strcpy(global_garden.status_message, "Cleared the sand back to initial peace.");
    }
}
