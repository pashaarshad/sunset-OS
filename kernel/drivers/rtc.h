/* =====================================================================
 * Copyright (c) 2026 Arshad Pasha. All Rights Reserved.
 * License: Private. Authorized use only under the Sunset OS License Agreement.
 * ===================================================================== */

#ifndef RTC_H
#define RTC_H

void rtc_get_time(int* hours, int* minutes, int* seconds, int* day, int* month, int* year);
int  rtc_is_updating(void);

#endif
