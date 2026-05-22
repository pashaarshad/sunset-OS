/* =====================================================================
 * 🌅 Sunset OS (Ghuroob OS) — Simulated Network Stack
 * File: net.c
 * Description: Implements educational loopback & active network drivers
 *              and diagnostic routines (ifconfig, ping, fetch).
 * ===================================================================== */

#include "net.h"
#include "memory.h"

// Global adapter metrics
static NetworkAdapter lo0;
static NetworkAdapter eth0;
static unsigned int ping_seed = 4153;

// Minimal string utilities
static int mystrlen(const char* s) {
    int len = 0;
    while (s[len] != '\0') len++;
    return len;
}

static int mystrcmp(const char* s1, const char* s2) {
    while (*s1 && (*s1 == *s2)) {
        s1++;
        s2++;
    }
    return *(const unsigned char*)s1 - *(const unsigned char*)s2;
}

static int mystrncmp(const char* s1, const char* s2, int n) {
    while (n > 0) {
        if (*s1 != *s2) {
            return *(const unsigned char*)s1 - *(const unsigned char*)s2;
        }
        if (*s1 == '\0') {
            return 0;
        }
        s1++;
        s2++;
        n--;
    }
    return 0;
}

static void int_to_str(int num, char* buf) {
    int i = 0;
    int is_negative = 0;
    if (num == 0) {
        buf[i++] = '0';
        buf[i] = '\0';
        return;
    }
    if (num < 0) {
        is_negative = 1;
        num = -num;
    }
    while (num > 0) {
        buf[i++] = (num % 10) + '0';
        num /= 10;
    }
    if (is_negative) {
        buf[i++] = '-';
    }
    buf[i] = '\0';
    
    // Reverse string
    for (int j = 0; j < i / 2; j++) {
        char temp = buf[j];
        buf[j] = buf[i - 1 - j];
        buf[i - 1 - j] = temp;
    }
}

static void append_str(char* dest, const char* src, int max_len) {
    int dest_len = 0;
    while (dest[dest_len] != '\0' && dest_len < max_len) {
        dest_len++;
    }
    int i = 0;
    while (src[i] != '\0' && (dest_len + i) < (max_len - 1)) {
        dest[dest_len + i] = src[i];
        i++;
    }
    dest[dest_len + i] = '\0';
}

static void append_int(char* dest, int num, int max_len) {
    char tmp[16];
    int_to_str(num, tmp);
    append_str(dest, tmp, max_len);
}

// Simulated active waiting delay
static void wait_ms(int ms) {
    // Calibrated loop count for basic x86 QEMU ticks
    volatile int count = ms * 400000;
    while (count--);
}

// Pseudo-random generator for realistic latency simulation
static int get_random_latency(int min, int max) {
    ping_seed = (ping_seed * 1103515245 + 12345) & 0x7fffffff;
    return min + (ping_seed % (max - min + 1));
}

void init_net() {
    // Initialize loopback interface
    lo0.rx_packets = 42;
    lo0.tx_packets = 42;
    lo0.rx_bytes = 3360;
    lo0.tx_bytes = 3360;
    memcpy(lo0.ip, "127.0.0.1", 10);
    memcpy(lo0.netmask, "255.0.0.0", 10);
    memcpy(lo0.gateway, "127.0.0.1", 10);
    memcpy(lo0.status, "ACTIVE", 7);
    memcpy(lo0.speed, "10 Gbps", 8);

    // Initialize ethernet interface
    eth0.rx_packets = 1205;
    eth0.tx_packets = 874;
    eth0.rx_bytes = 142012;
    eth0.tx_bytes = 93240;
    memcpy(eth0.ip, "192.168.1.53", 13);
    memcpy(eth0.netmask, "255.255.255.0", 14);
    memcpy(eth0.gateway, "192.168.1.1", 12);
    memcpy(eth0.status, "ACTIVE", 7);
    memcpy(eth0.speed, "100 Mbps", 9);
}

