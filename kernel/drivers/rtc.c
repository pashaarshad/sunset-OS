/* =====================================================================
 * Copyright (c) 2026 Arshad Pasha. All Rights Reserved.
 * License: Private. Authorized use only under the Sunset OS License Agreement.
 * ===================================================================== */

#include "rtc.h"

// Low-level Hardware I/O Port Helper Functions
static inline unsigned char inb(unsigned short port) {
    unsigned char result;
    __asm__ volatile("in %%dx, %%al" : "=a" (result) : "d" (port));
    return result;
}

static inline void outb(unsigned short port, unsigned char data) {
    __asm__ volatile("out %%al, %%dx" : : "a" (data), "d" (port));
}

// Low-level read from CMOS register
static inline unsigned char read_cmos(unsigned char reg) {
    // Disable NMI is optional, but simple outb(0x70, reg) works in typical emulator environment.
    // Setting bit 7 of the CMOS register index turns off NMI, but let's keep it simple.
    outb(0x70, reg);
    return inb(0x71);
}

// Check if an update is in progress (UIP bit)
int rtc_is_updating(void) {
    return (read_cmos(0x0A) & 0x80);
}

// Helper to convert Binary Coded Decimal (BCD) to standard Binary
static unsigned char bcd_to_bin(unsigned char bcd) {
    return (bcd & 0x0F) + ((bcd / 16) * 10);
}

// Extract standard time values using safe double-reads to prevent update race conditions
void rtc_get_time(int* hours, int* minutes, int* seconds, int* day, int* month, int* year) {
    int h1, m1, s1, d1, mo1, y1;
    int h2, m2, s2, d2, mo2, y2;
    
    // Wait until any active update is completed
    while (rtc_is_updating());
    h1  = read_cmos(0x04);
    m1  = read_cmos(0x02);
    s1  = read_cmos(0x00);
    d1  = read_cmos(0x07);
    mo1 = read_cmos(0x08);
    y1  = read_cmos(0x09);
    
    // Perform sequential double-reads to ensure perfect values (no transition mid-read)
    do {
        while (rtc_is_updating());
        h2  = read_cmos(0x04);
        m2  = read_cmos(0x02);
        s2  = read_cmos(0x00);
        d2  = read_cmos(0x07);
        mo2 = read_cmos(0x08);
        y2  = read_cmos(0x09);
    } while (h1 != h2 || m1 != m2 || s1 != s2 || d1 != d2 || mo1 != mo2 || y1 != y2);
    
    unsigned char registerB = read_cmos(0x0B);
    
    // Convert BCD to standard Binary values if status register B bit 2 is clear (BCD mode)
    if (!(registerB & 0x04)) {
        s1  = bcd_to_bin(s1);
        m1  = bcd_to_bin(m1);
        h1  = bcd_to_bin(h1);
        d1  = bcd_to_bin(d1);
        mo1 = bcd_to_bin(mo1);
        y1  = bcd_to_bin(y1);
    }
    
    // Convert 12-hour format to 24-hour format if status register B bit 1 is clear (12h mode)
    // and the PM bit (bit 7 of hour) is set.
    if (!(registerB & 0x02) && (h1 & 0x80)) {
        h1 = ((h1 & 0x7F) + 12) % 24;
    }
    
    *seconds = s1;
    *minutes = m1;
    *hours   = h1;
    *day     = d1;
    *month   = mo1;
    *year    = y1;
}
