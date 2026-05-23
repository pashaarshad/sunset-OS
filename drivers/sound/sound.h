/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — PC Speaker Hardware Audio Driver
 * File: sound.h
 * Author: Arshad Pasha
 * Description: Low-level definitions for Programmable Interval Timer (PIT)
 *              Channel 2 sound programming and delays.
 * ===================================================================== */

#ifndef SOUND_H
#define SOUND_H

#include "../scheduler/scheduler.h"

#define PIT_FREQ 1193180
#define PIT_CHANNEL_2_PORT 0x42
#define PIT_COMMAND_PORT 0x43
#define SYSTEM_CONTROL_B_PORT 0x61

// Global sound driver mutex for hardware register access protection
extern mutex_t sound_mutex;

// Play a specific frequency tone using PC Speaker
void play_tone(unsigned int frequency);

// Terminate any active tone on the speaker
void stop_tone();

// Perform a calibrated delay in milliseconds
void sleep_ms(unsigned int ms);

// Plays the serene major-chord ascending welcome melody
void play_startup_chime();

#endif
