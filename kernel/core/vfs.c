/* =====================================================================
 * 🌅 Sunset OS — LAZ Virtual File System & RAM Disk
 * File: vfs.c
 * Author: Arshad Pasha
 * Copyright (c) 2026 Arshad Pasha. All Rights Reserved.
 * License: Private. Authorized use only under the Sunset OS License Agreement.
 * Description: RAM disk memory allocation with full directory support.
 *              mkdir, cd, ls, cat, touch, write, rm — all freestanding.
 * ===================================================================== */

#include "vfs.h"

vfs_file_t ramdisk[MAX_VFS_FILES];

/* ── Private helpers ── */

static void s_cpy(char* dst, const char* src) {
    int i = 0;
    while (src[i]) { dst[i] = src[i]; i++; }
    dst[i] = '\0';
}

static int s_cmp(const char* a, const char* b) {
    int i = 0;
    while (a[i] && b[i]) {
        if (a[i] != b[i]) return a[i] - b[i];
        i++;
    }
    return a[i] - b[i];
}

static int s_len(const char* s) {
    int n = 0; while (s[n]) n++; return n;
}

/* Append string into buf[pos..max_len-1], return new pos */
static int s_app(char* buf, int pos, int max, const char* src) {
    for (int i = 0; src[i] && pos < max - 1; i++)
        buf[pos++] = src[i];
    buf[pos] = '\0';
    return pos;
}

/* Append integer as decimal string */
static int s_app_int(char* buf, int pos, int max, int val) {
    char tmp[12]; int i = 0;
    if (val == 0) { tmp[i++] = '0'; }
    else {
        char rev[12]; int r = 0;
        while (val > 0) { rev[r++] = '0' + val % 10; val /= 10; }
        for (int j = r - 1; j >= 0; j--) tmp[i++] = rev[j];
    }
    tmp[i] = '\0';
    return s_app(buf, pos, max, tmp);
}

/* ── Public API ── */

void vfs_init(void) {
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        ramdisk[i].active  = 0;
        ramdisk[i].is_dir  = 0;
        ramdisk[i].size    = 0;
        ramdisk[i].name[0]    = '\0';
        ramdisk[i].parent[0]  = '\0';
        ramdisk[i].content[0] = '\0';
    }

    /* ── Default directory tree ── */
    vfs_mkdir("Documents", "");
    vfs_mkdir("Music",     "");
    vfs_mkdir("Downloads", "");
    vfs_mkdir("Projects",  "");

    /* ── Root-level files ── */
    vfs_write("welcome.txt", "",
        "Welcome to Sunset OS!\n"
        "A digital sanctuary for serene, focused computing.\n"
        "Breathe in. Rest. Reflect.");

    vfs_write("notes.txt", "",
        "WELCOME TO SUNSET OS\n"
        "Calm. Intelligent. Yours.\n\n"
        "Use: note [msg] to append here.\n"
        "Breathe in. Rest. Reflect.");

    /* ── Documents/ ── */
    vfs_write("philosophy.txt", "Documents",
        "Sunset OS represents the calm interval\n"
        "between Asr and Maghrib — a restorative\n"
        "time that refreshes, motivates, inspires.\n"
        "Designed to minimize distractions.");

    vfs_write("todo.txt", "Documents",
        "[ ] Take a deep breath.\n"
        "[ ] Stretch for 2 minutes.\n"
        "[ ] Rest your eyes from the screen.\n"
        "[ ] Hydrate. Drink water.");

    vfs_write("readme.txt", "Documents",
        "Sunset OS File System\n"
        "=====================\n"
        "Commands:\n"
        "  ls          - list current directory\n"
        "  cd <dir>    - enter directory\n"
        "  cd ..       - go up to parent\n"
        "  pwd         - show current path\n"
        "  mkdir <dir> - create new directory\n"
        "  cat <file>  - read file\n"
        "  touch <f>   - create empty file\n"
        "  write <f>   - write content to file\n"
        "  rm <file>   - delete file");
}

/* List directory contents */
int vfs_list(const char* dir, char* out, int max_len) {
    int pos = 0;
    out[0] = '\0';

    pos = s_app(out, pos, max_len, "\n /");
    if (dir[0]) pos = s_app(out, pos, max_len, dir);
    pos = s_app(out, pos, max_len, "\n");

    int count = 0;
    /* Directories first */
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (!ramdisk[i].active) continue;
        if (!ramdisk[i].is_dir) continue;
        if (s_cmp(ramdisk[i].parent, dir) != 0) continue;
        count++;
        pos = s_app(out, pos, max_len, "  [DIR]  ");
        pos = s_app(out, pos, max_len, ramdisk[i].name);
        pos = s_app(out, pos, max_len, "/\n");
    }
    /* Files next */
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (!ramdisk[i].active) continue;
        if (ramdisk[i].is_dir) continue;
        if (s_cmp(ramdisk[i].parent, dir) != 0) continue;
        count++;
        pos = s_app(out, pos, max_len, "  [FILE] ");
        pos = s_app(out, pos, max_len, ramdisk[i].name);
        pos = s_app(out, pos, max_len, "  (");
        pos = s_app_int(out, pos, max_len, ramdisk[i].size);
        pos = s_app(out, pos, max_len, " B)\n");
    }
    if (count == 0)
        pos = s_app(out, pos, max_len, "  (empty)\n");

    return 1;
}

