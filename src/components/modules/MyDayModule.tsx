import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { DayEvent } from '../../types';
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Sun,
  Moon,
  Calendar,
  Sparkles,
  Zap,
} from 'lucide-react';

export const MyDayModule: React.FC = () => {
  const { selectedDate, dayRecord, saveDayRecord } = useLifeOS();

  const [wakeUpTime, setWakeUpTime] = useState(dayRecord?.wakeUpTime || '06:30');
  const [sleepTime, setSleepTime] = useState(dayRecord?.sleepTime || '22:30');
  const [energyRating, setEnergyRating] = useState(dayRecord?.energyRating || 4);
  const [notes, setNotes] = useState(dayRecord?.notes || '');

  const [newEventTime, setNewEventTime] = useState('09:00');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<DayEvent['category']>('routine');

  // Sync state if dayRecord changes
  React.useEffect(() => {
    if (dayRecord) {
      setWakeUpTime(dayRecord.wakeUpTime || '06:30');
      setSleepTime(dayRecord.sleepTime || '22:30');
      setEnergyRating(dayRecord.energyRating || 4);
      setNotes(dayRecord.notes || '');
    }
  }, [dayRecord]);

  const handleSaveRoutineTimes = async () => {
    const existingEvents = dayRecord?.events || [];
    await saveDayRecord({
      date: selectedDate,
      wakeUpTime,
      sleepTime,
      energyRating,
      events: existingEvents,
      notes,
    });
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvent: DayEvent = {
      id: `evt_${Date.now()}`,
      time: newEventTime,
      title: newEventTitle.trim(),
      category: newEventCategory,
      completed: false,
    };

    const updatedEvents = [...(dayRecord?.events || []), newEvent].sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    await saveDayRecord({
      date: selectedDate,
      wakeUpTime,
      sleepTime,
      energyRating,
      events: updatedEvents,
      notes,
    });

    setNewEventTitle('');
  };

  const handleToggleEvent = async (eventId: string) => {
    if (!dayRecord) return;
    const updatedEvents = dayRecord.events.map((evt) =>
      evt.id === eventId ? { ...evt, completed: !evt.completed } : evt
    );
    await saveDayRecord({
      ...dayRecord,
      events: updatedEvents,
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!dayRecord) return;
    const updatedEvents = dayRecord.events.filter((evt) => evt.id !== eventId);
    await saveDayRecord({
      ...dayRecord,
      events: updatedEvents,
    });
  };

  const events = dayRecord?.events || [];

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-amber-500">
          Module 01
        </p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Day & Schedule
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Wake-up, daily activities, office routine, personal time and sleep.
        </p>
      </div>

      {/* Routine Blocks (Wake & Sleep) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          Routine Boundaries
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" /> Wake-Up Time
            </label>
            <input
              type="time"
              value={wakeUpTime}
              onChange={(e) => setWakeUpTime(e.target.value)}
              onBlur={handleSaveRoutineTimes}
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-400" /> Target Bedtime
            </label>
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              onBlur={handleSaveRoutineTimes}
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold"
            />
          </div>
        </div>

        {/* Energy Level Selector */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Daily Energy State
          </label>
          <div className="mt-1 flex gap-2">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={async () => {
                  setEnergyRating(lvl);
                  await saveDayRecord({
                    date: selectedDate,
                    wakeUpTime,
                    sleepTime,
                    energyRating: lvl,
                    events,
                    notes,
                  });
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  energyRating === lvl
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                }`}
              >
                {lvl} {lvl === 5 ? '⚡' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Day Activity Form */}
      <form
        onSubmit={handleAddEvent}
        className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
      >
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-indigo-500" />
          Add Daily Activity
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Time</label>
            <input
              type="time"
              value={newEventTime}
              onChange={(e) => setNewEventTime(e.target.value)}
              className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Category</label>
            <select
              value={newEventCategory}
              onChange={(e) => setNewEventCategory(e.target.value as any)}
              className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
            >
              <option value="routine">Routine</option>
              <option value="office">Office / Work</option>
              <option value="fitness">Fitness</option>
              <option value="personal">Personal Time</option>
              <option value="learning">Learning</option>
              <option value="rest">Rest / Wind Down</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 dark:text-slate-400">Activity Title</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="e.g. Deep Work on API refactor, Team Sync, Evening walk..."
              className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
            />
            <button
              type="submit"
              disabled={!newEventTitle.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      </form>

      {/* Activities Timeline */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Daily Activities ({events.length})
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {events.filter((e) => e.completed).length}/{events.length} completed
          </span>
        </div>

        {events.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No activities scheduled for this day yet. Add your morning routine, office blocks, and personal time above!
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((evt) => (
              <div
                key={evt.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  evt.completed
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/5'
                }`}
              >
                <div
                  onClick={() => handleToggleEvent(evt.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      evt.completed
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {evt.completed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">
                        {evt.time}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {evt.category}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 font-medium ${
                        evt.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {evt.title}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteEvent(evt.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                  aria-label="Delete Event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Day Notes */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Day Notes & Reflections
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveRoutineTimes}
          placeholder="Jot down quick thoughts or reflections about the day's routine..."
          rows={3}
          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
};
