import React, { useState } from 'react';
import { LifeOSProvider, useLifeOS } from './context/LifeOSContext';
import { MusicProvider } from './context/MusicContext';
import { useTheme } from './hooks/useTheme';
import { useOnlineStatus, OfflineIndicator } from './components/common/OfflineIndicator';
import { DynamicIsland } from './components/common/DynamicIsland';
import { BottomNav } from './components/common/BottomNav';
import { FloatingMiniPlayer } from './components/common/FloatingMiniPlayer';
import { IPhoneFrame } from './components/common/IPhoneFrame';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { QuickEntryModal } from './components/quickEntry/QuickEntryModal';

// Views and Modules
import { DashboardView } from './components/dashboard/DashboardView';
import { MyDayModule } from './components/modules/MyDayModule';
import { JournalModule } from './components/modules/JournalModule';
import { FitnessModule } from './components/modules/FitnessModule';
import { CareerModule } from './components/modules/CareerModule';
import { FinanceModule } from './components/modules/FinanceModule';
import { HabitsModule } from './components/modules/HabitsModule';
import { LearningModule } from './components/modules/LearningModule';
import { GoalsModule } from './components/modules/GoalsModule';
import { MoodModule } from './components/modules/MoodModule';
import { TimelineModule } from './components/modules/TimelineModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { HubModule } from './components/modules/HubModule';
import { AIStudioModule } from './components/modules/AIStudioModule';
import { BioscienceModule } from './components/modules/BioscienceModule';
import { ThreeWorldModule } from './components/modules/ThreeWorldModule';
import { MusicPlayerModule } from './components/modules/MusicPlayerModule';

