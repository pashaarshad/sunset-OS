/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel PS/2 Mouse Driver
 * File: mouse.h
 * Description: Low-level auxiliary PS/2 mouse initialization and polling.
 * ===================================================================== */

#ifndef MOUSE_H
#define MOUSE_H

// Global mouse coordinates and click flags
extern int mouse_x;
extern int mouse_y;
extern char mouse_left_clicked;
extern char mouse_right_clicked;

// Initialize keyboard controller aux port and enable mouse
void init_mouse();

// Poll hardware registers for new mouse packets
void update_mouse();

// Draw a beautiful custom mouse pointer overlay
void draw_mouse_pointer();

#endif
