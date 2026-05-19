import React, { useState, useEffect } from 'react';
import { Folder, FileText, Music, Image, Video, Trash2, Edit2, Plus, ArrowLeft, Download } from 'lucide-react';

export default function FileManager({ openTextEditor, openMediaSuite }) {
  const [currentDir, setCurrentDir] = useState('root');
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  // 1. Load Virtual File System from LocalStorage (or initialize defaults)
  useEffect(() => {
    const savedFileSystem = localStorage.getItem('sunset_os_vfs');
    if (savedFileSystem) {
      setItems(JSON.parse(savedFileSystem));
    } else {
      const defaultVFS = [
        { id: '1', name: 'Documents', type: 'folder', parent: 'root' },
        { id: '2', name: 'Pictures', type: 'folder', parent: 'root' },
        { id: '3', name: 'Music', type: 'folder', parent: 'root' },
        { id: '4', name: 'Videos', type: 'folder', parent: 'root' },
        { id: '5', name: 'welcome.txt', type: 'file', parent: '1', content: "Welcome to Sunset OS (Ghuroob OS)!\n\nThis is a lightweight operating system inspired by the calmness of sunsets.\n\nTry opening the AI Voice Assistant by clicking the microphone on the taskbar and speak command words like:\n- 'Play music'\n- 'Open terminal'\n- 'Motivate me'\n\nHave a peaceful computing session!" },
        { id: '6', name: 'design_rules.txt', type: 'file', parent: '1', content: "Sunset OS Design Rules:\n\n1. Lightweight first\n2. Minimal RAM usage\n3. No unnecessary background processes\n4. Human-friendly interface\n5. Nature-inspired visuals\n6. Voice-first future\n7. Fast booting\n8. Calm experience" },
        { id: '7', name: 'motivation.txt', type: 'file', parent: '1', content: "A sunset is nature's beautiful way of showing that endings can be beautiful too.\n\nTake a deep breath. Let go of today's stress. You did your best, and tomorrow is a fresh start." },
        { id: '8', name: 'sunset_glow.png', type: 'image', parent: '2', content: '/src/assets/sunset_bg.png' },
        { id: '9', name: 'sunset_lofi.mp3', type: 'audio', parent: '3', content: 'Sunset Lofi Track' },
        { id: '10', name: 'calm_waves.mp4', type: 'video', parent: '4', content: 'Calming waves under a setting sun.' }
      ];
      setItems(defaultVFS);
      localStorage.setItem('sunset_os_vfs', JSON.stringify(defaultVFS));
    }
  }, []);

  const saveVFS = (newItems) => {
    setItems(newItems);
    localStorage.setItem('sunset_os_vfs', JSON.stringify(newItems));
    // Trigger virtual filesystem update event for other apps
    window.dispatchEvent(new Event('sunset_vfs_changed'));
  };

  // 2. Navigation Utilities
  const currentPathItems = items.filter(item => item.parent === currentDir);
  const currentParentDir = items.find(item => item.id === currentDir);

  const handleBack = () => {
    if (currentDir !== 'root' && currentParentDir) {
      setCurrentDir(currentParentDir.parent);
    }
  };

  // 3. Create, Delete, Rename operations
  const handleAddItem = (type) => {
    if (!newItemName.trim()) return;
    
    // Add extension automatically to files if not written
    let finalName = newItemName.trim();
    if (type === 'file' && !finalName.endsWith('.txt')) {
      finalName += '.txt';
    }

    const newItem = {
      id: Date.now().toString(),
      name: finalName,
      type: type,
      parent: currentDir,
      content: type === 'file' ? 'Type your content here...' : ''
    };

    saveVFS([...items, newItem]);
    setNewItemName('');
    setIsCreatingFolder(false);
    setIsCreatingFile(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const filterItems = (parentId) => {
      // Recursively delete folder children
      const children = items.filter(item => item.parent === parentId);
      let idsToDelete = [parentId];
      children.forEach(child => {
        if (child.type === 'folder') {
          idsToDelete = [...idsToDelete, ...filterItems(child.id)];
        } else {
          idsToDelete.push(child.id);
        }
      });
      return idsToDelete;
    };

    const targetItem = items.find(item => item.id === id);
    let idsToDelete = [id];
    if (targetItem && targetItem.type === 'folder') {
      idsToDelete = filterItems(id);
    }

    const newItems = items.filter(item => !idsToDelete.includes(item.id));
    saveVFS(newItems);
  };

  const handleStartRename = (item, e) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditName(item.name);
  };

  const handleSaveRename = (e) => {
    e.stopPropagation();
    if (!editName.trim()) return;
    const newItems = items.map(item => 
      item.id === editingId ? { ...item, name: editName.trim() } : item
    );
    saveVFS(newItems);
    setEditingId(null);
  };

  // 4. File Interaction
  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      setCurrentDir(item.id);
    } else if (item.type === 'file') {
      openTextEditor(item.id);
    } else if (item.type === 'image' || item.type === 'audio' || item.type === 'video') {
      openMediaSuite(item.type, item.id);
    }
  };

  // 5. Get descriptive icon
  const getIcon = (type) => {
    switch (type) {
      case 'folder': return <Folder className="w-10 h-10 text-amber-400 fill-amber-400/20" />;
      case 'audio': return <Music className="w-10 h-10 text-indigo-400 fill-indigo-400/20" />;
      case 'image': return <Image className="w-10 h-10 text-pink-400 fill-pink-400/20" />;
      case 'video': return <Video className="w-10 h-10 text-emerald-400 fill-emerald-400/20" />;
      default: return <FileText className="w-10 h-10 text-orange-300 fill-orange-300/20" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/20 text-white font-sans text-sm selection:bg-orange-500/30">
      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {currentDir !== 'root' && (
            <button onClick={handleBack} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="font-semibold text-white/95">
            Path: / {currentDir !== 'root' ? items.find(item => item.id === currentDir)?.name : 'Home'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setIsCreatingFile(false); setIsCreatingFolder(!isCreatingFolder); }} 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" /> New Folder
          </button>
          <button 
            onClick={() => { setIsCreatingFolder(false); setIsCreatingFile(!isCreatingFile); }} 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" /> New File
          </button>
        </div>
      </div>

      {/* Creation Inputs */}
      {(isCreatingFolder || isCreatingFile) && (
        <div className="p-3 border-b border-white/5 bg-black/20 flex gap-2 items-center">
          <input
            type="text"
            placeholder={isCreatingFolder ? "Folder name..." : "File name (e.g. notes.txt)..."}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1 glass-input text-xs"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(isCreatingFolder ? 'folder' : 'file')}
          />
          <button 
            onClick={() => handleAddItem(isCreatingFolder ? 'folder' : 'file')}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            Create
          </button>
          <button 
            onClick={() => { setIsCreatingFolder(false); setIsCreatingFile(false); setNewItemName(''); }}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* File List Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {currentPathItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-40">
            <Folder className="w-12 h-12 mb-2 stroke-[1.5]" />
            <p>This directory is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentPathItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 cursor-pointer transition-all duration-300"
              >
                {getIcon(item.type)}
                
                {/* Title and Editing logic */}
                <div className="mt-3 text-center w-full px-1">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleSaveRename}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e)}
                      className="w-full text-center glass-input text-xs py-0.5"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-xs font-medium text-white/90 truncate group-hover:text-orange-300 transition-colors">
                      {item.name}
                    </p>
                  )}
                </div>

                {/* Hover control actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity duration-200">
                  <button 
                    onClick={(e) => handleStartRename(item, e)}
                    className="p-1 rounded bg-black/40 hover:bg-black/80 transition-colors text-white/80"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1 rounded bg-red-950/40 hover:bg-red-600 transition-colors text-red-300"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
