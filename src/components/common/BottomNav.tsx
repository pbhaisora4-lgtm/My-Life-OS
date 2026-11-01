import React from 'react';
import { BottomNavTab } from '../../types';
import {
  LayoutDashboard,
  CalendarDays,
  Flame,
  Briefcase,
  Layers,
  Plus,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  onOpenQuickEntry: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickEntry,
}) => {
  const tabs = [
    {
      id: 'dashboard' as BottomNavTab,
      label: 'Today',
      icon: LayoutDashboard,
    },
    {
      id: 'day-journal' as BottomNavTab,
      label: 'Day & Story',
      icon: CalendarDays,
    },
    // Center Quick Entry is rendered separately
    {
      id: 'fitness-habits' as BottomNavTab,
      label: 'Fit & Habits',
      icon: Flame,
    },
    {
      id: 'career-finance' as BottomNavTab,
      label: 'Work & Money',
      icon: Briefcase,
    },
    {
      id: 'hub' as BottomNavTab,
      label: 'Life Hub',
      icon: Layers,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#0b0e17]/85 backdrop-blur-2xl border-t border-slate-200/60 dark:border-white/10 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-colors">
      <div className="max-w-lg mx-auto px-2 flex items-center justify-around h-16 relative">
        {/* First 2 tabs */}
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="flex-1 min-h-[44px] flex flex-col items-center justify-center relative touch-manipulation group"
              aria-label={tab.label}
            >
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-cyan-950/40'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'font-bold text-indigo-600 dark:text-cyan-400'
                    : 'font-medium text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center Quick Entry CTA */}
        <div className="flex-none px-1">
          <button
            onClick={onOpenQuickEntry}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 active:scale-90 transition-transform -translate-y-2 border border-white/20 touch-manipulation"
            aria-label="Quick Entry"
            title="Daily Quick Entry"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Next 3 tabs */}
        {tabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="flex-1 min-h-[44px] flex flex-col items-center justify-center relative touch-manipulation group"
              aria-label={tab.label}
            >
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-cyan-950/40'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'font-bold text-indigo-600 dark:text-cyan-400'
                    : 'font-medium text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
