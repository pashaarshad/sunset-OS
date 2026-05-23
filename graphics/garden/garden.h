/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Zen Garden Application
 * File: garden.h
 * Description: Interactive sand-raking, rock placing, and sakura blooming
 *              mini-game directly inside the 32-bit flat graphics kernel.
 * ===================================================================== */

#ifndef GARDEN_H
#define GARDEN_H

#define GARDEN_ROWS 10
#define GARDEN_COLS 16

typedef struct {
    char grid[GARDEN_ROWS][GARDEN_COLS];
    int cursor_x;
    int cursor_y;
    char status_message[64];
} ZenGarden;

extern ZenGarden global_garden;

// Initialize garden structure and items
void init_garden();

// Convert the Zen Garden state into a formatted visual string in the buffer
void draw_garden_content(char* dest_buffer);

// Process interactive keyboard keys to rake, place stones, or reset
void handle_garden_input(char key);

#endif
