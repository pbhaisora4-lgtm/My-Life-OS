import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { LearningEntry } from '../../types';
import {
  BookOpen,
  Languages,
  MessageSquare,
  Compass,
  Cpu,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const LearningModule: React.FC = () => {
  const {
    selectedDate,
    learningEntries,
    saveLearningEntry,
    deleteLearningEntry,
  } = useLifeOS();

  const [activeCategory, setActiveCategory] = useState<LearningEntry['category']>('english');

  // Form states
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMin, setDurationMin] = useState('20');
  const [refUrl, setRefUrl] = useState('');

  const categories = [
    { id: 'english' as const, label: 'English', icon: Languages, color: 'text-emerald-500' },
    { id: 'communication' as const, label: 'Communication', icon: MessageSquare, color: 'text-blue-500' },
    { id: 'leadership' as const, label: 'Leadership', icon: Compass, color: 'text-purple-500' },
    { id: 'technology' as const, label: 'Technology', icon: Cpu, color: 'text-cyan-500' },
  ];

  const handleAddLearning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const newEntry: LearningEntry = {
      id: `learn_${Date.now()}`,
      date: selectedDate,
      category: activeCategory,
      topic: topic.trim(),
      notes: notes.trim(),
      durationMin: parseInt(durationMin, 10) || 15,
      completed: true,
      referenceUrl: refUrl.trim() || undefined,
    };

    await saveLearningEntry(newEntry);
    setTopic('');
    setNotes('');
    setRefUrl('');
  };

  const filteredEntries = learningEntries.filter(
    (e) => e.category === activeCategory
  );

  const totalMinutesLearned = learningEntries.reduce(
    (acc, curr) => acc + (curr.durationMin || 0),
    0
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-500">
            Module 07
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Learning & Mastery
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            English, communication, leadership, technology and daily goals.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-right">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Time</p>
          <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
            {totalMinutesLearned} mins
          </p>
        </div>
      </div>

      {/* 4 Pillars Tab Ribbon */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 dark:bg-white/5 rounded-2xl">
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = activeCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? c.color : 'text-slate-400'}`} />
              <span className="text-[10px] font-bold tracking-tight truncate w-full text-center">
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add Learning Log Form */}
      <form
        onSubmit={handleAddLearning}
        className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            Log {categories.find((c) => c.id === activeCategory)?.label} Session
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">{selectedDate}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Concept / Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                activeCategory === 'english'
                  ? 'e.g. Phrase "Call the shots", Executive vocabulary'
                  : activeCategory === 'communication'
                  ? 'e.g. The Pyramid Principle for email summaries'
                  : activeCategory === 'leadership'
                  ? 'e.g. Extreme Ownership & psychological safety'
                  : 'e.g. Postgres Index Scan vs Bitmap Heap Scan'
              }
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Duration (Mins)</label>
            <input
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 dark:text-slate-400">Key Takeaways & Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Write key definitions, mental models, sentences, or code snippets..."
            className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-500 dark:text-slate-400">Reference URL (optional)</label>
          <input
            type="url"
            value={refUrl}
            onChange={(e) => setRefUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={!topic.trim()}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md active:scale-95 transition"
        >
          + Save Learning Entry
        </button>
      </form>

      {/* Entries List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider px-1">
          {categories.find((c) => c.id === activeCategory)?.label} History ({filteredEntries.length})
        </h3>

        {filteredEntries.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-400">
            No entries logged under {activeCategory}. Log your daily practice above!
          </div>
        ) : (
          filteredEntries.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-mono">{item.date}</span>
                    <span>·</span>
                    <span className="font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      {item.durationMin} mins
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {item.topic}
                  </h4>
                </div>

                <button
                  onClick={() => deleteLearningEntry(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {item.notes && (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl">
                  {item.notes}
                </p>
              )}

              {item.referenceUrl && (
                <a
                  href={item.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-500 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Reference Source</span>
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
