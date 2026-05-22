/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Window Manager
 * File: window.c
 * Description: Overlapping draggable windows and layouts.
 * ===================================================================== */

#include "window.h"
#include "graphics.h"
#include "font.h"

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
}

void draw_window(Window* win) {
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
    
    // 6. Draw internal dark terminal console window body
    draw_rect(win->x + 6, win->y + 26, win->w - 12, win->h - 32, 18, 18, 20);
    
    // Draw double thin border lines around the inner terminal box
    draw_rect_outline(win->x + 5, win->y + 25, win->w - 10, win->h - 30, 210, 195, 185);
    
    // 7. Write standard green/gold diagnostic console logs inside the window
    draw_string(win->content, win->x + 12, win->y + 32, 40, 220, 120);
}

void handle_window_dragging(Window* win, int mx, int my, char mouse_down) {
    if (mouse_down) {
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
