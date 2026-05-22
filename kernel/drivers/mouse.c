/* =====================================================================
 * 🌅 Sunset OS — LAZ Kernel PS/2 Mouse Driver
 * File: mouse.c
 * Description: Low-level auxiliary PS/2 mouse decoder and plotting.
 * ===================================================================== */

#include "mouse.h"
#include "graphics.h"

// Hardware I/O Port Helper Functions
static inline unsigned char inb(unsigned short port) {
    unsigned char result;
    __asm__ volatile("in %%dx, %%al" : "=a" (result) : "d" (port));
    return result;
}

static inline void outb(unsigned short port, unsigned char data) {
    __asm__ volatile("out %%al, %%dx" : : "a" (data), "d" (port));
}

// Global mouse coordinates and click flags initialization
int mouse_x = 400;
int mouse_y = 300;
char mouse_left_clicked = 0;
char mouse_right_clicked = 0;

static unsigned char mouse_bytes[3];
static int mouse_cycle = 0;

// Poll Status register until ready to read/write
static void mouse_wait(unsigned char type) {
    unsigned int timeout = 100000;
    if (type == 0) {
        // Wait to read: Bit 0 (Output Buffer Full) must be 1
        while (timeout--) {
            if (inb(0x64) & 1) return;
        }
    } else {
        // Wait to write: Bit 1 (Input Buffer Full) must be 0
        while (timeout--) {
            if (!(inb(0x64) & 2)) return;
        }
    }
}

static void mouse_write(unsigned char data) {
    mouse_wait(1);
    outb(0x64, 0xD4); // Tell keyboard controller to send next byte to aux mouse device
    mouse_wait(1);
    outb(0x60, data); // Write command byte
}

static unsigned char mouse_read() {
    mouse_wait(0);
    return inb(0x60);
}

void init_mouse() {
    unsigned char status;

    // 1. Enable auxiliary mouse device
    mouse_wait(1);
    outb(0x64, 0xA8); 

    // 2. Request controller configuration byte
    mouse_wait(1);
    outb(0x64, 0x20);
    mouse_wait(0);
    status = inb(0x60);

    // 3. Set bit 1 (enable mouse interrupts) and clear bit 5 (enable mouse clock)
    status |= 2;
    status &= ~0x20;

    // 4. Write modified configuration byte back
    mouse_wait(1);
    outb(0x64, 0x60);
    mouse_wait(1);
    outb(0x60, status);

    // 5. Send default mouse command and enable packet streaming
    mouse_write(0xF6); // Set default configurations
    mouse_read();      // Acknowledge

    mouse_write(0xF4); // Enable auxiliary packet streaming
    mouse_read();      // Acknowledge
    
    // Position initial cursor at center of display
    mouse_x = 400;
    mouse_y = 300;
    mouse_cycle = 0;
    mouse_left_clicked = 0;
    mouse_right_clicked = 0;
}

void update_mouse() {
    // Port 0x64 Status Register:
    // Bit 0 = Output Buffer Full (data available)
    // Bit 5 = Auxiliary Output Buffer Full (data comes from mouse, not keyboard)
    while ((inb(0x64) & 0x21) == 0x21) {
        unsigned char val = inb(0x60);
        
        switch (mouse_cycle) {
            case 0:
                // Bit 3 of byte 0 in a valid packet must ALWAYS be 1
                if (val & 0x08) {
                    mouse_bytes[0] = val;
                    mouse_cycle = 1;
                }
                break;
                
            case 1:
                mouse_bytes[1] = val;
                mouse_cycle = 2;
                break;
                
            case 2:
                mouse_bytes[2] = val;
                mouse_cycle = 0;
                
                // Parse relative deltas
                int dx = (int)mouse_bytes[1];
                int dy = (int)mouse_bytes[2];
                
                // Perform sign extension to support negative displacements
                if (mouse_bytes[0] & 0x10) {
                    dx |= 0xFFFFFF00;
                }
                if (mouse_bytes[0] & 0x20) {
                    dy |= 0xFFFFFF00;
                }
                
                // In PS/2 mouse coordinate maps, vertical displacement is upward positive,
                // while in standard VGA framebuffers, vertical coordinate growth is downward positive.
                mouse_x += dx;
                mouse_y -= dy; // Subtract relative Y movement delta!
                
                // Apply strict coordinate constraints to keep the pointer inside the viewport boundaries
                if (mouse_x < 0) mouse_x = 0;
                if (mouse_x >= SCREEN_WIDTH) mouse_x = SCREEN_WIDTH - 1;
                if (mouse_y < 0) mouse_y = 0;
                if (mouse_y >= SCREEN_HEIGHT) mouse_y = SCREEN_HEIGHT - 1;
                
                // Capture mouse button click states
                mouse_left_clicked  = (mouse_bytes[0] & 0x01);
                mouse_right_clicked = (mouse_bytes[0] & 0x02) >> 1;
                break;
        }
    }
}

void draw_mouse_pointer() {
    int x = mouse_x;
    int y = mouse_y;
    
    // Draw a premium glowing white arrow cursor overlay with a thin red/orange shadow
    for (int i = 0; i < 15; i++) {
        for (int j = 0; j <= i; j++) {
            if (j == i || j == 0 || i == 14) {
                // Outline border: Glowing Sunset Red RGB (227, 32, 62)
                draw_pixel(x + j, y + i, 227, 32, 62);
            } else {
                // Fill interior: Solid Pure White RGB (255, 255, 255)
                draw_pixel(x + j, y + i, 255, 255, 255);
            }
        }
    }
    
    // Render elegant pointer stem anchors
    draw_pixel(x + 3, y + 15, 227, 32, 62);
    draw_pixel(x + 4, y + 16, 227, 32, 62);
    draw_pixel(x + 3, y + 16, 255, 255, 255);
    draw_pixel(x + 5, y + 17, 227, 32, 62);
    draw_pixel(x + 4, y + 17, 255, 255, 255);
}
