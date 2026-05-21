/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — PC Speaker Hardware Audio Driver
 * File: sound.c
 * Author: Arshad Pasha
 * Description: Low-level implementation of Programmable Interval Timer (PIT)
 *              Channel 2 speaker toggles, notes, and calm startup chimes.
 * ===================================================================== */

#include "sound.h"

// Hardware I/O Port Helper Functions
static inline unsigned char inb(unsigned short port) {
    unsigned char result;
    __asm__ volatile("in %%dx, %%al" : "=a" (result) : "d" (port));
    return result;
}

static inline void outb(unsigned short port, unsigned char data) {
    __asm__ volatile("out %%al, %%dx" : : "a" (data), "d" (port));
}

// Calibrated millisecond-delay loop for emulated QEMU execution
void sleep_ms(unsigned int ms) {
    for (unsigned int i = 0; i < ms; i++) {
        volatile unsigned int count = 120000;
        while (count--);
    }
}

// Play a tone on PC Speaker at the given frequency
void play_tone(unsigned int frequency) {
    if (frequency == 0) {
        stop_tone();
        return;
    }

    // Calculate PIT Channel 2 divisor
    unsigned int divisor = PIT_FREQ / frequency;

    // Send control word 0xB6 (Channel 2, access lobyte/hibyte, square wave, binary)
    outb(PIT_COMMAND_PORT, 0xB6);

    // Send divisor frequency to data port
    outb(PIT_CHANNEL_2_PORT, (unsigned char)(divisor & 0xFF));
    outb(PIT_CHANNEL_2_PORT, (unsigned char)((divisor >> 8) & 0xFF));

    // Enable PC Speaker gate and speaker timer inputs via System Control Port B
    unsigned char speaker_state = inb(SYSTEM_CONTROL_B_PORT);
    if ((speaker_state & 0x03) != 0x03) {
        outb(SYSTEM_CONTROL_B_PORT, speaker_state | 0x03);
    }
}

// Stop PC Speaker audio output
void stop_tone() {
    unsigned char speaker_state = inb(SYSTEM_CONTROL_B_PORT) & 0xFC;
    outb(SYSTEM_CONTROL_B_PORT, speaker_state);
}

// Ascending Serene 3-Tone Welcome Melody (Major Chord: C5 -> E5 -> G5)
void play_startup_chime() {
    // Note 1: C5 (523 Hz) - 150ms
    play_tone(523);
    sleep_ms(150);

    // Note 2: E5 (659 Hz) - 150ms
    play_tone(659);
    sleep_ms(150);

    // Note 3: G5 (784 Hz) - 250ms
    play_tone(784);
    sleep_ms(250);

    // Fade off cleanly
    stop_tone();
}
