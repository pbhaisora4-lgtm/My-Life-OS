import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { GoalItem, GoalTimeframe, GoalMilestone } from '../../types';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const GoalsModule: React.FC = () => {
  const { goals, saveGoal, deleteGoal } = useLifeOS();

  const [activeTimeframe, setActiveTimeframe] = useState<GoalTimeframe>('monthly');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalItem['category']>('personal');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [milestonesInput, setMilestonesInput] = useState('Step 1, Step 2, Step 3');

  const filteredGoals = goals.filter((g) => g.timeframe === activeTimeframe);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const milestones: GoalMilestone[] = milestonesInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
      .map((m, i) => ({
        id: `ms_${Date.now()}_${i}`,
        title: m,
        done: false,
      }));

    const newGoal: GoalItem = {
      id: `goal_${Date.now()}`,
      title: title.trim(),
      timeframe: activeTimeframe,
      category,
      targetDate,
      progress: 0,
      milestones,
      notes: notes.trim(),
    };

    await saveGoal(newGoal);
    setTitle('');
    setNotes('');
    setIsAdding(false);
  };

  const handleToggleMilestone = async (goal: GoalItem, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, done: !m.done } : m
    );

    const doneCount = updatedMilestones.filter((m) => m.done).length;
    const progress =
      updatedMilestones.length > 0
        ? Math.round((doneCount / updatedMilestones.length) * 100)
        : goal.progress;

    await saveGoal({
      ...goal,
      milestones: updatedMilestones,
      progress,
    });
  };

  const handleUpdateProgress = async (goal: GoalItem, newProgress: number) => {
    await saveGoal({
      ...goal,
      progress: Math.min(100, Math.max(0, newProgress)),
    });
  };

  const timeframes: { id: GoalTimeframe; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-cyan-500">
            Module 08
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Life Goals & Targets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daily, weekly, monthly and yearly targets with progress tracking.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Target</span>
          </button>
        )}
      </div>

      {/* Timeframe Selector */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 dark:bg-white/5 rounded-xl">
        {timeframes.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setActiveTimeframe(tf.id)}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTimeframe === tf.id
                ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Add Goal Form */}
      {isAdding && (
        <form
          onSubmit={handleAddGoal}
          className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Set {activeTimeframe.toUpperCase()} Goal
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
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Target Objective</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Run half-marathon under 2 hours, Ship SaaS beta, Save $15k"
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              >
                <option value="career">Career</option>
                <option value="health">Health & Body</option>
                <option value="finance">Finance</option>
                <option value="skills">Skills & Mastery</option>
                <option value="personal">Personal Life</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">
              Milestones (comma-separated checkpoints)
            </label>
            <input
              type="text"
              value={milestonesInput}
              onChange={(e) => setMilestonesInput(e.target.value)}
              placeholder="Phase 1 complete, 10km run logged, Prototype ready"
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md active:scale-95 transition"
          >
            Create Goal
          </button>
        </form>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        {filteredGoals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-400">
            <Target className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-30" />
            No {activeTimeframe} targets configured yet. Set one above to drive clarity!
          </div>
        ) : (
          filteredGoals.map((g) => (
            <div
              key={g.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="uppercase font-bold text-cyan-600 dark:text-cyan-400">
                      {g.category}
                    </span>
                    <span>·</span>
                    <span className="font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Target: {g.targetDate}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
                    {g.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-cyan-500">
                    {g.progress}%
                  </span>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Slider */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">Adjust progress:</span>
                  <div className="flex gap-1.5">
                    {[25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleUpdateProgress(g, val)}
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          g.progress >= val
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Milestones Checkbox list */}
              {g.milestones && g.milestones.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Milestones Checkpoints
                  </span>
                  {g.milestones.map((ms) => (
                    <div
                      key={ms.id}
                      onClick={() => handleToggleMilestone(g, ms.id)}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer text-xs"
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                          ms.done
                            ? 'bg-emerald-500 text-white'
                            : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {ms.done && <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />}
                      </div>
                      <span
                        className={`font-medium ${
                          ms.done
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ms.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
