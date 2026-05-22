/* =====================================================================
 * 🌅 Sunset OS — LAZ Virtual File System & RAM Disk
 * File: vfs.h
 * Description: RAM disk structure and file access interfaces.
 * ===================================================================== */

#ifndef VFS_H
#define VFS_H

#define MAX_VFS_FILES 8
#define MAX_FILE_NAME 32
#define MAX_FILE_SIZE 512

typedef struct {
    char name[MAX_FILE_NAME];
    char content[MAX_FILE_SIZE];
    int size;
    char active;
} vfs_file_t;

extern vfs_file_t ramdisk[MAX_VFS_FILES];

void vfs_init();
int vfs_list(char* out, int max_len);
int vfs_read(const char* name, char* out, int max_len);
int vfs_write(const char* name, const char* content);
int vfs_delete(const char* name);
int vfs_find_prefix(const char* prefix, char* match_out, int max_len);

#endif
