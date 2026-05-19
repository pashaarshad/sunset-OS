import React, { useState, useEffect } from 'react';
import { Save, Check, FileText } from 'lucide-react';

export default function TextEditor({ fileId }) {
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  // Load file content from LocalStorage when fileId changes
  useEffect(() => {
    if (!fileId) return;
    const vfs = JSON.parse(localStorage.getItem('sunset_os_vfs') || '[]');
    const targetFile = vfs.find(item => item.id === fileId);
    if (targetFile) {
      setFileName(targetFile.name);
      setContent(targetFile.content || '');
      setIsSaved(true);
    }
  }, [fileId]);

  const handleSave = () => {
    const vfs = JSON.parse(localStorage.getItem('sunset_os_vfs') || '[]');
    const updatedVfs = vfs.map(item => 
      item.id === fileId ? { ...item, content: content } : item
    );
    localStorage.setItem('sunset_os_vfs', JSON.stringify(updatedVfs));
    setIsSaved(true);
    
    // Broadcast event to notify other applications
    window.dispatchEvent(new Event('sunset_vfs_changed'));
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  if (!fileId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 select-none bg-slate-950/20">
        <FileText className="w-12 h-12 mb-2 stroke-[1.5]" />
        <p>No document open. Open a file via the File Explorer.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/25 text-white font-sans text-sm selection:bg-orange-500/30">
      {/* Editor Header Status Bar */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-400" />
          <span className="font-semibold text-white/95">{fileName}</span>
          {!isSaved && <span className="text-xs text-orange-300 font-medium bg-orange-950/30 border border-orange-500/20 px-2 py-0.5 rounded-full">Modified</span>}
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaved}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
            isSaved 
              ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 cursor-default' 
              : 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer active:scale-95'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5" /> Saved
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" /> Save Changes
            </>
          )}
        </button>
      </div>

      {/* Main Text Editor Workspace */}
      <div className="flex-1 relative p-1 bg-black/10">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Start writing in your calm space..."
          className="w-full h-full p-6 bg-transparent text-white/90 border-0 outline-none resize-none font-mono text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>

      {/* Editor Footer / Info panel */}
      <div className="flex justify-between items-center px-4 py-2 border-t border-white/5 bg-slate-950/40 text-xs text-white/40">
        <span>Encoding: UTF-8</span>
        <span>Characters: {content.length} | Lines: {content.split('\n').length}</span>
      </div>
    </div>
  );
}
