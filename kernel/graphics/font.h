/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel Font Library
 * File: font.h
 * Description: Lightweight ASCII bitmap raster font driver.
 * ===================================================================== */

#ifndef FONT_H
#define FONT_H

// Render single 8x8 character bitmap
void draw_char(char c, int x, int y, unsigned char r, unsigned char g, unsigned char b);

// Render standard null-terminated text string
void draw_string(const char* str, int x, int y, unsigned char r, unsigned char g, unsigned char b);

#endif
