/* =====================================================================
 * 🌅 Sunset OS — LAZ Virtual File System & RAM Disk
 * File: vfs.c
 * Description: RAM disk memory allocation, file operations, and helpers.
 * ===================================================================== */

#include "vfs.h"

vfs_file_t ramdisk[MAX_VFS_FILES];

// Standard static string copy helper for freestanding environment
static void helper_strcpy(char* dest, const char* src) {
    int i = 0;
    while (src[i] != '\0') {
        dest[i] = src[i];
        i++;
    }
    dest[i] = '\0';
}

// Standard static string comparison helper for freestanding environment
static int helper_strcmp(const char* s1, const char* s2) {
    int i = 0;
    while (s1[i] != '\0' && s2[i] != '\0') {
        if (s1[i] != s2[i]) {
            return s1[i] - s2[i];
        }
        i++;
    }
    return s1[i] - s2[i];
}

// Standard static string length helper for freestanding environment
static int helper_strlen(const char* s) {
    int len = 0;
    while (s[len] != '\0') {
        len++;
    }
    return len;
}

// Initialize RAM disk partition block and set default calming system files
void vfs_init() {
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        ramdisk[i].active = 0;
        ramdisk[i].name[0] = '\0';
        ramdisk[i].content[0] = '\0';
        ramdisk[i].size = 0;
    }

    // Pre-populate default files
    vfs_write("welcome.txt", "Welcome to Sunset OS! A digital sanctuary designed for serene, focused computing. Breathe in. Rest. Reflect.");
    vfs_write("philosophy.txt", "Sunset OS represents the calm, restorative interval between Asr and Maghrib daily. It is built to minimize distractions and inspire natural productivity.");
    vfs_write("todo.txt", "- Take a deep breath.\n- Stretch for 2 minutes.\n- Rest your eyes from the screen.\n- Hydrate.");
}

// Write the dynamic active file listing into formatting buffer
int vfs_list(char* out, int max_len) {
    int pos = 0;
    out[0] = '\0';
    
    const char* header = "\nFiles in RAM Disk:\n";
    int h_len = helper_strlen(header);
    if (pos + h_len < max_len) {
        helper_strcpy(out + pos, header);
        pos += h_len;
    }
    
    int file_count = 0;
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (ramdisk[i].active) {
            file_count++;
            const char* prefix = "- ";
            int p_len = helper_strlen(prefix);
            if (pos + p_len < max_len) {
                helper_strcpy(out + pos, prefix);
                pos += p_len;
            }
            
            int n_len = helper_strlen(ramdisk[i].name);
            if (pos + n_len < max_len) {
                helper_strcpy(out + pos, ramdisk[i].name);
                pos += n_len;
            }
            
            const char* mid = " (";
            int m_len = helper_strlen(mid);
            if (pos + m_len < max_len) {
                helper_strcpy(out + pos, mid);
                pos += m_len;
            }
            
            // Format file size integer to string
            char sz_str[16];
            int sz = ramdisk[i].size;
            int sz_idx = 0;
            if (sz == 0) {
                sz_str[sz_idx++] = '0';
            } else {
                char temp[16];
                int temp_idx = 0;
                while (sz > 0) {
                    temp[temp_idx++] = '0' + (sz % 10);
                    sz /= 10;
                }
                for (int j = temp_idx - 1; j >= 0; j--) {
                    sz_str[sz_idx++] = temp[j];
                }
            }
            sz_str[sz_idx] = '\0';
            
            if (pos + sz_idx < max_len) {
                helper_strcpy(out + pos, sz_str);
                pos += sz_idx;
            }
            
            const char* suffix = " bytes)\n";
            int s_len = helper_strlen(suffix);
            if (pos + s_len < max_len) {
                helper_strcpy(out + pos, suffix);
                pos += s_len;
            }
        }
    }
    
    if (file_count == 0) {
        const char* empty_msg = "[No files found]\n";
        int e_len = helper_strlen(empty_msg);
        if (pos + e_len < max_len) {
            helper_strcpy(out + pos, empty_msg);
            pos += e_len;
        }
    }
    
    return 1;
}

// Retrieve file data stream from RAM partition
int vfs_read(const char* name, char* out, int max_len) {
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (ramdisk[i].active && helper_strcmp(ramdisk[i].name, name) == 0) {
            int len = ramdisk[i].size;
            if (len >= max_len) {
                len = max_len - 1;
            }
            for (int j = 0; j < len; j++) {
                out[j] = ramdisk[i].content[j];
            }
            out[len] = '\0';
            return 1;
        }
    }
    return 0;
}

// Write/Create content blocks into active memory slots
int vfs_write(const char* name, const char* content) {
    int target_idx = -1;
    
    // Check if file already exists for overwriting
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (ramdisk[i].active && helper_strcmp(ramdisk[i].name, name) == 0) {
            target_idx = i;
            break;
        }
    }
    
    // If not exists, scan for first empty slot
    if (target_idx == -1) {
        for (int i = 0; i < MAX_VFS_FILES; i++) {
            if (!ramdisk[i].active) {
                target_idx = i;
                break;
            }
        }
    }
    
    if (target_idx == -1) {
        return 0; // RAM disk full
    }
    
    ramdisk[target_idx].active = 1;
    helper_strcpy(ramdisk[target_idx].name, name);
    
    int len = helper_strlen(content);
    if (len >= MAX_FILE_SIZE) {
        len = MAX_FILE_SIZE - 1;
    }
    
    for (int j = 0; j < len; j++) {
        ramdisk[target_idx].content[j] = content[j];
    }
    ramdisk[target_idx].content[len] = '\0';
    ramdisk[target_idx].size = len;
    
    return 1;
}

// Retract content allocations from slots
int vfs_delete(const char* name) {
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (ramdisk[i].active && helper_strcmp(ramdisk[i].name, name) == 0) {
            ramdisk[i].active = 0;
            ramdisk[i].name[0] = '\0';
            ramdisk[i].content[0] = '\0';
            ramdisk[i].size = 0;
            return 1;
        }
    }
    return 0;
}

// Find files by prefix for shell tab-completion
// Returns: number of matching files found (match_out filled if exactly 1 found)
int vfs_find_prefix(const char* prefix, char* match_out, int max_len) {
    int prefix_len = helper_strlen(prefix);
    int matches = 0;
    match_out[0] = '\0';

    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (!ramdisk[i].active) continue;

        // Compare name against prefix character by character
        int ok = 1;
        for (int j = 0; j < prefix_len; j++) {
            if (ramdisk[i].name[j] == '\0' || ramdisk[i].name[j] != prefix[j]) {
                ok = 0;
                break;
            }
        }

        if (ok) {
            matches++;
            if (matches == 1) {
                // Copy this match into output buffer
                int n_len = helper_strlen(ramdisk[i].name);
                if (n_len >= max_len) n_len = max_len - 1;
                for (int k = 0; k < n_len; k++) {
                    match_out[k] = ramdisk[i].name[k];
                }
                match_out[n_len] = '\0';
            }
        }
    }

    return matches;
}
