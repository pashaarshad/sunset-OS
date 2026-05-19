import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Volume2, Image as ImageIcon, Music as MusicIcon, Video as VideoIcon } from 'lucide-react';
import sunsetImage from '../assets/sunset_bg.png';

export default function MediaSuite({ initialTab = 'image', initialFileId = null }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'image' | 'audio' | 'video'
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  
  // Video state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);

  // Sync state if external file triggers app
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, initialFileId]);

  // Ambient sound system triggers (Syncing standard html audio is optional; we simulate it beautifully!)
  useEffect(() => {
    let timer;
    if (isPlaying && activeTab === 'audio') {
      timer = setInterval(() => {
        setCurrentTime((prev) => (prev >= 180 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeTab]);

  useEffect(() => {
    let videoTimer;
    if (isVideoPlaying && activeTab === 'video') {
      videoTimer = setInterval(() => {
        setVideoTime((prev) => (prev >= 120 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(videoTimer);
  }, [isVideoPlaying, activeTab]);

  const lofiTracks = [
    { name: "Sunset Reflections", artist: "Ghuroob Lo-Fi", length: "03:00" },
    { name: "AP Bootloader Beats", artist: "Kernel Beats", length: "02:45" },
    { name: "LAZ Kernel Calmness", artist: "Ambient Nature", length: "04:15" }
  ];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex h-full bg-slate-950/20 text-white font-sans text-sm selection:bg-orange-500/30">
      
      {/* Side Tabs Navigation */}
      <div className="w-16 border-r border-white/5 bg-slate-950/40 flex flex-col items-center py-6 gap-6">
        <button 
          onClick={() => setActiveTab('image')}
          className={`p-3 rounded-xl transition-all duration-300 ${activeTab === 'image' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          title="Image Viewer"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveTab('audio')}
          className={`p-3 rounded-xl transition-all duration-300 ${activeTab === 'audio' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          title="Music Player"
        >
          <MusicIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveTab('video')}
          className={`p-3 rounded-xl transition-all duration-300 ${activeTab === 'video' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          title="Video Player"
        >
          <VideoIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Media Active Screen */}
      <div className="flex-1 flex flex-col bg-slate-950/25">
        
        {/* 🌅 IMAGE VIEWER TAB */}
        {activeTab === 'image' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 select-none relative">
            <div className="w-full max-w-xl aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl relative group">
              <img 
                src={sunsetImage} 
                alt="Sunset Glow"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div>
                  <h4 className="font-bold text-white text-sm">sunset_glow.png</h4>
                  <p className="text-xs text-white/70">Generated using nano banana AI wallpaper tech</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-white/50">Wallpaper resolution: 1920x1080 | Vector Flat Art</p>
          </div>
        )}

        {/* 🎵 AUDIO PLAYER TAB */}
        {activeTab === 'audio' && (
          <div className="flex-1 flex flex-col justify-between p-8 select-none">
            {/* Visualizer Disk & Tracks */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-4">
              
              {/* Rotating Sunset Record Disk */}
              <div className="relative">
                <div className={`w-40 h-40 rounded-full border-4 border-white/5 bg-gradient-to-tr from-amber-600 via-orange-500 to-indigo-700 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                  <div className="w-14 h-14 rounded-full bg-slate-950 flex items-center justify-center border-2 border-white/10">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  </div>
                </div>
                {/* Audio Waves bars */}
                {isPlaying && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 h-8 px-3 rounded-full bg-black/40 border border-white/5">
                    <span className="eq-bar"></span>
                    <span className="eq-bar"></span>
                    <span className="eq-bar"></span>
                    <span className="eq-bar"></span>
                    <span className="eq-bar"></span>
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="text-center md:text-left flex-1 max-w-sm">
                <h3 className="text-lg font-bold text-white/95 truncate">{lofiTracks[trackIndex].name}</h3>
                <p className="text-sm text-indigo-400 font-medium">{lofiTracks[trackIndex].artist}</p>
                
                {/* Track Playlist */}
                <div className="mt-4 p-2 rounded-xl bg-black/20 border border-white/5 max-h-36 overflow-y-auto">
                  {lofiTracks.map((track, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setTrackIndex(i); setCurrentTime(0); }}
                      className={`flex justify-between items-center px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${i === trackIndex ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/20' : 'hover:bg-white/5 text-white/60'}`}
                    >
                      <span className="truncate max-w-[150px]">{track.name}</span>
                      <span className="opacity-60">{track.length}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="border-t border-white/5 pt-6 flex flex-col gap-3">
              {/* Progress Slider */}
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span>{formatTime(currentTime)}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden relative cursor-pointer">
                  <div 
                    className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${(currentTime / 180) * 100}%` }}
                  ></div>
                </div>
                <span>{lofiTracks[trackIndex].length}</span>
              </div>

              {/* Play/Pause center control */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <Volume2 className="w-4 h-4" />
                  <span>80%</span>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setTrackIndex(prev => (prev === 0 ? lofiTracks.length - 1 : prev - 1)); setCurrentTime(0); }}
                    className="p-2 rounded-full hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  >
                    <SkipForward className="w-4 h-4 rotate-180" />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-4 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all duration-200"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>
                  <button 
                    onClick={() => { setTrackIndex(prev => (prev === lofiTracks.length - 1 ? 0 : prev + 1)); setCurrentTime(0); }}
                    className="p-2 rounded-full hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-12"></div> {/* Spacer */}
              </div>
            </div>
          </div>
        )}

        {/* 🎬 VIDEO PLAYER TAB */}
        {activeTab === 'video' && (
          <div className="flex-1 flex flex-col justify-between p-6 select-none">
            {/* Simulated Nature Video Canvas */}
            <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl relative flex items-center justify-center">
              {/* Beautiful Simulated Animated Background representing relaxing video */}
              <div className={`absolute inset-0 bg-gradient-to-b from-indigo-950 via-pink-950 to-amber-950 flex items-center justify-center transition-all duration-500 ${isVideoPlaying ? 'opacity-90 saturate-150' : 'opacity-65 saturate-50'}`}>
                {/* Visual Sun and relaxing ocean wave lines */}
                <div className="w-32 h-32 rounded-full bg-amber-500 opacity-60 absolute top-12 blur-lg"></div>
                <div className="w-36 h-36 rounded-full bg-orange-600 opacity-40 absolute top-10 blur-xl"></div>
                
                {/* Ocean Wave simulation */}
                <div className="absolute bottom-0 w-full h-1/3 bg-blue-900/30 backdrop-blur-sm flex items-end">
                  <div className={`w-full h-8 bg-blue-800/20 blur-md ${isVideoPlaying ? 'animate-pulse' : ''}`}></div>
                </div>
              </div>
              
              {!isVideoPlaying && (
                <button 
                  onClick={() => setIsVideoPlaying(true)}
                  className="z-10 p-5 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all duration-300"
                >
                  <Play className="w-8 h-8 fill-white ml-1" />
                </button>
              )}
              
              {/* Watermark overlay */}
              <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] text-white/70">
                🔴 Relaxing Waves under Twilight.mp4
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span>{formatTime(videoTime)}</span>
                <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden relative cursor-pointer">
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${(videoTime / 120) * 100}%` }}
                  ></div>
                </div>
                <span>02:00</span>
              </div>
              
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {isVideoPlaying ? <><Pause className="w-3.5 h-3.5 fill-white" /> Pause</> : <><Play className="w-3.5 h-3.5 fill-white" /> Play video</>}
                </button>
                <span className="text-[10px] text-white/30">Lofi Nature Theater</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
