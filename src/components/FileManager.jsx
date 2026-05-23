import React, { useState, useEffect } from 'react';
import { 
  Folder, FileText, Music, Image, Video, Trash2, Edit2, Plus, 
  ArrowLeft, Download, Home, Monitor, Info
} from 'lucide-react';

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
        { id: 'desktop', name: 'Desktop', type: 'folder', parent: 'root' },
        { id: '1', name: 'Documents', type: 'folder', parent: 'root' },
        { id: 'downloads', name: 'Downloads', type: 'folder', parent: 'root' },
        { id: '3', name: 'Music', type: 'folder', parent: 'root' },
        { id: '2', name: 'Pictures', type: 'folder', parent: 'root' },
        { id: 'projects', name: 'Projects', type: 'folder', parent: 'root' },
        { id: '4', name: 'Videos', type: 'folder', parent: 'root' },
        { id: 'notes_file', name: 'Notes.txt', type: 'file', parent: 'root', content: "Sunset OS - Notes\n\n- Build high-fidelity split-pane File Manager.\n- Implement independent Multi-tab Terminal Consolidation.\n- Style centered floating bottom Dock.\n\nEnjoy the tranquil computing!" },
        
        { id: 'welcome_doc', name: 'welcome.txt', type: 'file', parent: '1', content: "Welcome to Sunset OS (Ghuroob OS)!\n\nThis is a lightweight operating system inspired by the calmness of sunsets.\n\nTry opening the AI Voice Assistant by clicking the microphone on the taskbar and speak command words like:\n- 'Play music'\n- 'Open terminal'\n- 'Motivate me'\n\nHave a peaceful computing session!" },
        { id: 'design_doc', name: 'design_rules.txt', type: 'file', parent: '1', content: "Sunset OS Design Rules:\n\n1. Lightweight first\n2. Minimal RAM usage\n3. No unnecessary background processes\n4. Human-friendly interface\n5. Nature-inspired visuals\n6. Voice-first future\n7. Fast booting\n8. Calm experience" },
        { id: 'motivation_doc', name: 'motivation.txt', type: 'file', parent: '1', content: "A sunset is nature's beautiful way of showing that endings can be beautiful too.\n\nTake a deep breath. Let go of today's stress. You did your best, and tomorrow is a fresh start." },
        { id: '8', name: 'sunset_glow.png', type: 'image', parent: '2', content: '/src/assets/sunset_bg.png' },
        { id: '9', name: 'sunset_lofi.mp3', type: 'audio', parent: '3', content: 'Sunset Lofi Track' },
        { id: '10', name: 'calm_waves.mp4', type: 'video', parent: '4', content: 'Calming waves under a setting sun.' },
        
        { id: 'welcome_desk', name: 'welcome_sunset.txt', type: 'file', parent: 'desktop', content: 'Welcome to Sunset OS Desktop!\n\nThis is your tranquil workspace. Place files and folder short-cuts here.' },
        { id: 'download_item', name: 'zen_wallpaper.png', type: 'image', parent: 'downloads', content: '/src/assets/sunset_bg.png' }
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

  // 5. Sidebar mapping items
  const sidebarItems = [
    { label: 'Home', id: 'root', icon: <Home className="w-4 h-4" /> },
    { label: 'Desktop', id: 'desktop', icon: <Monitor className="w-4 h-4" /> },
    { label: 'Documents', id: '1', icon: <Info className="w-4 h-4" /> },
    { label: 'Downloads', id: 'downloads', icon: <Download className="w-4 h-4" /> },
    { label: 'Music', id: '3', icon: <Music className="w-4 h-4" /> },
    { label: 'Pictures', id: '2', icon: <Image className="w-4 h-4" /> },
    { label: 'Videos', id: '4', icon: <Video className="w-4 h-4" /> },
    { label: 'Trash', id: 'trash', icon: <Trash2 className="w-4 h-4" /> },
  ];

  // 6. Premium custom folder & document renderers using peach-to-pink linear gradients
  const renderItemVisual = (item) => {
    if (item.type === 'folder') {
      let innerIcon = null;
      const lowerName = item.name.toLowerCase();
      if (lowerName.includes('desktop')) {
        innerIcon = (
          <>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </>
        );
      } else if (lowerName.includes('document')) {
        innerIcon = (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </>
        );
      } else if (lowerName.includes('download')) {
        innerIcon = (
          <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </>
        );
      } else if (lowerName.includes('music')) {
        innerIcon = (
          <>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </>
        );
      } else if (lowerName.includes('picture') || lowerName.includes('photo')) {
        innerIcon = (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </>
        );
      } else if (lowerName.includes('project') || lowerName.includes('code')) {
        innerIcon = (
          <>
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </>
        );
      } else if (lowerName.includes('video') || lowerName.includes('movie')) {
        innerIcon = (
          <>
            <polygon points="5 3 19 12 5 21 5 3" />
          </>
        );
      } else if (lowerName.includes('trash')) {
        innerIcon = (
          <>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </>
        );
      } else {
        innerIcon = (
          <>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </>
        );
      }

      return (
        <svg className="w-12 h-12 filter drop-shadow-md group-hover:scale-105 transition-all duration-300" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`folderGrad-${item.id}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffb347" />
              <stop offset="40%" stopColor="#ffcc33" />
              <stop offset="75%" stopColor="#ff6b6b" />
              <stop offset="100%" stopColor="#e94e77" />
            </linearGradient>
          </defs>
          <path d="M4 14C4 11.8 5.8 10 8 10H22L28 16H56C58.2 16 60 17.8 60 20V50C60 52.2 58.2 54 56 54H8C5.8 54 4 52.2 4 50V14Z" fill={`url(#folderGrad-${item.id})`} opacity="0.85" />
          <path d="M4 22C4 19.8 5.8 18 8 18H56C58.2 18 60 19.8 60 22V50C60 52.2 58.2 54 56 54H8C5.8 54 4 52.2 4 50V22Z" fill={`url(#folderGrad-${item.id})`} />
          <path d="M8 18H56C57.1 18 58 18.9 58 20C58 20.55 57.55 21 57 21H7C6.45 21 6 20.55 6 20C6 18.9 6.9 18 8 18Z" fill="white" opacity="0.15" />
          <rect x="22" y="28" width="20" height="18" rx="4" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
          <g transform="translate(24, 30) scale(0.65)" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {innerIcon}
          </g>
        </svg>
      );
    } else {
      return (
        <svg className="w-12 h-12 filter drop-shadow-md group-hover:scale-105 transition-all duration-300" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`docGrad-${item.id}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f4d03f" />
              <stop offset="60%" stopColor="#e67e22" />
              <stop offset="100%" stopColor="#e74c3c" />
            </linearGradient>
          </defs>
          <path d="M12 8C12 5.8 13.8 4 16 4H40L52 16V56C52 58.2 50.2 60 48 60H16C13.8 60 12 58.2 12 56V8Z" fill={`url(#docGrad-${item.id})`} />
          <path d="M40 4V12C40 14.2 41.8 16 44 16H52L40 4Z" fill="black" fillOpacity="0.2" />
          <line x1="20" y1="26" x2="44" y2="26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />
          <line x1="20" y1="34" x2="44" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />
          <line x1="20" y1="42" x2="36" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />
        </svg>
      );
    }
  };

  return (
    <div className="flex h-full bg-[#1e1014]/90 text-white font-sans text-xs selection:bg-orange-500/30">
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <div className="w-[160px] bg-[#14080a]/95 border-r border-white/5 flex flex-col py-4 select-none shrink-0">
        <div className="px-4 mb-4 flex items-center justify-between opacity-50">
          <span className="text-[9px] tracking-wider uppercase font-semibold text-[#ffdcd4]">Places</span>
        </div>
        
        <nav className="flex-1 flex flex-col gap-0.5 px-2">
          {sidebarItems.map((item) => {
            const isActive = currentDir === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setCurrentDir(item.id)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[11px] font-medium cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.15)] font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={isActive ? 'text-orange-400' : 'text-white/50'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* 2. RIGHT FILE MANAGER VIEW */}
      <div className="flex-1 flex flex-col bg-[#1c0f12]/30 overflow-hidden">
        
        {/* Navigation / Actions Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/15 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            {currentDir !== 'root' && (
              <button 
                onClick={handleBack} 
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex items-center gap-1 bg-black/30 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white/70">
              <span className="opacity-40">./home/ghuroob</span>
              {currentDir !== 'root' && (
                <>
                  <span className="opacity-30">/</span>
                  <span className="text-orange-300 font-semibold">{items.find(item => item.id === currentDir)?.name}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => { setIsCreatingFile(false); setIsCreatingFolder(!isCreatingFolder); }} 
              className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold rounded-lg bg-[#f39c12]/10 text-[#ffb347] border border-[#f39c12]/20 hover:bg-[#f39c12]/20 transition-all duration-300"
            >
              <Plus className="w-2.5 h-2.5" /> Folder
            </button>
            <button 
              onClick={() => { setIsCreatingFolder(false); setIsCreatingFile(!isCreatingFile); }} 
              className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold rounded-lg bg-[#e74c3c]/10 text-[#ff6b6b] border border-[#e74c3c]/20 hover:bg-[#e74c3c]/20 transition-all duration-300"
            >
              <Plus className="w-2.5 h-2.5" /> File
            </button>
          </div>
        </div>

        {/* Create Input Box */}
        {(isCreatingFolder || isCreatingFile) && (
          <div className="p-2.5 border-b border-white/5 bg-black/30 flex gap-2 items-center shrink-0">
            <input
              type="text"
              placeholder={isCreatingFolder ? "Folder name..." : "File name (e.g. notes.txt)..."}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-xs text-white outline-none focus:border-orange-500/50"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem(isCreatingFolder ? 'folder' : 'file')}
            />
            <button 
              onClick={() => handleAddItem(isCreatingFolder ? 'folder' : 'file')}
              className="px-3 py-1 text-[10px] font-semibold rounded bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white transition-colors"
            >
              Create
            </button>
            <button 
              onClick={() => { setIsCreatingFolder(false); setIsCreatingFile(false); setNewItemName(''); }}
              className="px-3 py-1 text-[10px] font-semibold rounded bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Content Explorer Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentPathItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 opacity-25">
              <Folder className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="font-medium text-[10px]">tranquil and empty space</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {currentPathItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group relative flex flex-col items-center justify-center p-2.5 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 cursor-pointer transition-all duration-300"
                >
                  
                  {/* Premium customized vector visual with peach-pink gradient */}
                  {renderItemVisual(item)}

                  {/* Title and Editing text fields */}
                  <div className="mt-2 text-center w-full px-1">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e)}
                        className="w-full text-center bg-black/60 border border-orange-500/30 rounded px-1 py-0.5 text-[10px] outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className="text-[10px] font-semibold text-[#ffdcd4] truncate group-hover:text-orange-300 transition-colors">
                        {item.name}
                      </p>
                    )}
                  </div>

                  {/* Action overlays on hover */}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity duration-200">
                    <button 
                      onClick={(e) => handleStartRename(item, e)}
                      className="p-1 rounded bg-black/60 hover:bg-black text-white/80 transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 rounded bg-red-950/60 hover:bg-red-700 text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
