import React from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { ModuleTab } from '../../types';
import {
  Sparkles,
  Flame,
  Droplets,
  Footprints,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Briefcase,
  DollarSign,
  PenLine,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Smile,
  ShieldAlert,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateModule: (mod: ModuleTab) => void;
  onOpenQuickEntry: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateModule,
  onOpenQuickEntry,
}) => {
  const {
    selectedDate,
    setSelectedDate,
    todayStr,
    settings,
    dayRecord,
    habits,
    toggleHabit,
    fitnessRecord,
    saveFitnessRecord,
    careerRecord,
    saveCareerRecord,
    financeTransactions,
    moodRecord,
  } = useLifeOS();

  // Compute greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Format display date
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const isToday = selectedDate === todayStr;

  // Day navigation
  const handleDayShift = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Habit stats for selected date
  const completedHabitsCount = habits.filter((h) =>
    h.completedDates.includes(selectedDate)
  ).length;
  const habitPercentage =
    habits.length > 0
      ? Math.round((completedHabitsCount / habits.length) * 100)
      : 0;

  // Fitness stats
  const steps = fitnessRecord?.steps || 0;
  const stepTarget = settings.stepTarget || 10000;
  const stepPercentage = Math.min(100, Math.round((steps / stepTarget) * 100));

  const waterMl = fitnessRecord?.waterMl || 0;
  const waterTarget = settings.waterTargetMl || 3000;
  const waterPercentage = Math.min(
    100,
    Math.round((waterMl / waterTarget) * 100)
  );

  // Quick add water
  const handleAddWater = async (amount: number) => {
    const existing = fitnessRecord || {
      id: `fit_${selectedDate}`,
      date: selectedDate,
      steps: 0,
      caloriesBurnedTotal: 0,
      waterMl: 0,
      exercises: [],
      cardio: [],
      meals: [],
    };
    await saveFitnessRecord({
      ...existing,
      waterMl: (existing.waterMl || 0) + amount,
    });
  };

  // Quick toggle career task
  const handleToggleTask = async (taskId: string) => {
    if (!careerRecord) return;
    const updatedTasks = careerRecord.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: (t.status === 'done' ? 'todo' : 'done') as 'todo' | 'done',
          }
        : t
    );
    await saveCareerRecord({
      ...careerRecord,
      tasks: updatedTasks,
    });
  };

  // Finance today
  const todayTransactions = financeTransactions.filter(
    (t) => t.date === selectedDate
  );
  const todaySpent = todayTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Date & Greeting Bar */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-indigo-600 dark:text-cyan-400">
            {formattedDate} {isToday && '· TODAY'}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {settings.userName}
          </h1>
        </div>

        {/* Date Selector buttons */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-white/10 rounded-full p-1">
          <button
            onClick={() => handleDayShift(-1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2 text-[11px] font-semibold text-indigo-600 dark:text-cyan-400"
            >
              Today
            </button>
          )}
          <button
            onClick={() => handleDayShift(1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Add Action Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={onOpenQuickEntry}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-semibold shadow-md active:scale-95 transition shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Entry</span>
        </button>
        <button
          onClick={() => onNavigateModule('music-player')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/20 active:scale-95 transition shrink-0"
        >
          <span>🎵 Online Songs</span>
        </button>
        <button
          onClick={() => onNavigateModule('ai-studio')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-500/20 active:scale-95 transition shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Studio & Voice</span>
        </button>
        <button
          onClick={() => onNavigateModule('bioscience')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/20 active:scale-95 transition shrink-0"
        >
          <span>🧬 Bio 3D</span>
        </button>
        <button
          onClick={() => onNavigateModule('three-world')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/20 active:scale-95 transition shrink-0"
        >
          <span>🎮 3D & Game</span>
        </button>
        <button
          onClick={() => onNavigateModule('journal')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#121622] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition shrink-0"
        >
          <PenLine className="w-3.5 h-3.5 text-indigo-500" />
          <span>Journal</span>
        </button>
        <button
          onClick={() => onNavigateModule('fitness')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#121622] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition shrink-0"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Workout</span>
        </button>
        <button
          onClick={() => onNavigateModule('finance')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#121622] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition shrink-0"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          <span>Expense</span>
        </button>
        <button
          onClick={() => onNavigateModule('career')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#121622] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition shrink-0"
        >
          <Briefcase className="w-3.5 h-3.5 text-blue-500" />
          <span>Tasks</span>
        </button>
      </div>

      {/* Triple Activity Rings Summary */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Ring 1: Habits */}
        <div
          onClick={() => onNavigateModule('habits')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm cursor-pointer hover:border-indigo-400/40 transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Habits</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {completedHabitsCount}
            </span>
            <span className="text-xs text-slate-400">/{habits.length}</span>
          </div>
          {/* Micro Progress Bar */}
          <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${habitPercentage}%` }}
            />
          </div>
          <span className="text-[10px] text-indigo-500 font-mono mt-1 block">
            {habitPercentage}% done
          </span>
        </div>

        {/* Ring 2: Steps */}
        <div
          onClick={() => onNavigateModule('fitness')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm cursor-pointer hover:border-cyan-400/40 transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Steps</span>
            <Footprints className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {steps > 1000 ? `${(steps / 1000).toFixed(1)}k` : steps}
            </span>
            <span className="text-xs text-slate-400">/10k</span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${stepPercentage}%` }}
            />
          </div>
          <span className="text-[10px] text-cyan-500 font-mono mt-1 block">
            {steps.toLocaleString()} steps
          </span>
        </div>

        {/* Ring 3: Water */}
        <div
          onClick={() => onNavigateModule('fitness')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm cursor-pointer hover:border-blue-400/40 transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Water</span>
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {(waterMl / 1000).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">/3.0L</span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${waterPercentage}%` }}
            />
          </div>
          <span className="text-[10px] text-blue-500 font-mono mt-1 block">
            {waterMl} ml
          </span>
        </div>
      </div>

      {/* Routine & Wake/Sleep Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              My Day Schedule
            </h3>
          </div>
          <button
            onClick={() => onNavigateModule('my-day')}
            className="text-[11px] font-semibold text-indigo-600 dark:text-cyan-400 hover:underline"
          >
            Open Routine →
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
              🌅
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Wake Up</p>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {dayRecord?.wakeUpTime || 'Not set'}
              </p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
              🌙
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Bedtime</p>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {dayRecord?.sleepTime || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {dayRecord?.events && dayRecord.events.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {dayRecord.events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400">{event.time}</span>
                  <span className={`text-slate-700 dark:text-slate-300 ${event.completed ? 'line-through opacity-60' : ''}`}>
                    {event.title}
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400">
                  {event.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Habits Quick Checklist */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Daily Habits
            </h3>
          </div>
          <button
            onClick={() => onNavigateModule('habits')}
            className="text-[11px] font-semibold text-indigo-600 dark:text-cyan-400 hover:underline"
          >
            Manage All →
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-white/5">
          {habits.slice(0, 5).map((habit) => {
            const isDone = habit.completedDates.includes(selectedDate);
            return (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit.id, selectedDate)}
                className="w-full py-2.5 flex items-center justify-between group active:scale-[0.99] transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-medium transition-colors ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {habit.title}
                    </p>
                  </div>
                </div>
                {habit.streak > 0 && (
                  <span className="text-[10px] font-mono font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    🔥 {habit.streak}d
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fitness & Quick Hydration Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Quick Hydration
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-blue-500">
            {waterMl} / {waterTarget} ml
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={() => handleAddWater(250)}
            className="flex-1 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-500/20 active:scale-95 transition"
          >
            + 250 ml Glass
          </button>
          <button
            onClick={() => handleAddWater(500)}
            className="flex-1 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-500/20 active:scale-95 transition"
          >
            + 500 ml Bottle
          </button>
          <button
            onClick={() => handleAddWater(1000)}
            className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-500 active:scale-95 transition"
          >
            + 1.0 Liter
          </button>
        </div>
      </div>

      {/* Career & High-Priority Tasks */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Career & Office Tasks
            </h3>
          </div>
          <button
            onClick={() => onNavigateModule('career')}
            className="text-[11px] font-semibold text-indigo-600 dark:text-cyan-400 hover:underline"
          >
            View Career →
          </button>
        </div>

        {careerRecord?.tasks && careerRecord.tasks.length > 0 ? (
          <div className="mt-3 space-y-2">
            {careerRecord.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      task.status === 'done'
                        ? 'bg-emerald-500 text-white'
                        : 'border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {task.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <span
                    className={`font-medium ${
                      task.status === 'done'
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <span className="text-[10px] text-indigo-500 uppercase font-semibold">
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 py-4 text-center">
            <p className="text-xs text-slate-400">No career tasks logged for this day.</p>
            <button
              onClick={() => onNavigateModule('career')}
              className="mt-2 text-xs font-semibold text-indigo-500 hover:underline"
            >
              + Add a Task
            </button>
          </div>
        )}
      </div>

      {/* Finance Today & Mood Snapshot */}
      <div className="grid grid-cols-2 gap-3">
        {/* Finance Snapshot */}
        <div
          onClick={() => onNavigateModule('finance')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm cursor-pointer hover:border-emerald-400/40 transition"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Spent Today</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-slate-900 dark:text-white">
            ${todaySpent.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {todayTransactions.length} transactions
          </p>
        </div>

        {/* Mood Snapshot */}
        <div
          onClick={() => onNavigateModule('mood')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm cursor-pointer hover:border-rose-400/40 transition"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Daily Mood</span>
            <Smile className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {moodRecord ? `${moodRecord.moodScore}/5` : 'Not Logged'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {moodRecord?.reflection || 'Tap to reflect'}
          </p>
        </div>
      </div>
    </div>
  );
};