/* Read a file */
int vfs_read(const char* name, const char* dir, char* out, int max_len) {
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (!ramdisk[i].active || ramdisk[i].is_dir) continue;
        if (s_cmp(ramdisk[i].name,   name) != 0) continue;
        if (s_cmp(ramdisk[i].parent, dir)  != 0) continue;
        int len = ramdisk[i].size;
        if (len >= max_len) len = max_len - 1;
        for (int j = 0; j < len; j++) out[j] = ramdisk[i].content[j];
        out[len] = '\0';
        return 1;
    }
    return 0;
}

/* Write / create a file */
int vfs_write(const char* name, const char* dir, const char* content) {
    int tgt = -1;
    /* Overwrite existing */
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (ramdisk[i].active && !ramdisk[i].is_dir &&
            s_cmp(ramdisk[i].name,   name) == 0 &&
            s_cmp(ramdisk[i].parent, dir)  == 0) { tgt = i; break; }
    }
    /* Empty slot */
    if (tgt == -1) {
        for (int i = 0; i < MAX_VFS_FILES; i++) {
            if (!ramdisk[i].active) { tgt = i; break; }
        }
    }
    if (tgt == -1) return 0; /* RAM disk full */

    ramdisk[tgt].active = 1;
    ramdisk[tgt].is_dir = 0;
    s_cpy(ramdisk[tgt].name,   name);
    s_cpy(ramdisk[tgt].parent, dir);

    int len = s_len(content);
    if (len >= MAX_FILE_SIZE) len = MAX_FILE_SIZE - 1;
    for (int j = 0; j < len; j++) ramdisk[tgt].content[j] = content[j];
    ramdisk[tgt].content[len] = '\0';
    ramdisk[tgt].size = len;
    return 1;
}

/* Delete a file */
int vfs_delete(const char* name, const char* dir) {
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (!ramdisk[i].active) continue;
        if (ramdisk[i].is_dir)  continue;
        if (s_cmp(ramdisk[i].name,   name) != 0) continue;
        if (s_cmp(ramdisk[i].parent, dir)  != 0) continue;
        ramdisk[i].active     = 0;
        ramdisk[i].is_dir     = 0;
        ramdisk[i].size       = 0;
        ramdisk[i].name[0]    = '\0';
        ramdisk[i].parent[0]  = '\0';
        ramdisk[i].content[0] = '\0';
        return 1;
    }
    return 0;
}

/* Create a directory */
int vfs_mkdir(const char* name, const char* parent_dir) {
    /* Already exists? */
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (ramdisk[i].active && ramdisk[i].is_dir &&
            s_cmp(ramdisk[i].name,   name)       == 0 &&
            s_cmp(ramdisk[i].parent, parent_dir) == 0)
            return 0;
    }
    int tgt = -1;
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (!ramdisk[i].active) { tgt = i; break; }
    }
    if (tgt == -1) return 0;

    ramdisk[tgt].active     = 1;
    ramdisk[tgt].is_dir     = 1;
    ramdisk[tgt].size       = 0;
    ramdisk[tgt].content[0] = '\0';
    s_cpy(ramdisk[tgt].name,   name);
    s_cpy(ramdisk[tgt].parent, parent_dir);
    return 1;
}

/* Check if a directory exists */
int vfs_dir_exists(const char* name, const char* parent_dir) {
    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (ramdisk[i].active && ramdisk[i].is_dir &&
            s_cmp(ramdisk[i].name,   name)       == 0 &&
            s_cmp(ramdisk[i].parent, parent_dir) == 0)
            return 1;
    }
    return 0;
}

/* Tab-completion: find filenames/dirnames in `dir` starting with `prefix`.
   Returns match count; fills match_out when exactly 1 match found. */
int vfs_find_prefix(const char* dir, const char* prefix,
                    char* match_out, int max_len) {
    int pfx_len = s_len(prefix);
    int matches = 0;
    match_out[0] = '\0';

    for (int i = 0; i < MAX_VFS_FILES; i++) {
        if (!ramdisk[i].active) continue;
        if (s_cmp(ramdisk[i].parent, dir) != 0) continue;

        /* Prefix match */
        int ok = 1;
        for (int j = 0; j < pfx_len; j++) {
            if (!ramdisk[i].name[j] || ramdisk[i].name[j] != prefix[j]) {
                ok = 0; break;
            }
        }
        if (!ok) continue;

        matches++;
        if (matches == 1) {
            int n = s_len(ramdisk[i].name);
            if (n >= max_len) n = max_len - 1;
            for (int k = 0; k < n; k++) match_out[k] = ramdisk[i].name[k];
            match_out[n] = '\0';
        }
    }
    return matches;
}
