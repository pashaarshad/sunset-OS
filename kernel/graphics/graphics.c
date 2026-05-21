/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Graphics Library
 * File: graphics.c
 * Description: High-performance double-buffered rendering systems.
 * ===================================================================== */

#include "graphics.h"
#include "memory.h"

static unsigned char* lfb_addr = 0;
static unsigned char* back_buffer = (unsigned char*)BACK_BUFFER_ADDRESS;

void init_graphics(unsigned char* lfb) {
    lfb_addr = lfb;
    // Clear backbuffer to zero initially
    memset(back_buffer, 0, BUFFER_SIZE);
}

void draw_pixel(int x, int y, unsigned char r, unsigned char g, unsigned char b) {
    // Basic bounds validation to prevent stack/heap memory corruptions
    if (x < 0 || x >= SCREEN_WIDTH || y < 0 || y >= SCREEN_HEIGHT) {
        return;
    }
    
    // VESA standard 24-bit color mapping is Blue-Green-Red (BGR)
    int offset = (y * SCREEN_WIDTH + x) * 3;
    back_buffer[offset]     = b; // B
    back_buffer[offset + 1] = g; // G
    back_buffer[offset + 2] = r; // R
}

void draw_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b) {
    for (int i = 0; i < h; i++) {
        for (int j = 0; j < w; j++) {
            draw_pixel(x + j, y + i, r, g, b);
        }
    }
}

void draw_rect_outline(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b) {
    // Top & Bottom lines
    for (int j = 0; j < w; j++) {
        draw_pixel(x + j, y, r, g, b);
        draw_pixel(x + j, y + h - 1, r, g, b);
    }
    // Left & Right lines
    for (int i = 0; i < h; i++) {
        draw_pixel(x, y + i, r, g, b);
        draw_pixel(x + w - 1, y + i, r, g, b);
    }
}

void draw_gradient(int ambient_shift) {
    // middle_line divides top purple-red and bottom red-orange transitions.
    // ambient_shift oscillates to create the breathing sky animation.
    int middle_line = 300 + ambient_shift;
    if (middle_line < 100) middle_line = 100;
    if (middle_line > 500) middle_line = 500;
    
    for (int y = 0; y < SCREEN_HEIGHT; y++) {
        unsigned char r, g, b;
        
        if (y < middle_line) {
            // Interpolate from Top Deep Sunset Purple (44, 27, 77) to Middle Warm Red (168, 32, 62)
            int segment_height = middle_line;
            int t = y;
            r = (unsigned char)(44 + (168 - 44) * t / segment_height);
            g = (unsigned char)(27 + (32 - 27) * t / segment_height);
            b = (unsigned char)(77 + (62 - 77) * t / segment_height);
        } else {
            // Interpolate from Middle Warm Red (168, 32, 62) to Bottom Orange-Gold (227, 133, 53)
            int segment_height = SCREEN_HEIGHT - middle_line;
            int t = y - middle_line;
            r = (unsigned char)(168 + (227 - 168) * t / segment_height);
            g = (unsigned char)(32 + (133 - 32) * t / segment_height);
            b = (unsigned char)(62 + (53 - 62) * t / segment_height);
        }
        
        // Fast block draw
        for (int x = 0; x < SCREEN_WIDTH; x++) {
            draw_pixel(x, y, r, g, b);
        }
    }
}

void clear_screen_color(unsigned char r, unsigned char g, unsigned char b) {
    draw_rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, r, g, b);
}

void flush_buffer() {
    if (lfb_addr != 0) {
        memcpy(lfb_addr, back_buffer, BUFFER_SIZE);
    }
}
