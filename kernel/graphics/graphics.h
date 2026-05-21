/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Graphics Library
 * File: graphics.h
 * Description: Low-level VESA graphics buffers and shape rendering primitives.
 * ===================================================================== */

#ifndef GRAPHICS_H
#define GRAPHICS_H

#define SCREEN_WIDTH  800
#define SCREEN_HEIGHT 600
#define BUFFER_SIZE   (SCREEN_WIDTH * SCREEN_HEIGHT * 3)

// Static address of back-buffer in high physical RAM
#define BACK_BUFFER_ADDRESS 0x500000

// Initialize Linear Frame Buffer and offscreen space
void init_graphics(unsigned char* lfb);

// Low-level BGR pixel plotting to back-buffer
void draw_pixel(int x, int y, unsigned char r, unsigned char g, unsigned char b);

// Solid color rectangle draws
void draw_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b);

// Outline rectangle draws
void draw_rect_outline(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b);

// Beautiful nature-inspired vertical gradient draw
void draw_gradient(int ambient_shift);

// Clear entire display with a solid color
void clear_screen_color(unsigned char r, unsigned char g, unsigned char b);

// Sync back-buffer to hardware frame buffer
void flush_buffer();

#endif
