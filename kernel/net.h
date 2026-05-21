/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — Simulated Network Stack
 * File: net.h
 * Description: Declarations for network packet headers, adapter metrics,
 *              and diagnostic routines (ifconfig, ping, fetch).
 * ===================================================================== */

#ifndef NET_H
#define NET_H

typedef struct {
    unsigned int rx_packets;
    unsigned int tx_packets;
    unsigned int rx_bytes;
    unsigned int tx_bytes;
    char ip[16];
    char netmask[16];
    char gateway[16];
    char status[12];
    char speed[12];
} NetworkAdapter;

void init_net();
void net_ifconfig(char* out_buf, int max_len);
void net_ping(const char* ip_str, char* out_buf, int max_len);
void net_fetch(const char* url_str, char* out_buf, int max_len);

#endif
