/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Window Manager
 * File: window.h
 * Description: Overlapping draggable windows and GUI component layouts.
 * ===================================================================== */

#ifndef WINDOW_H
#define WINDOW_H

// Draggable window structure
typedef struct {
    int x, y;
    int w, h;
    const char* title;
    const char* content;
    char is_dragging;
    int drag_offset_x;
    int drag_offset_y;
    char active;
    char minimized;
} Window;

// Initialize window attributes
void init_window(Window* win, int x, int y, int w, int h, const char* title, const char* content);

// Draw complete window layout (header bar, close button, interior console)
void draw_window(Window* win);

// Process drag coordinate calculations and boundaries
void handle_window_dragging(Window* win, int mx, int my, char mouse_down);

// Handle title bar button clicks (minimize/close) — returns 1 if minimize clicked
int handle_window_click(Window* win, int mx, int my);

#endif
