import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { HabitItem } from '../../types';
import {
  Flame,
  CheckCircle2,
  Plus,
  Dumbbell,
  SunMedium,
  BookOpen,
  Languages,
  Droplets,
  Moon,
  Sparkles,
  Award,
} from 'lucide-react';

export const HabitsModule: React.FC = () => {
  const { selectedDate, habits, toggleHabit, saveHabit } = useLifeOS();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<HabitItem['category']>('growth');
  const [targetDays, setTargetDays] = useState('7');

  // Compute 7-day dates window (ending with selectedDate)
  const daysWindow = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split('T')[0];
    const letter = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const dayNum = d.getDate();
    return {
      date: dStr,
      letter,
      dayNum,
      isCurrent: dStr === selectedDate,
    };
  });

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newH: HabitItem = {
      id: `habit_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      targetDaysPerWeek: parseInt(targetDays, 10) || 7,
      color: '#6366f1',
      icon: 'Sparkles',
      streak: 0,
      completedDates: [],
    };

    await saveHabit(newH);
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-purple-500">
            Module 06
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Habits
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gym, early wake-up, reading, English, water and sleep consistency.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Habit</span>
          </button>
        )}
      </div>

      {/* Add Custom Habit Form */}
      {isAdding && (
        <form
          onSubmit={handleAddHabit}
          className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Create New Habit
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Habit Name</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. 10-Minute Morning Meditation, Cold Shower, No Sugar"
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              >
                <option value="health">Health & Fitness</option>
                <option value="growth">Learning & Growth</option>
                <option value="routine">Daily Routine</option>
                <option value="mindset">Mindset & Focus</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Target Days / Week</label>
              <select
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
              >
                <option value="7">7 Days (Every Day)</option>
                <option value="6">6 Days / Week</option>
                <option value="5">5 Days (Weekdays)</option>
                <option value="3">3 Days / Week</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md active:scale-95 transition"
          >
            Save Habit
          </button>
        </form>
      )}

      {/* 7-Day Header Reference */}
      <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200">
          Weekly Consistency Matrix
        </span>
        <div className="flex gap-2">
          {daysWindow.map((d) => (
            <div
              key={d.date}
              className={`w-6 text-center ${
                d.isCurrent ? 'font-bold text-indigo-600 dark:text-cyan-400' : ''
              }`}
            >
              <span className="text-[10px] block">{d.letter}</span>
              <span className="text-[9px] font-mono">{d.dayNum}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.map((habit) => {
          const isDoneToday = habit.completedDates.includes(selectedDate);
          return (
            <div
              key={habit.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
            >
              {/* Row 1: Habit title, Streak, Main Tap Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleHabit(habit.id, selectedDate)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isDoneToday
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-90'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {isDoneToday && <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
                  </button>

                  <div>
                    <h3
                      className={`text-sm font-semibold transition-colors ${
                        isDoneToday
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {habit.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="capitalize">{habit.category}</span>
                      <span>·</span>
                      <span>{habit.targetDaysPerWeek}x / week</span>
                    </div>
                  </div>
                </div>

                {/* Streak Counter */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>{habit.streak}d</span>
                </div>
              </div>

              {/* Row 2: 7-day mini checkmarks */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                {daysWindow.map((d) => {
                  const doneOnDay = habit.completedDates.includes(d.date);
                  return (
                    <button
                      key={d.date}
                      onClick={() => toggleHabit(habit.id, d.date)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-all ${
                        doneOnDay
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200'
                      }`}
                      title={d.date}
                    >
                      {doneOnDay ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
