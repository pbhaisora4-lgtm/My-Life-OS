import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { ModuleTab } from '../../types';
import {
  Clock,
  Search,
  Filter,
  PenLine,
  Briefcase,
  Flame,
  BookOpen,
  Smile,
  DollarSign,
  X,
  Calendar,
} from 'lucide-react';

export const TimelineModule: React.FC<{
  onSelectModule: (mod: ModuleTab) => void;
}> = ({ onSelectModule }) => {
  const { timelineItems, refreshTimeline } = useLifeOS();

  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleSearchChange = (q: string) => {
    setQuery(q);
    refreshTimeline(q, selectedFilter);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    refreshTimeline(query, filter);
  };

  const filters = [
    { id: 'all', label: 'All History' },
    { id: 'journal', label: 'Journal', icon: PenLine },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'fitness', label: 'Fitness', icon: Flame },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'mood', label: 'Mood', icon: Smile },
    { id: 'finance', label: 'Finance', icon: DollarSign },
  ];

  const getModuleBadge = (mod: ModuleTab) => {
    switch (mod) {
      case 'journal':
        return { label: 'Journal', color: 'bg-indigo-500/10 text-indigo-600 dark:text-cyan-400' };
      case 'career':
        return { label: 'Career', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' };
      case 'fitness':
        return { label: 'Fitness', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' };
      case 'learning':
        return { label: 'Learning', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
      case 'mood':
        return { label: 'Reflection', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' };
      case 'finance':
        return { label: 'Finance', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
      default:
        return { label: 'Record', color: 'bg-slate-500/10 text-slate-500' };
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-cyan-500">
          Module 10
        </p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Life Timeline
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          A chronological, searchable record of all your stories, workouts, work wins and reflections.
        </p>
      </div>

      {/* Global Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search entire life timeline by milestone, topic, workout, date..."
          className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => handleSearchChange('')}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => {
          const isActive = selectedFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Chronological Stream */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
        {timelineItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-400">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-30" />
            No records found for this filter. Start logging in any module to build your life story!
          </div>
        ) : (
          timelineItems.map((item) => {
            const badge = getModuleBadge(item.module);
            return (
              <div key={item.id} className="relative group">
                {/* Timeline node dot */}
                <div className="absolute -left-6 top-4 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-[#07090e] shadow-xs" />

                <div
                  onClick={() => onSelectModule(item.module)}
                  className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-1.5 cursor-pointer hover:border-indigo-400/50 transition active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  {item.subtitle && (
                    <p className="text-[11px] text-indigo-600 dark:text-cyan-400 font-medium">
                      {item.subtitle}
                    </p>
                  )}

                  {item.content && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1.5 pt-1 text-[10px] text-slate-400">
                      {item.tags.map((t, i) => (
                        <span key={i}>#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
