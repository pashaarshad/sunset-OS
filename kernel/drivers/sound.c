/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — PC Speaker Hardware Audio Driver
 * File: sound.c
 * Author: Arshad Pasha
 * Description: Low-level implementation of Programmable Interval Timer (PIT)
 *              Channel 2 speaker toggles, notes, and calm startup chimes.
 * ===================================================================== */

#include "sound.h"

// Define the global sound hardware mutex
mutex_t sound_mutex = {0};

// Hardware I/O Port Helper Functions
static inline unsigned char inb(unsigned short port) {
    unsigned char result;
    __asm__ volatile("in %%dx, %%al" : "=a" (result) : "d" (port));
    return result;
}

static inline void outb(unsigned short port, unsigned char data) {
    __asm__ volatile("out %%al, %%dx" : : "a" (data), "d" (port));
}

// Read the x86 EFLAGS register to check interrupt status
static inline unsigned int read_eflags() {
    unsigned int eflags;
    __asm__ volatile("pushfl\n\tpopl %0" : "=r"(eflags));
    return eflags;
}

// Calibrated millisecond-delay loop with cooperative multitasking sleep fallback
void sleep_ms(unsigned int ms) {
    unsigned int eflags = read_eflags();
    // If interrupts are enabled (IF = Bit 9) and sleep is >= 10ms, yield cooperatively
    if ((eflags & 0x200) && ms >= 10) {
        unsigned int ticks = ms / 10;
        scheduler_sleep(ticks);
    } else {
        // Fallback to busy-wait loop during early boot or very short delays
        for (unsigned int i = 0; i < ms; i++) {
            volatile unsigned int count = 120000;
            while (count--);
        }
    }
}

// Play a tone on PC Speaker at the given frequency with atomic hardware access protection
void play_tone(unsigned int frequency) {
    mutex_lock(&sound_mutex);
    if (frequency == 0) {
        // Stop speaker tone
        unsigned char speaker_state = inb(SYSTEM_CONTROL_B_PORT) & 0xFC;
        outb(SYSTEM_CONTROL_B_PORT, speaker_state);
        mutex_unlock(&sound_mutex);
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
    mutex_unlock(&sound_mutex);
}

// Stop PC Speaker audio output with atomic hardware access protection
void stop_tone() {
    mutex_lock(&sound_mutex);
    unsigned char speaker_state = inb(SYSTEM_CONTROL_B_PORT) & 0xFC;
    outb(SYSTEM_CONTROL_B_PORT, speaker_state);
    mutex_unlock(&sound_mutex);
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
