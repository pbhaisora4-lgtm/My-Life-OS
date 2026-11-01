import React, { useState, useEffect } from 'react';
import { useMusic, OnlineTrack } from '../../context/MusicContext';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  Music,
  Search,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Radio,
  Volume2,
  Loader2,
  Sparkles,
  Disc,
  Flame,
  Headphones,
} from 'lucide-react';

type MusicTab = 'songs' | 'radio' | 'favorites';

const QUICK_CATEGORIES = [
  { label: '🔥 Bollywood Hits', query: 'Arijit Singh Bollywood Hits' },
  { label: '⚡ Punjabi Beats', query: 'Diljit Dosanjh AP Dhillon Karan Aujla' },
  { label: '💪 Gym Workout', query: 'Gym Workout Phonk Motivation' },
  { label: '🎧 Lo-Fi Focus', query: 'Lofi Chillhop Study Beats' },
  { label: '🌙 Hindi Romantic', query: 'Atif Aslam Shreya Ghoshal Pritam' },
  { label: '🌎 Global Pop', query: 'The Weeknd Coldplay Dua Lipa' },
];

const CURATED_LIVE_STATIONS: OnlineTrack[] = [
  {
    id: 'radio_bollywood_1',
    title: 'Radio Mirchi / Desi Bollywood 24/7',
    artist: 'Non-Stop Hindi & Bollywood Hits',
    album: 'Live Online FM',
    artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    streamUrl: 'https://stream.zeno.fm/0r0xa792kwzuv',
    isLiveRadio: true,
    genre: 'Bollywood',
  },
  {
    id: 'radio_lofi_groove',
    title: 'Groove Salad · Chill & Lo-Fi Beats',
    artist: 'SomaFM 24/7 Deep Study Stream',
    album: 'Ambient & Chillhop',
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    streamUrl: 'https://ice2.somafm.com/groovesalad-128-mp3',
    isLiveRadio: true,
    genre: 'Lo-Fi Focus',
  },
  {
    id: 'radio_defcon_cyber',
    title: 'DEF CON Hacker & Coding Radio',
    artist: 'Electronic · Synthwave · Deep Work',
    album: 'SomaFM Live',
    artworkUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=80',
    streamUrl: 'https://ice2.somafm.com/defcon-128-mp3',
    isLiveRadio: true,
    genre: 'Coding & Tech',
  },
  {
    id: 'radio_workout_beat',
    title: 'The Trip · High-Energy Workout EDM',
    artist: 'Progressive House & Trance 24/7',
    album: 'Gym & Cardio Stream',
    artworkUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&auto=format&fit=crop&q=80',
    streamUrl: 'https://ice2.somafm.com/thetrip-128-mp3',
    isLiveRadio: true,
    genre: 'Gym & Cardio',
  },
  {
    id: 'radio_drone_sleep',
    title: 'Drone Zone · Deep Meditation & Sleep',
    artist: 'Atmospheric Ambient Textures',
    album: 'Mindfulness & Rest',
    artworkUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
    streamUrl: 'https://ice2.somafm.com/dronezone-128-mp3',
    isLiveRadio: true,
    genre: 'Sleep & Calm',
  },
];

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec) || sec < 0) return '0:00';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const MusicPlayerModule: React.FC<{ onOpenAIStudio?: () => void }> = ({
  onOpenAIStudio,
}) => {
  const {
    currentTrack,
    isPlaying,
    isLoadingAudio,
    currentTime,
    duration,
    volume,
    favorites,
    playTrack,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
    setVolume,
    toggleFavorite,
    isFavorite,
  } = useMusic();
  const { showIslandNotice } = useLifeOS();

  const [activeTab, setActiveTab] = useState<MusicTab>('songs');
  const [searchQuery, setSearchQuery] = useState<string>('Arijit Singh Bollywood Hits');
  const [songResults, setSongResults] = useState<OnlineTrack[]>([]);
  const [isSearchingSongs, setIsSearchingSongs] = useState<boolean>(false);

  // Live Radio Search state
  const [radioQuery, setRadioQuery] = useState<string>('');
  const [radioResults, setRadioResults] = useState<OnlineTrack[]>(CURATED_LIVE_STATIONS);
  const [isSearchingRadio, setIsSearchingRadio] = useState<boolean>(false);

  const searchOnlineSongs = async (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setIsSearchingSongs(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          setSongResults(data.tracks);
          setIsSearchingSongs(false);
          return;
        }
      }

      // Direct client fallback to Saavn 320kbps Full Song API
      const directRes = await fetch(
        `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(clean)}&limit=30`
      );
      const directData = await directRes.json();
      const rawResults: any[] = directData?.data?.results || [];
      const tracks: OnlineTrack[] = rawResults
        .map((item: any) => {
          const downloads: any[] = item.downloadUrl || [];
          const bestAudio =
            downloads.find((d) => d.quality === '320kbps') ||
            downloads.find((d) => d.quality === '160kbps') ||
            downloads[downloads.length - 1];
          if (!bestAudio?.url) return null;
          const images: any[] = item.image || [];
          const bestImg =
            images.find((img) => img.quality === '500x500') || images[images.length - 1];
          const primaryArtists =
            item.artists?.primary?.map((a: any) => a.name).join(', ') || 'Artist';
          return {
            id: `saavn_${item.id}`,
            title: String(item.name || 'Song').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
            artist: String(primaryArtists).replace(/&amp;/g, '&'),
            album: String(item.album?.name || '').replace(/&quot;/g, '"'),
            artworkUrl: bestImg?.url || '',
            streamUrl: bestAudio.url,
            durationSec: Number(item.duration) || 240,
            isLiveRadio: false,
            genre: '320kbps Full Song',
          };
        })
        .filter(Boolean) as OnlineTrack[];

      setSongResults(tracks);
    } catch (err) {
      console.error('Online song search failed:', err);
      showIslandNotice('Search Error', 'Check your internet connection');
    } finally {
      setIsSearchingSongs(false);
    }
  };

  const searchLiveRadioStations = async (term: string) => {
    const clean = term.trim();
    if (!clean) {
      setRadioResults(CURATED_LIVE_STATIONS);
      return;
    }
    setIsSearchingRadio(true);
    try {
      const url = `https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(
        clean
      )}&limit=20&hidebroken=true&order=clickcount&reverse=true`;
      const res = await fetch(url);
      const data = await res.json();
      const stations: OnlineTrack[] = (Array.isArray(data) ? data : [])
        .filter((st: any) => st.url_resolved && st.url_resolved.startsWith('https://'))
        .map((st: any) => ({
          id: `radio_${st.stationuuid}`,
          title: st.name?.trim() || 'Live Radio Station',
          artist: `${st.country || 'Global'} · ${st.tags?.split(',').slice(0, 2).join(', ') || 'Live FM'}`,
          album: '24/7 Live Stream',
          artworkUrl:
            st.favicon ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
          streamUrl: st.url_resolved,
          isLiveRadio: true,
          genre: 'Live Radio',
        }));
      setRadioResults(stations.length > 0 ? stations : CURATED_LIVE_STATIONS);
    } catch {
      setRadioResults(CURATED_LIVE_STATIONS);
    } finally {
      setIsSearchingRadio(false);
    }
  };

  useEffect(() => {
    searchOnlineSongs('Arijit Singh Bollywood Hits');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-rose-500 dark:text-cyan-400">
            Online Streaming & 24/7 FM
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Life OS Music & Radio
          </h1>
        </div>

        {onOpenAIStudio && (
          <button
            onClick={onOpenAIStudio}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold text-indigo-600 dark:text-cyan-400 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Composer</span>
          </button>
        )}
      </div>

      {/* Now Playing Hero Deck */}
      {currentTrack && (
        <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/10 shrink-0 shadow-lg border border-white/15">
              {currentTrack.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-mono font-bold uppercase">
                  {currentTrack.isLiveRadio ? 'LIVE 24/7 RADIO' : 'NOW PLAYING'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white truncate mt-1">
                {currentTrack.title}
              </h2>
              <p className="text-xs text-slate-300 truncate">{currentTrack.artist}</p>
            </div>

            <button
              onClick={() => toggleFavorite(currentTrack)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 transition"
              aria-label="Like Song"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite(currentTrack.id)
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-white'
                }`}
              />
            </button>
          </div>

          {/* Scrubber Bar */}
          {!currentTrack.isLiveRadio && (
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 30}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Main Transport Controls & Volume */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 accent-cyan-400 h-1 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={playPrev}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlayPause}
                className="w-11 h-11 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg active:scale-95 transition"
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-slate-950" />
                ) : (
                  <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                )}
              </button>
              <button
                onClick={playNext}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-200/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
        <button
          onClick={() => setActiveTab('songs')}
          className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'songs'
              ? 'bg-white dark:bg-[#151924] text-indigo-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>Search Songs</span>
        </button>
        <button
          onClick={() => setActiveTab('radio')}
          className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'radio'
              ? 'bg-white dark:bg-[#151924] text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>24/7 Live Radio</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'favorites'
              ? 'bg-white dark:bg-[#151924] text-rose-500 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Liked ({favorites.length})</span>
        </button>
      </div>

      {/* ==================== TAB 1: SEARCH ONLINE SONGS ==================== */}
      {activeTab === 'songs' && (
        <div className="space-y-3">
          {/* Quick Vibe Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => {
                  setSearchQuery(cat.query);
                  searchOnlineSongs(cat.query);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-500 shrink-0 transition"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchOnlineSongs(searchQuery);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any Hindi, Punjabi, English song or artist..."
              className="flex-1 p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isSearchingSongs}
              className="px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {isSearchingSongs ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Search</span>
            </button>
          </form>

          {/* Song List */}
          <div className="space-y-2">
            {isSearchingSongs ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Searching online music catalog...</span>
              </div>
            ) : (
              songResults.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                const liked = isFavorite(track.id);
                return (
                  <div
                    key={track.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isCurrent
                        ? 'bg-indigo-500/10 border-indigo-500/40'
                        : 'bg-white dark:bg-[#121622] border-slate-200/80 dark:border-white/10 hover:border-indigo-400/30'
                    }`}
                  >
                    <button
                      onClick={() =>
                        isCurrent ? togglePlayPause() : playTrack(track, songResults)
                      }
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                        <img
                          src={track.artworkUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          {isCurrent && isPlaying ? (
                            <Pause className="w-5 h-5 text-white fill-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-xs font-bold truncate ${
                            isCurrent
                              ? 'text-indigo-600 dark:text-cyan-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {track.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {track.artist}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold">
                            {formatTime(track.durationSec || 240)} · FULL HD
                          </span>
                          {track.album && (
                            <span className="text-[10px] text-slate-400 truncate">
                              {track.album}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => toggleFavorite(track)}
                      className="p-2 rounded-full text-slate-400 hover:text-rose-500 transition shrink-0"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          liked ? 'text-rose-500 fill-rose-500' : ''
                        }`}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: 24/7 NON-STOP LIVE RADIO ==================== */}
      {activeTab === 'radio' && (
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchLiveRadioStations(radioQuery);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={radioQuery}
              onChange={(e) => setRadioQuery(e.target.value)}
              placeholder="Search live FM stations (e.g. Bollywood, Lofi, Punjabi, Workout)..."
              className="flex-1 p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isSearchingRadio}
              className="px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {isSearchingRadio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Find FM</span>
            </button>
          </form>

          <div className="space-y-2">
            {radioResults.map((station) => {
              const isCurrent = currentTrack?.id === station.id;
              const liked = isFavorite(station.id);
              return (
                <div
                  key={station.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                    isCurrent
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-white dark:bg-[#121622] border-slate-200/80 dark:border-white/10'
                  }`}
                >
                  <button
                    onClick={() =>
                      isCurrent ? togglePlayPause() : playTrack(station, radioResults)
                    }
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                      <img
                        src={station.artworkUrl}
                        alt={station.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-5 h-5 text-white fill-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-mono font-bold">
                          24/7 LIVE
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {station.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {station.artist}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => toggleFavorite(station)}
                    className="p-2 rounded-full text-slate-400 hover:text-rose-500 transition shrink-0"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        liked ? 'text-rose-500 fill-rose-500' : ''
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: LIKED / FAVORITE SONGS ==================== */}
      {activeTab === 'favorites' && (
        <div className="space-y-2">
          {favorites.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-center space-y-2">
              <Heart className="w-8 h-8 text-rose-500 mx-auto opacity-60" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No Liked Songs Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tap the heart ❤️ icon on any song or live radio station to save it to your personal playlist.
              </p>
            </div>
          ) : (
            favorites.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className="p-2.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3"
                >
                  <button
                    onClick={() =>
                      isCurrent ? togglePlayPause() : playTrack(track, favorites)
                    }
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-11 h-11 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {track.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">
                        {track.artist}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleFavorite(track)}
                    className="p-2 rounded-full text-rose-500"
                  >
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
