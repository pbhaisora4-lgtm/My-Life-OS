import React from 'react';
import { ModuleTab } from '../../types';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  CalendarDays,
  PenLine,
  Flame,
  Briefcase,
  DollarSign,
  CheckCircle2,
  BookOpen,
  Target,
  Smile,
  Clock,
  Settings,
  ChevronRight,
  Sparkles,
  Dna,
  Box,
  Cloud,
  LogIn,
  Music,
} from 'lucide-react';

interface HubModuleProps {
  onSelectModule: (mod: ModuleTab) => void;
}

export const HubModule: React.FC<HubModuleProps> = ({ onSelectModule }) => {
  const { currentUser, loginWithGoogle, syncToCloudNow, isSyncingCloud } = useLifeOS();

  const advancedModules: {
    id: ModuleTab;
    number: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
  }[] = [
    {
      id: 'music-player',
      number: 'MP3',
      title: 'Online Songs & 24/7 Live Radio',
      description: 'Stream Bollywood, Punjabi, English songs, Workout & Lo-Fi FM in background',
      icon: Music,
      color: 'bg-rose-500/15 text-rose-400',
    },
    {
      id: 'ai-studio',
      number: 'AI',
      title: 'Gemini AI & Live Voice Studio',
      description: 'Chatbot, Live Voice, Transcribe, Search/Maps, Image, Video & Lyria Music',
      icon: Sparkles,
      color: 'bg-indigo-500/15 text-indigo-400',
    },
    {
      id: 'bioscience',
      number: 'BIO',
      title: 'Bioscience 3D Workbench',
      description: 'AlphaFold DB, UniProtKB & RCSB PDB 3Dmol.js macromolecular viewer',
      icon: Dna,
      color: 'bg-cyan-500/15 text-cyan-400',
    },
    {
      id: 'three-world',
      number: '3D',
      title: '3D Sanctum & Focus Runner Game',
      description: 'Three.js PBR kinetic sculptures & interactive 3D Neural Runner game',
      icon: Box,
      color: 'bg-amber-500/15 text-amber-400',
    },
  ];

  const modulesList: {
    id: ModuleTab;
    number: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
  }[] = [
    {
      id: 'my-day',
      number: '01',
      title: 'My Day & Schedule',
      description: 'Wake-up, daily activities, office routine, sleep',
      icon: CalendarDays,
      color: 'bg-amber-500/10 text-amber-500',
    },
    {
      id: 'journal',
      number: '02',
      title: 'My Journal & Diary',
      description: 'Free-text story, photo attachments, search',
      icon: PenLine,
      color: 'bg-indigo-500/10 text-indigo-500',
    },
    {
      id: 'fitness',
      number: '03',
      title: 'Fitness & Body',
      description: 'Gym sets/reps, cardio, steps, meals, water',
      icon: Flame,
      color: 'bg-cyan-500/10 text-cyan-500',
    },
    {
      id: 'career',
      number: '04',
      title: 'Career & Office',
      description: 'Tasks, achievements, meetings, leadership',
      icon: Briefcase,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      id: 'finance',
      number: '05',
      title: 'Finance & Money',
      description: 'Income, spending, savings, investments, charts',
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      id: 'habits',
      number: '06',
      title: 'Daily Habits',
      description: 'Consistency streaks, weekly matrix',
      icon: CheckCircle2,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      id: 'learning',
      number: '07',
      title: 'Learning & Mastery',
      description: 'English, communication, leadership, tech',
      icon: BookOpen,
      color: 'bg-teal-500/10 text-teal-500',
    },
    {
      id: 'goals',
      number: '08',
      title: 'Goals & Targets',
      description: 'Daily, weekly, monthly and yearly targets',
      icon: Target,
      color: 'bg-sky-500/10 text-sky-500',
    },
    {
      id: 'mood',
      number: '09',
      title: 'Mood & Mindset',
      description: 'Daily mood, energy, 3 gratitudes, reflection',
      icon: Smile,
      color: 'bg-rose-500/10 text-rose-500',
    },
    {
      id: 'timeline',
      number: '10',
      title: 'Life Timeline',
      description: 'Searchable chronological history across all stores',
      icon: Clock,
      color: 'bg-indigo-500/10 text-cyan-400',
    },
  ];

  return (
    <div className="space-y-4 pb-20">
      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
          Core Operating System
        </p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Life OS Modules
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Local-first IndexedDB + Firebase Cloud Sync + Gemini Multimodal Suite.
        </p>
      </div>

      {/* Firebase Cloud Vault Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 text-white border border-indigo-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Cloud className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold">
              {currentUser
                ? `Cloud Vault Active (${currentUser.email})`
                : 'Firebase Cloud Vault & Google Auth'}
            </h3>
            <p className="text-[10px] text-slate-300">
              {currentUser
                ? 'Your IndexedDB life records automatically back up to Firestore'
                : 'Sign in with Google to sync records across devices'}
            </p>
          </div>
        </div>
        {currentUser ? (
          <button
            onClick={syncToCloudNow}
            disabled={isSyncingCloud}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-[11px] font-bold shrink-0"
          >
            {isSyncingCloud ? 'Syncing...' : 'Sync Now'}
          </button>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-[11px] font-bold flex items-center gap-1 shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* AI, Bioscience & 3D Labs */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-cyan-400">
          AI Intelligence, Bioscience & 3D Spatial Labs
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          {advancedModules.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-indigo-500/30 shadow-sm flex items-center justify-between text-left hover:border-cyan-400 active:scale-[0.99] transition group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${m.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-indigo-500 dark:text-cyan-400 font-bold">
                        {m.number}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                        {m.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {m.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of 10 Life Modules */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          10 Personal Life Pillars
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {modulesList.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between text-left hover:border-indigo-400/50 active:scale-[0.99] transition group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${m.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {m.number}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                        {m.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {m.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Tile */}
      <button
        onClick={() => onSelectModule('settings')}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md flex items-center justify-between active:scale-[0.99] transition mt-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold">Settings, Cloud Sync & Backups</h3>
            <p className="text-[11px] text-slate-300">
              Firebase Google Auth, JSON backup/restore, CSV export, theme
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
};