void net_ifconfig(char* out_buf, int max_len) {
    out_buf[0] = '\0';
    
    append_str(out_buf, "\nlo0: flags=UP,LOOPBACK mtu 65536\n", max_len);
    append_str(out_buf, "     inet ", max_len);
    append_str(out_buf, lo0.ip, max_len);
    append_str(out_buf, " netmask ", max_len);
    append_str(out_buf, lo0.netmask, max_len);
    append_str(out_buf, "\n     status: ", max_len);
    append_str(out_buf, lo0.status, max_len);
    append_str(out_buf, ", speed: ", max_len);
    append_str(out_buf, lo0.speed, max_len);
    append_str(out_buf, "\n     RX packets: ", max_len);
    append_int(out_buf, lo0.rx_packets, max_len);
    append_str(out_buf, ", TX packets: ", max_len);
    append_int(out_buf, lo0.tx_packets, max_len);
    append_str(out_buf, "\n     RX bytes: ", max_len);
    append_int(out_buf, lo0.rx_bytes, max_len);
    append_str(out_buf, ", TX bytes: ", max_len);
    append_int(out_buf, lo0.tx_bytes, max_len);
    append_str(out_buf, "\n", max_len);

    append_str(out_buf, "\neth0: flags=UP,BROADCAST,RUNNING mtu 1500\n", max_len);
    append_str(out_buf, "     inet ", max_len);
    append_str(out_buf, eth0.ip, max_len);
    append_str(out_buf, " netmask ", max_len);
    append_str(out_buf, eth0.netmask, max_len);
    append_str(out_buf, " gateway ", max_len);
    append_str(out_buf, eth0.gateway, max_len);
    append_str(out_buf, "\n     status: ", max_len);
    append_str(out_buf, eth0.status, max_len);
    append_str(out_buf, ", speed: ", max_len);
    append_str(out_buf, eth0.speed, max_len);
    append_str(out_buf, "\n     RX packets: ", max_len);
    append_int(out_buf, eth0.rx_packets, max_len);
    append_str(out_buf, ", TX packets: ", max_len);
    append_int(out_buf, eth0.tx_packets, max_len);
    append_str(out_buf, "\n     RX bytes: ", max_len);
    append_int(out_buf, eth0.rx_bytes, max_len);
    append_str(out_buf, ", TX bytes: ", max_len);
    append_int(out_buf, eth0.tx_bytes, max_len);
    append_str(out_buf, "\n", max_len);
}

void net_ping(const char* ip_str, char* out_buf, int max_len) {
    out_buf[0] = '\0';
    
    append_str(out_buf, "\nPING ", max_len);
    append_str(out_buf, ip_str, max_len);
    append_str(out_buf, " (", max_len);
    append_str(out_buf, ip_str, max_len);
    append_str(out_buf, ") 56(84) bytes of data.\n", max_len);
    
    int packets_sent = 0;
    int packets_received = 0;
    int total_time = 0;
    
    for (int seq = 1; seq <= 4; seq++) {
        wait_ms(15); // Emulates round-trip networking delay
        packets_sent++;
        
        // Simulates connection status
        int success = 1;
        if (mystrcmp(ip_str, "0.0.0.0") == 0) {
            success = 0;
        }
        
        if (success) {
            packets_received++;
            int rtt = get_random_latency(8, 22);
            total_time += rtt;
            
            append_str(out_buf, "64 bytes from ", max_len);
            append_str(out_buf, ip_str, max_len);
            append_str(out_buf, ": icmp_seq=", max_len);
            append_int(out_buf, seq, max_len);
            append_str(out_buf, " ttl=64 time=", max_len);
            append_int(out_buf, rtt, max_len);
            append_str(out_buf, "ms\n", max_len);
            
            eth0.tx_packets++;
            eth0.rx_packets++;
            eth0.tx_bytes += 64;
            eth0.rx_bytes += 64;
        } else {
            append_str(out_buf, "Request timeout for icmp_seq ", max_len);
            append_int(out_buf, seq, max_len);
            append_str(out_buf, "\n", max_len);
        }
    }
    
    // Statistics summaries
    append_str(out_buf, "--- ", max_len);
    append_str(out_buf, ip_str, max_len);
    append_str(out_buf, " ping statistics ---\n", max_len);
    append_int(out_buf, packets_sent, max_len);
    append_str(out_buf, " packets transmitted, ", max_len);
    append_int(out_buf, packets_received, max_len);
    append_str(out_buf, " received, ", max_len);
    
    int loss = ((packets_sent - packets_received) * 100) / packets_sent;
    append_int(out_buf, loss, max_len);
    append_str(out_buf, "% packet loss, time ", max_len);
    append_int(out_buf, total_time, max_len);
    append_str(out_buf, "ms\n", max_len);
}

