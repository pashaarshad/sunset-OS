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
    // Deprecated: mouse coordinates are now updated asynchronously via IRQ12 mouse_handler
}

void mouse_handler() {
    unsigned char status = inb(0x64);
    // Bit 0 = Output Buffer Full, Bit 5 = Auxiliary Output Buffer Full (Mouse data)
    if ((status & 0x21) == 0x21) {
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
                
                // Responsive 1.8x speed multiplier to remove sluggishness/lag
                int scaled_dx = (dx * 9) / 5;
                int scaled_dy = (dy * 9) / 5;
                
                // In PS/2 mouse coordinate maps, vertical displacement is upward positive,
                // while in standard VGA framebuffers, vertical coordinate growth is downward positive.
                mouse_x += scaled_dx;
                mouse_y -= scaled_dy; // Subtract relative Y movement delta!
                
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
    
    // Premium tilted classic OS arrow cursor (17 rows, 12 cols)
    static const char* cursor_bitmap[17] = {
        "X...........",
        "XX..........",
        "XoX.........",
        "XooX........",
        "XoooX.......",
        "XooooX......",
        "XoooooX.....",
        "XooooooX....",
        "XoooooooX...",
        "XooooooooX..",
        "XoooooXXXXX.",
        "XooXooX.....",
        "XoX..XooX...",
        "XX...XooX...",
        "......XooX..",
        "......XooX..",
        ".......XX..."
    };

    // 1. Render soft warm glowing sunset shadow (offset +1, +1)
    for (int row = 0; row < 17; row++) {
        for (int col = 0; col < 12; col++) {
            char pixel = cursor_bitmap[row][col];
            if (pixel != '.') {
                draw_pixel(x + col + 1, y + row + 1, 80, 30, 15);
            }
        }
    }

    // 2. Render crisp high-contrast cursor on top
    for (int row = 0; row < 17; row++) {
        for (int col = 0; col < 12; col++) {
            char pixel = cursor_bitmap[row][col];
            if (pixel == 'X') {
                // Sleek charcoal-black border
                draw_pixel(x + col, y + row, 20, 20, 20);
            } else if (pixel == 'o') {
                // Pure white fill
                draw_pixel(x + col, y + row, 255, 255, 255);
            }
        }
    }
}
