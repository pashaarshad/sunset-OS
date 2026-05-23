/* =====================================================================
 * 🌅 Sunset OS — LAZ Virtual File System & RAM Disk
 * File: vfs.h
 * Author: Arshad Pasha
 * Copyright (c) 2026 Arshad Pasha. All Rights Reserved.
 * License: Private. Authorized use only under the Sunset OS License Agreement.
 * Description: RAM disk with full directory-tree support.
 *              Supports mkdir, cd, ls, cat, touch, write, rm.
 * ===================================================================== */

#ifndef VFS_H
#define VFS_H

#define MAX_VFS_FILES  16
#define MAX_FILE_NAME  32
#define MAX_FILE_SIZE  512

typedef struct {
    char name[MAX_FILE_NAME];      /* Basename: "notes.txt" or "Documents"  */
    char parent[MAX_FILE_NAME];    /* Parent dir name; "" = root             */
    char content[MAX_FILE_SIZE];   /* File data (empty for directories)      */
    int  size;                     /* Bytes of content                       */
    char active;                   /* 1 = slot in use                        */
    char is_dir;                   /* 1 = directory, 0 = regular file        */
} vfs_file_t;

extern vfs_file_t ramdisk[MAX_VFS_FILES];

/* Lifecycle */
void vfs_init(void);

/* Directory listing — pass "" for root */
int  vfs_list      (const char* dir, char* out, int max_len);

/* File I/O — all relative to a directory ("" = root) */
int  vfs_read      (const char* name, const char* dir, char* out, int max_len);
int  vfs_write     (const char* name, const char* dir, const char* content);
int  vfs_delete    (const char* name, const char* dir);

/* Directory management */
int  vfs_mkdir     (const char* name, const char* parent_dir);
int  vfs_dir_exists(const char* name, const char* parent_dir);

/* Tab-completion: returns match count; fills match_out if exactly 1 found */
int  vfs_find_prefix(const char* dir, const char* prefix,
                     char* match_out, int max_len);

#endif