void net_fetch(const char* url_str, char* out_buf, int max_len) {
    out_buf[0] = '\0';
    
    append_str(out_buf, "\nConnecting to ", max_len);
    append_str(out_buf, url_str, max_len);
    append_str(out_buf, "... HTTP/1.1 200 OK\n", max_len);
    
    wait_ms(25); // Simulated networking retrieve delay
    
    eth0.tx_packets++;
    eth0.rx_packets++;
    eth0.tx_bytes += 128;
    eth0.rx_bytes += 1024;
    
    if (mystrcmp(url_str, "sunset://rest") == 0) {
        append_str(out_buf, "   * * *   \x01 SUNSET BREATHING STATION \x01   * * *\n", max_len);
        append_str(out_buf, "         Breathe in the golden rays...\n", max_len);
        append_str(out_buf, "                 .-~~~~~~~~~-.\n", max_len);
        append_str(out_buf, "             .-'               '-.\n", max_len);
        append_str(out_buf, "           .'                     '.\n", max_len);
        append_str(out_buf, "          /                         \\\n", max_len);
        append_str(out_buf, "         |                           |\n", max_len);
        append_str(out_buf, "         |         *   *   *         |\n", max_len);
        append_str(out_buf, "         |       *           *       |\n", max_len);
        append_str(out_buf, "         |      *    INHALING   *      |\n", max_len);
        append_str(out_buf, "          \\      *   (8s hold) *    /\n", max_len);
        append_str(out_buf, "           '.     *           *   .'\n", max_len);
        append_str(out_buf, "             '-.     * * *     .-'\n", max_len);
        append_str(out_buf, "                 '-~~~~~~~~~-'\n", max_len);
        append_str(out_buf, "         Breathe out the purple dusk.\n", max_len);
    } 
    else if (mystrcmp(url_str, "sunset://gardens") == 0) {
        append_str(out_buf, "   * * *   \x02 SUNSET ZEN GARDENS \x02   * * *\n", max_len);
        append_str(out_buf, "         A grid of calm, beauty, and peace.\n", max_len);
        append_str(out_buf, "        +-----+-----+-----+-----+-----+\n", max_len);
        append_str(out_buf, "        | .   | Sakura | .   |  .  | Lavender |\n", max_len);
        append_str(out_buf, "        +-----+-----+-----+-----+-----+\n", max_len);
        append_str(out_buf, "        | .   |  .  | Lily| .   |  .  |\n", max_len);
        append_str(out_buf, "        +-----+-----+-----+-----+-----+\n", max_len);
        append_str(out_buf, "        | Sakura | .  |  .  |  .  | Lily|\n", max_len);
        append_str(out_buf, "        +-----+-----+-----+-----+-----+\n", max_len);
        append_str(out_buf, "        | .   | Lavender | . | Sakura | . |\n", max_len);
        append_str(out_buf, "        +-----+-----+-----+-----+-----+\n", max_len);
    } 
    else if (mystrcmp(url_str, "sunset://clouds") == 0) {
        append_str(out_buf, "   * * *   \x03 SUNSET CLOUD VISUALIZER \x03   * * *\n", max_len);
        append_str(out_buf, "       Gentle atmospheric patterns in the sky.\n", max_len);
        append_str(out_buf, "                  _  _\n", max_len);
        append_str(out_buf, "                ( `   )_\n", max_len);
        append_str(out_buf, "               (    )   `)\n", max_len);
        append_str(out_buf, "             (_   (_(_ . _) _)\n", max_len);
        append_str(out_buf, "                 _  _\n", max_len);
        append_str(out_buf, "               (  `   )\n", max_len);
        append_str(out_buf, "              (  (     )  )\n", max_len);
        append_str(out_buf, "             (__________`_)\n", max_len);
    } 
    else {
        append_str(out_buf, "Resolved mock external host via SunsetDNS.\n", max_len);
        append_str(out_buf, "[Serene Resource List]\n", max_len);
        append_str(out_buf, "1. nature.org - Explore nature preserves\n", max_len);
        append_str(out_buf, "2. calm.com - Serene breathing spaces\n", max_len);
        append_str(out_buf, "3. github.com/sunset-OS - View sources\n", max_len);
    }
}
