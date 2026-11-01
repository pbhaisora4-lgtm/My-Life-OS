import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { MoodRecord } from '../../types';
import {
  Heart,
  Smile,
  Zap,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const MoodModule: React.FC = () => {
  const { selectedDate, moodRecord, saveMoodRecord, allMoodRecords } = useLifeOS();

  const current: MoodRecord = moodRecord || {
    id: `mood_${selectedDate}`,
    date: selectedDate,
    moodScore: 4,
    energyLevel: 4,
    stressLevel: 2,
    gratitudeItems: ['', '', ''],
    reflection: '',
  };

  const [moodScore, setMoodScore] = useState<number>(current.moodScore);
  const [energyLevel, setEnergyLevel] = useState<number>(current.energyLevel);
  const [stressLevel, setStressLevel] = useState<number>(current.stressLevel);
  const [gratitude1, setGratitude1] = useState(current.gratitudeItems[0] || '');
  const [gratitude2, setGratitude2] = useState(current.gratitudeItems[1] || '');
  const [gratitude3, setGratitude3] = useState(current.gratitudeItems[2] || '');
  const [reflection, setReflection] = useState(current.reflection || '');

  React.useEffect(() => {
    if (moodRecord) {
      setMoodScore(moodRecord.moodScore);
      setEnergyLevel(moodRecord.energyLevel);
      setStressLevel(moodRecord.stressLevel);
      setGratitude1(moodRecord.gratitudeItems[0] || '');
      setGratitude2(moodRecord.gratitudeItems[1] || '');
      setGratitude3(moodRecord.gratitudeItems[2] || '');
      setReflection(moodRecord.reflection || '');
    }
  }, [moodRecord]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMoodRecord({
      id: `mood_${selectedDate}`,
      date: selectedDate,
      moodScore,
      energyLevel,
      stressLevel,
      gratitudeItems: [gratitude1.trim(), gratitude2.trim(), gratitude3.trim()],
      reflection: reflection.trim(),
    });
  };

  const moodLevels = [
    { score: 1, label: 'Challenging', emoji: '🌧️', color: 'text-slate-400' },
    { score: 2, label: 'Low Energy', emoji: '☁️', color: 'text-blue-400' },
    { score: 3, label: 'Balanced', emoji: '🌤️', color: 'text-amber-400' },
    { score: 4, label: 'High Focus', emoji: '☀️', color: 'text-emerald-400' },
    { score: 5, label: 'Peak Flow', emoji: '✨', color: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-rose-500">
          Module 09
        </p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mood & Mindset
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Daily mood, energy state, stress level, 3 gratitudes and evening reflection.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Mood Selector Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-rose-500" />
              Daily Mood State · {selectedDate}
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-500">
              {moodScore}/5
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-1">
            {moodLevels.map((lvl) => (
              <button
                key={lvl.score}
                type="button"
                onClick={() => setMoodScore(lvl.score)}
                className={`py-3 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                  moodScore === lvl.score
                    ? 'bg-rose-500/10 border-2 border-rose-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">{lvl.emoji}</span>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 tracking-tight text-center">
                  {lvl.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy & Stress Dials */}
        <div className="grid grid-cols-2 gap-3">
          {/* Energy */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Energy Level
              </span>
              <span className="text-xs font-mono font-bold text-amber-500">{energyLevel}/5</span>
            </div>
            <div className="flex gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEnergyLevel(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                    energyLevel === val
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                Stress Level
              </span>
              <span className="text-xs font-mono font-bold text-rose-500">{stressLevel}/5</span>
            </div>
            <div className="flex gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStressLevel(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                    stressLevel === val
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3 Gratitudes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            3 Things I Am Grateful For Today
          </h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold font-mono text-[10px]">
                1
              </span>
              <input
                type="text"
                value={gratitude1}
                onChange={(e) => setGratitude1(e.target.value)}
                placeholder="Morning workout, sunrise, physical health..."
                className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold font-mono text-[10px]">
                2
              </span>
              <input
                type="text"
                value={gratitude2}
                onChange={(e) => setGratitude2(e.target.value)}
                placeholder="Supportive team member, meaningful progress on work..."
                className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold font-mono text-[10px]">
                3
              </span>
              <input
                type="text"
                value={gratitude3}
                onChange={(e) => setGratitude3(e.target.value)}
                placeholder="Evening quiet time, delicious meal, peaceful mind..."
                className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Evening Reflection */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Evening Reflection & Insights
          </h3>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            placeholder="How did I show up today? What did I do well? What can I improve tomorrow?"
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md active:scale-98 transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Mood & Reflection</span>
        </button>
      </form>
    </div>
  );
};
