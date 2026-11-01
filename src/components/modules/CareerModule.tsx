import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { CareerRecord, CareerTask, CareerMeeting } from '../../types';
import {
  Briefcase,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Trophy,
  Users,
  Brain,
  ShieldAlert,
  Compass,
  FileText,
  Clock,
} from 'lucide-react';

export const CareerModule: React.FC = () => {
  const { selectedDate, careerRecord, saveCareerRecord } = useLifeOS();

  const current: CareerRecord = careerRecord || {
    id: `car_${selectedDate}`,
    date: selectedDate,
    tasks: [],
    achievements: [],
    meetings: [],
    skillsLearned: [],
    mistakesReflection: [],
    leadershipActivities: [],
    performanceSummary: '',
  };

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<CareerTask['priority']>('medium');
  const [taskCategory, setTaskCategory] = useState<CareerTask['category']>('office');

  // Input fields for quick entries
  const [newAchievement, setNewAchievement] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newMistake, setNewMistake] = useState('');
  const [newLeadership, setNewLeadership] = useState('');

  // Meeting form
  const [meetTitle, setMeetTitle] = useState('');
  const [meetTime, setMeetTime] = useState('11:00');
  const [meetTakeaways, setMeetTakeaways] = useState('');

  const [activeTab, setActiveTab] = useState<'tasks' | 'wins' | 'meetings' | 'growth' | 'report'>('tasks');

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: CareerTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      status: 'todo',
      priority: taskPriority,
      category: taskCategory,
      date: selectedDate,
    };

    await saveCareerRecord({
      ...current,
      tasks: [...current.tasks, newTask],
    });
    setTaskTitle('');
  };

  // Toggle Task Status
  const handleToggleTaskStatus = async (taskId: string) => {
    const nextStatus = (curr: CareerTask['status']): CareerTask['status'] => {
      if (curr === 'todo') return 'in_progress';
      if (curr === 'in_progress') return 'done';
      return 'todo';
    };

    const updated = current.tasks.map((t) =>
      t.id === taskId ? { ...t, status: nextStatus(t.status) } : t
    );
    await saveCareerRecord({
      ...current,
      tasks: updated,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await saveCareerRecord({
      ...current,
      tasks: current.tasks.filter((t) => t.id !== taskId),
    });
  };

  // Add Achievement
  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchievement.trim()) return;
    await saveCareerRecord({
      ...current,
      achievements: [...current.achievements, newAchievement.trim()],
    });
    setNewAchievement('');
  };

  // Add Meeting
  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;
    const newM: CareerMeeting = {
      id: `meet_${Date.now()}`,
      time: meetTime,
      title: meetTitle.trim(),
      keyTakeaways: meetTakeaways.trim(),
    };
    await saveCareerRecord({
      ...current,
      meetings: [...current.meetings, newM],
    });
    setMeetTitle('');
    setMeetTakeaways('');
  };

  // Add Skill
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    await saveCareerRecord({
      ...current,
      skillsLearned: [...current.skillsLearned, newSkill.trim()],
    });
    setNewSkill('');
  };

  // Add Mistake & Reflection
  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMistake.trim()) return;
    await saveCareerRecord({
      ...current,
      mistakesReflection: [...current.mistakesReflection, newMistake.trim()],
    });
    setNewMistake('');
  };

  // Add Leadership
  const handleAddLeadership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadership.trim()) return;
    await saveCareerRecord({
      ...current,
      leadershipActivities: [...current.leadershipActivities, newLeadership.trim()],
    });
    setNewLeadership('');
  };

  // Compute Performance Score
  const doneTasks = current.tasks.filter((t) => t.status === 'done').length;
  const totalTasks = current.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 100;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-blue-500">
          Module 04
        </p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Career & Office
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Office tasks, achievements, meetings, skills learned, mistakes and leadership.
        </p>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-white/5 rounded-xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'tasks'
              ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Tasks ({current.tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('wins')}
          className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'wins'
              ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Wins ({current.achievements.length})
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'meetings'
              ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Meetings ({current.meetings.length})
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'growth'
              ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Growth
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'report'
              ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Report
        </button>
      </div>

      {/* TAB 1: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-3.5">
          {/* Add Task Form */}
          <form
            onSubmit={handleAddTask}
            className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="New office task or project milestone..."
                className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              />
              <button
                type="submit"
                disabled={!taskTitle.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm shrink-0"
              >
                Add
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Priority:</span>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTaskPriority(p)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition ${
                    taskPriority === p
                      ? p === 'high'
                        ? 'bg-rose-500 text-white'
                        : p === 'medium'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </form>

          {/* Tasks List */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Daily Work List ({doneTasks}/{totalTasks} Done)
              </span>
              <span className="text-xs font-mono text-blue-500 font-semibold">
                {completionRate}%
              </span>
            </div>

            {current.tasks.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No office tasks logged for today. Add your deliverables above!
              </p>
            ) : (
              current.tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div
                    onClick={() => handleToggleTaskStatus(task.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        task.status === 'done'
                          ? 'bg-emerald-500 text-white'
                          : task.status === 'in_progress'
                          ? 'bg-amber-500 text-white'
                          : 'border-2 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                      ) : task.status === 'in_progress' ? (
                        <span className="text-[9px] font-bold">~</span>
                      ) : null}
                    </div>
                    <div>
                      <span
                        className={`font-medium ${
                          task.status === 'done'
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider ${
                            task.priority === 'high'
                              ? 'text-rose-500'
                              : task.priority === 'medium'
                              ? 'text-amber-500'
                              : 'text-blue-500'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[9px] text-slate-400">·</span>
                        <span className="text-[9px] text-slate-400 capitalize">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Achievements / Wins */}
      {activeTab === 'wins' && (
        <div className="space-y-3.5">
          <form
            onSubmit={handleAddAchievement}
            className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2"
          >
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Log Key Achievement / Win
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                placeholder="e.g. Shipped feature ahead of schedule, solved latency bottleneck..."
                className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              />
              <button
                type="submit"
                disabled={!newAchievement.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm shrink-0"
              >
                Log Win
              </button>
            </div>
          </form>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-white/5">
              Achievements Logged ({current.achievements.length})
            </h3>
            {current.achievements.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No achievements recorded for today yet. Every win counts!
              </p>
            ) : (
              current.achievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-xs"
                >
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-slate-800 dark:text-slate-200 font-medium flex-1">
                    {ach}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Meetings */}
      {activeTab === 'meetings' && (
        <div className="space-y-3.5">
          <form
            onSubmit={handleAddMeeting}
            className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
          >
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              Log Meeting & Takeaways
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Time</label>
                <input
                  type="time"
                  value={meetTime}
                  onChange={(e) => setMeetTime(e.target.value)}
                  className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Meeting Title</label>
                <input
                  type="text"
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                  placeholder="e.g. Design review, 1-on-1 with VP"
                  className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Key Takeaways & Decisions</label>
              <textarea
                value={meetTakeaways}
                onChange={(e) => setMeetTakeaways(e.target.value)}
                rows={2}
                placeholder="What decisions were made? Next action items?"
                className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!meetTitle.trim()}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition"
            >
              + Save Meeting Record
            </button>
          </form>

          {current.meetings.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-white/5">
                Meetings Held ({current.meetings.length})
              </h3>
              {current.meetings.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-500 font-bold">{m.time}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{m.title}</span>
                  </div>
                  {m.keyTakeaways && (
                    <p className="text-slate-600 dark:text-slate-300 pl-2 border-l border-indigo-400/30">
                      {m.keyTakeaways}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Growth (Skills, Mistakes & Reflections, Leadership) */}
      {activeTab === 'growth' && (
        <div className="space-y-3.5">
          {/* Skills */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-cyan-500" />
              Skills Learned Today
            </h3>
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. Distributed consensus, GraphQL query batching..."
                className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              />
              <button
                type="submit"
                disabled={!newSkill.trim()}
                className="px-3 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold shadow-sm"
              >
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {current.skillsLearned.map((sk, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Mistakes & Reflections */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Mistakes & Reflections
            </h3>
            <form onSubmit={handleAddMistake} className="flex gap-2">
              <input
                type="text"
                value={newMistake}
                onChange={(e) => setNewMistake(e.target.value)}
                placeholder="What went wrong and what is the takeaway?"
                className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              />
              <button
                type="submit"
                disabled={!newMistake.trim()}
                className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-sm"
              >
                Log
              </button>
            </form>
            <div className="space-y-1.5 pt-1">
              {current.mistakesReflection.map((m, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-slate-700 dark:text-slate-300">
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Leadership Activities */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-500" />
              Leadership & Mentorship Activities
            </h3>
            <form onSubmit={handleAddLeadership} className="flex gap-2">
              <input
                type="text"
                value={newLeadership}
                onChange={(e) => setNewLeadership(e.target.value)}
                placeholder="e.g. Facilitated cross-team unblocking, mentored intern..."
                className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              />
              <button
                type="submit"
                disabled={!newLeadership.trim()}
                className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-sm"
              >
                Add
              </button>
            </form>
            <div className="space-y-1.5 pt-1">
              {current.leadershipActivities.map((l, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-slate-700 dark:text-slate-300">
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Performance Report Summary */}
      {activeTab === 'report' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
            <FileText className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Career Performance Report · {selectedDate}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Tasks</p>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {doneTasks}/{totalTasks}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Key Wins</p>
              <p className="text-lg font-bold font-mono text-amber-500">
                {current.achievements.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Meetings</p>
              <p className="text-lg font-bold font-mono text-indigo-500">
                {current.meetings.length}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <p className="font-semibold text-slate-900 dark:text-white">Executive Synthesis:</p>
            <p>
              {doneTasks > 0
                ? `Successfully completed ${doneTasks} work item(s) with ${completionRate}% task resolution rate.`
                : 'No tasks marked completed today.'}
              {current.achievements.length > 0 &&
                ` Noteworthy achievements recorded: ${current.achievements.join(', ')}.`}
              {current.skillsLearned.length > 0 &&
                ` Expanded technical repertoire with: ${current.skillsLearned.join(', ')}.`}
              {current.leadershipActivities.length > 0 &&
                ` Demonstrated leadership through: ${current.leadershipActivities.join(', ')}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
