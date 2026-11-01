import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

export interface OnlineTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl: string;
  streamUrl: string;
  durationSec?: number;
  isLiveRadio?: boolean;
  genre?: string;
}

interface MusicContextType {
  currentTrack: OnlineTrack | null;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: OnlineTrack[];
  favorites: OnlineTrack[];
  isMiniPlayerExpanded: boolean;
  setIsMiniPlayerExpanded: (expanded: boolean) => void;
  playTrack: (track: OnlineTrack, newQueue?: OnlineTrack[]) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrev: () => void;
  seekTo: (timeSec: number) => void;
  setVolume: (vol: number) => void;
  toggleFavorite: (track: OnlineTrack) => void;
  isFavorite: (trackId: string) => boolean;
  stopMusic: () => void;
}

const FAVORITES_STORAGE_KEY = 'mylifeos_favorite_songs_v1';

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<OnlineTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.9);
  const [queue, setQueue] = useState<OnlineTrack[]>([]);
  const [favorites, setFavorites] = useState<OnlineTrack[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isMiniPlayerExpanded, setIsMiniPlayerExpanded] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize persistent HTMLAudioElement
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else {
        setDuration(0);
      }
    };
    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoadingAudio(false);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoadingAudio(true);
    const onCanPlay = () => setIsLoadingAudio(false);
    const onError = () => {
      setIsLoadingAudio(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTrack = useCallback((track: OnlineTrack, newQueue?: OnlineTrack[]) => {
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    }
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.durationSec || 0);
    setIsLoadingAudio(true);

    const audio = audioRef.current;
    if (audio) {
      audio.src = track.streamUrl;
      audio.load();
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoadingAudio(false);
        })
        .catch((err) => {
          console.error('Audio playback failed:', err);
          setIsLoadingAudio(false);
          setIsPlaying(false);
        });
    }

    // Configure iOS / Safari Lock Screen MediaSession metadata
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album || 'MY LIFE OS Music',
          artwork: track.artworkUrl
            ? [{ src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
            : [],
        });
      } catch {
        // ignore
      }
    }
  }, []);

  const playNext = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = idx >= 0 && idx + 1 < queue.length ? idx + 1 : 0;
    playTrack(queue[nextIdx]);
  }, [currentTrack, queue, playTrack]);

  const playPrev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = idx > 0 ? idx - 1 : queue.length - 1;
    playTrack(queue[prevIdx]);
  }, [currentTrack, queue, playTrack]);

  // Auto-advance to next song when track ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (queue.length > 1) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [queue, playNext]);

  // Register iOS Lock Screen action handlers
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          audioRef.current?.play();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          audioRef.current?.pause();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          playNext();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          playPrev();
        });
      } catch {
        // ignore
      }
    }
  }, [playNext, playPrev]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((e) => console.error('Resume error:', e));
    }
  };

  const seekTo = (timeSec: number) => {
    const audio = audioRef.current;
    if (!audio || currentTrack?.isLiveRadio) return;
    audio.currentTime = timeSec;
    setCurrentTime(timeSec);
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const toggleFavorite = (track: OnlineTrack) => {
    setFavorites((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      const next = exists ? prev.filter((t) => t.id !== track.id) : [track, ...prev];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isFavorite = (trackId: string) => favorites.some((t) => t.id === trackId);

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoadingAudio,
        currentTime,
        duration,
        volume,
        queue,
        favorites,
        isMiniPlayerExpanded,
        setIsMiniPlayerExpanded,
        playTrack,
        togglePlayPause,
        playNext,
        playPrev,
        seekTo,
        setVolume,
        toggleFavorite,
        isFavorite,
        stopMusic,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return ctx;
}
