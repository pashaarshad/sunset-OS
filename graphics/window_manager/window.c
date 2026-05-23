/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Window Manager
 * File: window.c
 * Description: Overlapping draggable windows and layouts.
 *              Now supports multi-terminal tab rendering for Shell.
 * ===================================================================== */

#include "window.h"
#include "graphics.h"
#include "font.h"

extern volatile int active_terminal;

/* Simple freestanding string comparison helper */
static int win_strcmp(const char* a, const char* b) {
    int i = 0;
    while (a[i] && b[i]) {
        if (a[i] != b[i]) return a[i] - b[i];
        i++;
    }
    return a[i] - b[i];
}

void init_window(Window* win, int x, int y, int w, int h, const char* title, const char* content) {
    win->x = x;
    win->y = y;
    win->w = w;
    win->h = h;
    win->title = title;
    win->content = content;
    win->is_dragging = 0;
    win->drag_offset_x = 0;
    win->drag_offset_y = 0;
    win->active = 0;
    win->minimized = 0;
}

void draw_window(Window* win) {
    if (win->minimized) return;

    int is_shell = (win_strcmp(win->title, "Sunset Shell Interface") == 0);
    int tab_bar_h = is_shell ? 20 : 0;

    // 1. Draw elegant outer glassmorphic border frame (Solid Sunset White)
    draw_rect(win->x, win->y, win->w, win->h, 255, 255, 255);
    
    // 2. Draw interior window body backing (Sunset Cream)
    draw_rect(win->x + 1, win->y + 1, win->w - 2, win->h - 2, 245, 235, 230);
    
    // 3. Draw Header Title Bar
    // Active window header maps Sunset Red/Burgundy (110, 20, 45).
    // Inactive window header maps muted Slate Charcoal (70, 70, 75).
    if (win->active) {
        draw_rect(win->x + 2, win->y + 2, win->w - 4, 20, 110, 20, 45);
    } else {
        draw_rect(win->x + 2, win->y + 2, win->w - 4, 20, 70, 70, 75);
    }
    
    // 4. Render window title text
    draw_string(win->title, win->x + 8, win->y + 6, 255, 255, 255);
    
    // 5. Draw decorative header window dot controls
    // Red close circle
    draw_rect(win->x + win->w - 18, win->y + 6, 8, 8, 220, 40, 40);
    // Orange collapse circle
    draw_rect(win->x + win->w - 30, win->y + 6, 8, 8, 230, 140, 30);

    // 6. For Shell window: render three terminal tab buttons below the title bar
    if (is_shell) {
        // Tab bar background strip
        draw_rect(win->x + 6, win->y + 24, win->w - 12, 18, 28, 28, 32);

        const char* tab_labels[] = { " Terminal 1 ", " Terminal 2 ", " Terminal 3 " };
        int tab_w = 90;
        int tab_gap = 4;
        int tab_start_x = win->x + 8;
        int tab_y = win->y + 26;

        for (int t = 0; t < 3; t++) {
            int tx = tab_start_x + t * (tab_w + tab_gap);
            if (t == active_terminal) {
                // Active tab: Sunset Orange
                draw_rect(tx, tab_y, tab_w, 14, 227, 133, 53);
                draw_string(tab_labels[t], tx + 6, tab_y + 3, 255, 255, 255);
            } else {
                // Inactive tab: Dark Charcoal
                draw_rect(tx, tab_y, tab_w, 14, 40, 40, 45);
                draw_string(tab_labels[t], tx + 6, tab_y + 3, 140, 140, 150);
            }
        }
    }

    // 7. Draw internal dark terminal console window body
    int body_top = win->y + 26 + tab_bar_h;
    int body_h = win->h - 32 - tab_bar_h;
    draw_rect(win->x + 6, body_top, win->w - 12, body_h, 18, 18, 20);
    
    // Draw double thin border lines around the inner terminal box
    draw_rect_outline(win->x + 5, body_top - 1, win->w - 10, body_h + 2, 210, 195, 185);
    
    // 8. Render shell text with auto-scroll (show last N lines that fit)
    if (win->content) {
        int line_height = 10;
        int text_x = win->x + 12;
        int text_y_start = body_top + 6;
        int max_visible_lines = (body_h - 12) / line_height;
        
        // Count total lines in content
        const char* p = win->content;
        int total_lines = 1;
        while (*p) { if (*p == '\n') total_lines++; p++; }
        
        // Calculate how many lines to skip
        int skip_lines = 0;
        if (total_lines > max_visible_lines) {
            skip_lines = total_lines - max_visible_lines;
        }
        
        // Find starting position after skipping lines
        const char* start = win->content;
        int skipped = 0;
        while (*start && skipped < skip_lines) {
            if (*start == '\n') skipped++;
            start++;
        }
        
        // Render visible lines with character-level clipping
        int cur_x = text_x;
        int cur_y = text_y_start;
        int max_x = win->x + win->w - 18;
        int max_y = body_top + body_h - 4;
        const char* c = start;
        while (*c && cur_y < max_y) {
            if (*c == '\n') {
                cur_x = text_x;
                cur_y += line_height;
            } else {
                if (cur_x < max_x) {
                    draw_char(*c, cur_x, cur_y, 40, 220, 120);
                    cur_x += 8;
                }
            }
            c++;
        }
    }
}

void handle_window_dragging(Window* win, int mx, int my, char mouse_down) {
    if (win->minimized) return;

    if (mouse_down) {
        // Check if click is on the minimize button (orange circle: x = win->w - 30, width = 8, height = 8)
        if (mx >= win->x + win->w - 30 && mx <= win->x + win->w - 22 &&
            my >= win->y + 6 && my <= win->y + 14) {
            win->minimized = 1;
            win->active = 0;
            win->is_dragging = 0;
            return;
        }

        if (!win->is_dragging) {
            // Drag triggers ONLY if the click originates inside the Title Bar (height = 22 pixels)
            if (mx >= win->x && mx <= (win->x + win->w) &&
                my >= win->y && my <= (win->y + 22)) {
                win->is_dragging = 1;
                win->drag_offset_x = mx - win->x;
                win->drag_offset_y = my - win->y;
                win->active = 1;
            }
        } else {
            // Actively drag window relative to pointer offsets
            win->x = mx - win->drag_offset_x;
            win->y = my - win->drag_offset_y;
            
            // Boundary constraints: restrict window from dragging completely off viewport
            if (win->x < -win->w + 60) win->x = -win->w + 60;
            if (win->x > SCREEN_WIDTH - 60) win->x = SCREEN_WIDTH - 60;
            if (win->y < 0) win->y = 0;
            if (win->y > SCREEN_HEIGHT - 40) win->y = SCREEN_HEIGHT - 40;
        }
    } else {
        win->is_dragging = 0;
    }
}