import { ModuleTab, BottomNavTab } from './types';
import {
  ChevronLeft,
  Sparkles,
  Sun,
  Moon,
  Cloud,
  LogIn,
  Music,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { theme, setTheme } = useTheme('dark');
  const isOnline = useOnlineStatus();
  const {
    activeBottomTab,
    setActiveBottomTab,
    activeModule,
    setActiveModule,
    showQuickEntryModal,
    setShowQuickEntryModal,
    islandNotice,
    currentUser,
    loginWithGoogle,
    syncToCloudNow,
    isSyncingCloud,
  } = useLifeOS();

  // Dual-view states for compound bottom tabs
  const [dayJournalSubTab, setDayJournalSubTab] = useState<'day' | 'journal'>('day');
  const [fitnessHabitsSubTab, setFitnessHabitsSubTab] = useState<'fitness' | 'habits'>('fitness');
  const [careerFinanceSubTab, setCareerFinanceSubTab] = useState<'career' | 'finance'>('career');

  // Handle Bottom Nav selection
  const handleSelectBottomTab = (tab: BottomNavTab) => {
    setActiveBottomTab(tab);
    if (tab === 'dashboard') setActiveModule('dashboard');
    else if (tab === 'day-journal') setActiveModule(dayJournalSubTab === 'day' ? 'my-day' : 'journal');
    else if (tab === 'fitness-habits') setActiveModule(fitnessHabitsSubTab === 'fitness' ? 'fitness' : 'habits');
    else if (tab === 'career-finance') setActiveModule(careerFinanceSubTab === 'career' ? 'career' : 'finance');
    else if (tab === 'hub') setActiveModule('hub' as any);
  };

  // Direct module navigation (e.g. from Dashboard or Hub)
  const handleNavigateDirectModule = (mod: ModuleTab) => {
    setActiveModule(mod);
    if (mod === 'dashboard') setActiveBottomTab('dashboard');
    else if (mod === 'my-day' || mod === 'journal') {
      setActiveBottomTab('day-journal');
      setDayJournalSubTab(mod === 'my-day' ? 'day' : 'journal');
    } else if (mod === 'fitness' || mod === 'habits') {
      setActiveBottomTab('fitness-habits');
      setFitnessHabitsSubTab(mod === 'fitness' ? 'fitness' : 'habits');
    } else if (mod === 'career' || mod === 'finance') {
      setActiveBottomTab('career-finance');
      setCareerFinanceSubTab(mod === 'career' ? 'career' : 'finance');
    } else {
      setActiveBottomTab('hub');
    }
  };

  const isDeepModule =
    activeModule === 'goals' ||
    activeModule === 'learning' ||
    activeModule === 'mood' ||
    activeModule === 'timeline' ||
    activeModule === 'ai-studio' ||
    activeModule === 'bioscience' ||
    activeModule === 'three-world' ||
    activeModule === 'music-player' ||
    activeModule === 'settings';

  return (
    <IPhoneFrame>
      <OfflineIndicator />

      {/* Dynamic Island at Top */}
      <DynamicIsland
        notice={islandNotice}
        isOnline={isOnline}
        onOpenQuickEntry={() => setShowQuickEntryModal(true)}
      />

      {/* iOS App Navigation Header */}
      <header className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 sticky top-10 z-30 bg-white/80 dark:bg-[#090c14]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {isDeepModule ? (
            <button
              onClick={() => {
                setActiveBottomTab('hub');
                setActiveModule('hub' as any);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-cyan-400 -ml-1 pr-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Life Hub</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                OS
              </div>
              <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                MY LIFE OS
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Online Music Button */}
          <button
            onClick={() => handleNavigateDirectModule('music-player')}
            className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:bg-rose-500/20 transition"
            title="Online Songs & Live Radio"
          >
            <Music className="w-3 h-3" />
            <span>Songs</span>
          </button>

          {/* Quick AI Studio Button */}
          <button
            onClick={() => handleNavigateDirectModule('ai-studio')}
            className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-cyan-400 flex items-center gap-1 hover:bg-indigo-500/20 transition"
            title="Open Gemini AI Studio"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI</span>
          </button>

          {/* Cloud Sync / Google Sign-In Status Pill */}
          {currentUser ? (
            <button
              onClick={syncToCloudNow}
              disabled={isSyncingCloud}
              className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
              title={`Synced as ${currentUser.email}`}
            >
              <Cloud className="w-3 h-3" />
              <span>{isSyncingCloud ? 'Sync...' : 'Cloud'}</span>
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-200 transition"
              title="Sign in with Google for Firebase Cloud Sync"
            >
              <LogIn className="w-3 h-3" />
              <span>Sync</span>
            </button>
          )}

          <PWAInstallPrompt />

          {/* Quick theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </header>

      {/* Compound Tab Switchers for Sub-Modules */}
      {activeBottomTab === 'day-journal' && !isDeepModule && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-white/5 rounded-xl">
            <button
              onClick={() => {
                setDayJournalSubTab('day');
                setActiveModule('my-day');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                dayJournalSubTab === 'day'
                  ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              My Day Routine
            </button>
            <button
              onClick={() => {
                setDayJournalSubTab('journal');
                setActiveModule('journal');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                dayJournalSubTab === 'journal'
                  ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              My Journal Diary
            </button>
          </div>
        </div>
      )}

      {activeBottomTab === 'fitness-habits' && !isDeepModule && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-white/5 rounded-xl">
            <button
              onClick={() => {
                setFitnessHabitsSubTab('fitness');
                setActiveModule('fitness');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                fitnessHabitsSubTab === 'fitness'
                  ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Fitness & Body
            </button>
            <button
              onClick={() => {
                setFitnessHabitsSubTab('habits');
                setActiveModule('habits');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                fitnessHabitsSubTab === 'habits'
                  ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Daily Habits
            </button>
          </div>
        </div>
      )}

      {activeBottomTab === 'career-finance' && !isDeepModule && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-white/5 rounded-xl">
            <button
              onClick={() => {
                setCareerFinanceSubTab('career');
                setActiveModule('career');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                careerFinanceSubTab === 'career'
                  ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Career & Office
            </button>
            <button
              onClick={() => {
                setCareerFinanceSubTab('finance');
                setActiveModule('finance');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                careerFinanceSubTab === 'finance'
                  ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Finance & Money
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 px-4 pt-3 pb-8">
        {activeBottomTab === 'dashboard' && (
          <DashboardView
            onNavigateModule={handleNavigateDirectModule}
            onOpenQuickEntry={() => setShowQuickEntryModal(true)}
          />
        )}

        {activeBottomTab === 'day-journal' &&
          (dayJournalSubTab === 'day' ? <MyDayModule /> : <JournalModule />)}

        {activeBottomTab === 'fitness-habits' &&
          (fitnessHabitsSubTab === 'fitness' ? <FitnessModule /> : <HabitsModule />)}

        {activeBottomTab === 'career-finance' &&
          (careerFinanceSubTab === 'career' ? <CareerModule /> : <FinanceModule />)}

        {activeBottomTab === 'hub' && (
          <>
            {activeModule === 'goals' && <GoalsModule />}
            {activeModule === 'learning' && <LearningModule />}
            {activeModule === 'mood' && <MoodModule />}
            {activeModule === 'timeline' && (
              <TimelineModule onSelectModule={handleNavigateDirectModule} />
            )}
            {activeModule === 'music-player' && (
              <MusicPlayerModule
                onOpenAIStudio={() => handleNavigateDirectModule('ai-studio')}
              />
            )}
            {activeModule === 'ai-studio' && <AIStudioModule />}
            {activeModule === 'bioscience' && <BioscienceModule />}
            {activeModule === 'three-world' && <ThreeWorldModule />}
            {activeModule === 'settings' && (
              <SettingsModule currentTheme={theme} onSetTheme={setTheme} />
            )}
            {(activeModule === ('hub' as any) ||
              activeModule === 'dashboard' ||
              !isDeepModule) && (
              <HubModule onSelectModule={handleNavigateDirectModule} />
            )}
          </>
        )}
      </main>

      {/* Persistent iOS Floating Mini-Player Bar */}
      <FloatingMiniPlayer
        onOpenFullPlayer={() => handleNavigateDirectModule('music-player')}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeBottomTab}
        onSelectTab={handleSelectBottomTab}
        onOpenQuickEntry={() => setShowQuickEntryModal(true)}
      />

      {/* Quick Entry Modal */}
      <QuickEntryModal
        isOpen={showQuickEntryModal}
        onClose={() => setShowQuickEntryModal(false)}
      />
    </IPhoneFrame>
  );
};

export default function App() {
  return (
    <LifeOSProvider>
      <MusicProvider>
        <AppContent />
      </MusicProvider>
    </LifeOSProvider>
  );
}
