import React from 'react';
import { useMusic } from '../../context/MusicContext';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Heart,
  Loader2,
  Radio,
} from 'lucide-react';

interface FloatingMiniPlayerProps {
  onOpenFullPlayer: () => void;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  onOpenFullPlayer,
}) => {
  const {
    currentTrack,
    isPlaying,
    isLoadingAudio,
    currentTime,
    duration,
    togglePlayPause,
    playNext,
    playPrev,
    toggleFavorite,
    isFavorite,
    stopMusic,
  } = useMusic();

  if (!currentTrack) return null;

  const progressPct =
    duration > 0 && !currentTrack.isLiveRadio
      ? Math.min(100, (currentTime / duration) * 100)
      : 100;

  const liked = isFavorite(currentTrack.id);

  return (
    <div className="sticky bottom-16 z-40 px-3 pb-1.5">
      <div className="rounded-2xl bg-slate-900/95 dark:bg-[#141927]/95 text-white border border-white/15 shadow-2xl overflow-hidden">
        {/* Progress hairline */}
        <div className="w-full h-0.5 bg-white/10">
          <div
            className={`h-full transition-all duration-200 ${
              currentTrack.isLiveRadio
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="p-2.5 flex items-center justify-between gap-2">
          {/* Artwork & Track Info (tappable to open full Music Player) */}
          <button
            onClick={onOpenFullPlayer}
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-indigo-950 shrink-0 border border-white/10">
              {currentTrack.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover ${
                    isPlaying ? 'scale-105 transition-transform duration-700' : ''
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-400">
                  <Radio className="w-5 h-5" />
                </div>
              )}
              {currentTrack.isLiveRadio && (
                <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {currentTrack.isLiveRadio && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-mono font-bold uppercase shrink-0">
                    LIVE
                  </span>
                )}
                <p className="text-xs font-bold text-white truncate">
                  {currentTrack.title}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {currentTrack.artist}
              </p>
            </div>
          </button>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => toggleFavorite(currentTrack)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-400 transition"
              aria-label="Favorite"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  liked ? 'text-rose-500 fill-rose-500' : ''
                }`}
              />
            </button>

            <button
              onClick={playPrev}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition"
              aria-label="Previous"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md active:scale-95 transition"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition"
              aria-label="Next"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={stopMusic}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 transition"
              aria-label="Close Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
