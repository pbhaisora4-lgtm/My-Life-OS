import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { parseQuickEntryText } from '../../services/quickEntryParser';
import { ParsedQuickEntry, GymExercise, CardioLog, MealLog } from '../../types';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Calendar,
  Sparkles,
  Clock,
  Dumbbell,
  Briefcase,
  DollarSign,
  Heart,
  BookOpen,
  Trash2,
  Plus,
} from 'lucide-react';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    selectedDate,
    saveDayRecord,
    dayRecord,
    saveJournalEntry,
    saveFitnessRecord,
    fitnessRecord,
    saveCareerRecord,
    careerRecord,
    saveFinanceTransaction,
    toggleHabit,
    saveLearningEntry,
    saveMoodRecord,
    showIslandNotice,
  } = useLifeOS();

  const [rawText, setRawText] = useState('');
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [parsedData, setParsedData] = useState<ParsedQuickEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!rawText.trim()) return;
    const parsed = parseQuickEntryText(rawText, selectedDate);
    setParsedData(parsed);
    setStep('review');
  };

  const handleTemplateInsert = (template: string) => {
    setRawText(template);
  };

  const handleSaveToOS = async () => {
    if (!parsedData) return;
    setIsSubmitting(true);
    try {
      const date = parsedData.date || selectedDate;

      // 1. Save Day Record (wake up, sleep)
      if (parsedData.wakeUpTime || parsedData.sleepTime) {
        await saveDayRecord({
          date,
          wakeUpTime: parsedData.wakeUpTime || dayRecord?.wakeUpTime,
          sleepTime: parsedData.sleepTime || dayRecord?.sleepTime,
          energyRating: parsedData.mood?.energy || dayRecord?.energyRating || 4,
          events: dayRecord?.events || [],
          notes: dayRecord?.notes,
        });
      }

      // 2. Save Journal Story
      if (parsedData.journalStory?.trim()) {
        await saveJournalEntry({
          id: `journal_${Date.now()}`,
          date,
          timestamp: new Date().toISOString(),
          title: `Daily Record · ${date}`,
          story: parsedData.journalStory,
          photos: [],
          moodTag: parsedData.mood?.score === 5 ? 'Energized' : parsedData.mood?.score === 4 ? 'Good' : 'Focused',
          tags: ['Daily Dump', 'Quick Entry'],
        });
      }

      // 3. Save Fitness
      if (
        parsedData.fitness?.steps ||
        parsedData.fitness?.waterMl ||
        parsedData.fitness?.weight ||
        parsedData.fitness?.cardio?.length ||
        parsedData.fitness?.exercises?.length ||
        parsedData.fitness?.meals?.length
      ) {
        const existingFit = fitnessRecord || {
          id: `fit_${date}`,
          date,
          steps: 0,
          caloriesBurnedTotal: 0,
          waterMl: 0,
          exercises: [],
          cardio: [],
          meals: [],
        };

        const updatedFit = {
          ...existingFit,
          date,
          weightKg: parsedData.fitness.weight || existingFit.weightKg,
          steps: (existingFit.steps || 0) + (parsedData.fitness.steps || 0),
          waterMl: (existingFit.waterMl || 0) + (parsedData.fitness.waterMl || 0),
          caloriesBurnedTotal:
            (existingFit.caloriesBurnedTotal || 0) + (parsedData.fitness.caloriesBurned || 0),
          exercises: [
            ...(existingFit.exercises || []),
            ...(parsedData.fitness.exercises?.map((e, idx) => ({
              id: `ex_${Date.now()}_${idx}`,
              name: e.name,
              category: 'full' as const,
              sets: Array.from({ length: e.sets || 3 }).map((_, s) => ({
                setNumber: s + 1,
                reps: e.reps || 10,
                weightKg: e.weightKg || 0,
              })),
            })) || []),
          ],
          cardio: [
            ...(existingFit.cardio || []),
            ...(parsedData.fitness.cardio?.map((c, idx) => ({
              id: `cardio_${Date.now()}_${idx}`,
              type: c.type,
              distanceKm: c.distanceKm || 0,
              durationMin: c.durationMin || 30,
            })) || []),
          ],
          meals: [
            ...(existingFit.meals || []),
            ...(parsedData.fitness.meals?.map((m, idx) => ({
              id: `meal_${Date.now()}_${idx}`,
              timeOfDay: 'lunch' as const,
              food: m.food,
              calories: m.calories || 400,
              proteinG: m.proteinG || 25,
            })) || []),
          ],
        };

        await saveFitnessRecord(updatedFit);
      }

      // 4. Save Career
      if (
        parsedData.career?.tasksDone?.length ||
        parsedData.career?.achievements?.length ||
        parsedData.career?.meetings?.length ||
        parsedData.career?.skillsLearned?.length ||
        parsedData.career?.mistakes?.length ||
        parsedData.career?.leadership?.length
      ) {
        const existingCareer = careerRecord || {
          id: `car_${date}`,
          date,
          tasks: [],
          achievements: [],
          meetings: [],
          skillsLearned: [],
          mistakesReflection: [],
          leadershipActivities: [],
        };

        const newTasks = (parsedData.career.tasksDone || []).map((t, idx) => ({
          id: `task_${Date.now()}_${idx}`,
          title: t,
          status: 'done' as const,
          priority: 'medium' as const,
          category: 'office' as const,
          date,
        }));

        const newMeetings = (parsedData.career.meetings || []).map((m, idx) => ({
          id: `meet_${Date.now()}_${idx}`,
          time: '11:00',
          title: m,
          keyTakeaways: 'Logged via Quick Entry',
        }));

        await saveCareerRecord({
          ...existingCareer,
          tasks: [...(existingCareer.tasks || []), ...newTasks],
          achievements: [...(existingCareer.achievements || []), ...(parsedData.career.achievements || [])],
          meetings: [...(existingCareer.meetings || []), ...newMeetings],
          skillsLearned: [...(existingCareer.skillsLearned || []), ...(parsedData.career.skillsLearned || [])],
          mistakesReflection: [
            ...(existingCareer.mistakesReflection || []),
            ...(parsedData.career.mistakes || []),
          ],
          leadershipActivities: [
            ...(existingCareer.leadershipActivities || []),
            ...(parsedData.career.leadership || []),
          ],
        });
      }

      // 5. Save Finance
      if (parsedData.finance?.expenses?.length) {
        for (const exp of parsedData.finance.expenses) {
          await saveFinanceTransaction({
            id: `fin_${Date.now()}_${Math.random()}`,
            date,
            type: 'expense',
            category: exp.category,
            amount: exp.amount,
            currency: 'USD',
            notes: exp.notes,
            paymentMethod: 'Apple Pay',
          });
        }
      }
      if (parsedData.finance?.income?.length) {
        for (const inc of parsedData.finance.income) {
          await saveFinanceTransaction({
            id: `fin_${Date.now()}_${Math.random()}`,
            date,
            type: 'income',
            category: inc.category,
            amount: inc.amount,
            currency: 'USD',
            notes: inc.notes,
            paymentMethod: 'Direct Deposit',
          });
        }
      }

      // 6. Toggle Habits
      if (parsedData.habitsToggled?.length) {
        for (const habitId of parsedData.habitsToggled) {
          await toggleHabit(habitId, date);
        }
      }

      // 7. Save Learning
      if (parsedData.learning?.length) {
        for (const learn of parsedData.learning) {
          await saveLearningEntry({
            id: `learn_${Date.now()}_${Math.random()}`,
            date,
            category: learn.category,
            topic: learn.topic,
            notes: learn.notes,
            durationMin: 20,
            completed: true,
          });
        }
      }

      // 8. Save Mood & Reflection
      if (parsedData.mood) {
        await saveMoodRecord({
          id: `mood_${date}`,
          date,
          moodScore: parsedData.mood.score || 4,
          energyLevel: parsedData.mood.energy || 4,
          stressLevel: parsedData.mood.stress || 2,
          gratitudeItems: [
            parsedData.mood.gratitude?.[0] || 'Health & vitality',
            parsedData.mood.gratitude?.[1] || 'Productive focus',
            parsedData.mood.gratitude?.[2] || 'Progress on my goals',
          ],
          reflection: parsedData.journalStory?.slice(0, 240) || 'Solid day of progress.',
        });
      }

      showIslandNotice('All Entries Saved!', 'Categorized and recorded to local IndexedDB');
      setRawText('');
      setStep('input');
      onClose();
    } catch (err) {
      console.error('Failed to save quick entry', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#121622] rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {step === 'input' ? 'Daily Quick Entry' : 'Review & Categorize'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {step === 'input' ? 'Brain-dump your entire day in one box' : 'Verify & edit parsed records before saving'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'input' ? (
            <>
              {/* Quick Template Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Quick Starter Templates
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() =>
                      handleTemplateInsert(
                        'Woke up at 6:30am. Ran 5km in 26 mins, drank 2.5L water.\nGym: bench press 80kg 3x10, pullups 3x12.\nBreakfast: oatmeal and 3 eggs 450 kcal 32g protein.\nOffice: Completed system architecture design, led sprint review.\nSpent $14.50 on lunch.\nLearned Go concurrency patterns.\nFeeling energetic and grateful for steady progress.'
                      )
                    }
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 border border-slate-200/80 dark:border-slate-700"
                  >
                    🚀 Full Day Power Dump
                  </button>
                  <button
                    onClick={() =>
                      handleTemplateInsert(
                        'Woke up 7:00am. Drank 2L water.\nBreakfast: Greek yogurt and berries 300 kcal 20g protein.\nSpent $45 on groceries.\nEnglish practice: mastered 5 executive idioms.\nMood was calm and productive.'
                      )
                    }
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 border border-slate-200/80 dark:border-slate-700"
                  >
                    🥑 Light Routine & Diet
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Type anything naturally about your day...
- Wake-up / sleep times (e.g. woke up 6:30am)
- Workout & fitness (e.g. ran 5km, bench 80kg 3x10, 10k steps)
- Water & meals (e.g. 2.5L water, chicken salad 500 kcal 40g protein)
- Work & tasks done (e.g. shipped v2 API, meeting with client)
- Expenses (e.g. spent $18 on lunch)
- Learnings & reflections (e.g. learned English idioms, grateful for family)"
                  rows={9}
                  className="w-full rounded-2xl p-4 text-xs sm:text-sm bg-slate-50 dark:bg-[#0a0d14] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Helper notice */}
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Our offline parser instantly analyzes routine, workouts, meals, tasks, money, habits, and mood. You can review and tweak everything in the next screen before saving.
                </span>
              </div>
            </>
          ) : (
            /* Review & Categorization Screen */
            parsedData && (
              <div className="space-y-4 text-xs">
                {/* 1. Routine */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>My Day Routine</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400">Wake Up</label>
                      <input
                        type="time"
                        value={parsedData.wakeUpTime || ''}
                        onChange={(e) =>
                          setParsedData({ ...parsedData, wakeUpTime: e.target.value })
                        }
                        className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400">Bedtime</label>
                      <input
                        type="time"
                        value={parsedData.sleepTime || ''}
                        onChange={(e) =>
                          setParsedData({ ...parsedData, sleepTime: e.target.value })
                        }
                        className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Fitness */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <Dumbbell className="w-4 h-4 text-cyan-500" />
                    <span>Fitness, Cardio & Water</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400">Steps</label>
                      <input
                        type="number"
                        value={parsedData.fitness?.steps || ''}
                        placeholder="0"
                        onChange={(e) =>
                          setParsedData({
                            ...parsedData,
                            fitness: { ...parsedData.fitness, steps: parseInt(e.target.value, 10) || 0 },
                          })
                        }
                        className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400">Water (ml)</label>
                      <input
                        type="number"
                        value={parsedData.fitness?.waterMl || ''}
                        placeholder="0"
                        onChange={(e) =>
                          setParsedData({
                            ...parsedData,
                            fitness: { ...parsedData.fitness, waterMl: parseInt(e.target.value, 10) || 0 },
                          })
                        }
                        className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={parsedData.fitness?.weight || ''}
                        placeholder="kg"
                        onChange={(e) =>
                          setParsedData({
                            ...parsedData,
                            fitness: { ...parsedData.fitness, weight: parseFloat(e.target.value) || undefined },
                          })
                        }
                        className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Exercises list */}
                  {parsedData.fitness?.exercises && parsedData.fitness.exercises.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <span className="text-[10px] text-slate-400">Gym Exercises:</span>
                      {parsedData.fitness.exercises.map((ex, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{ex.name}</span>
                          <span className="font-mono text-cyan-500 text-[11px]">
                            {ex.weightKg ? `${ex.weightKg}kg · ` : ''}{ex.sets} sets x {ex.reps} reps
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Meals */}
                  {parsedData.fitness?.meals && parsedData.fitness.meals.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <span className="text-[10px] text-slate-400">Meals Detected:</span>
                      {parsedData.fitness.meals.map((meal, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{meal.food}</span>
                          <span className="font-mono text-emerald-500 text-[11px] shrink-0">
                            {meal.calories} kcal · {meal.proteinG}g protein
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Career */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    <span>Career & Office Activities</span>
                  </div>
                  {parsedData.career?.tasksDone && parsedData.career.tasksDone.length > 0 ? (
                    <div className="space-y-1.5">
                      {parsedData.career.tasksDone.map((task, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-slate-800 dark:text-slate-200">{task}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No office tasks detected in text.</p>
                  )}
                </div>

                {/* 4. Finance */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Finance & Expenses</span>
                  </div>
                  {parsedData.finance?.expenses && parsedData.finance.expenses.length > 0 ? (
                    <div className="space-y-1.5">
                      {parsedData.finance.expenses.map((exp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{exp.notes}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({exp.category})</span>
                          </div>
                          <span className="font-mono text-rose-500 font-bold">-${exp.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No expenses detected.</p>
                  )}
                </div>

                {/* 5. Mood & Gratitude */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Mood & Reflections</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Mood Score</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() =>
                            setParsedData({
                              ...parsedData,
                              mood: { ...parsedData.mood, score },
                            })
                          }
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                            parsedData.mood?.score === score
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#0c0f18] flex items-center justify-between shrink-0">
          {step === 'input' ? (
            <>
              <button
                onClick={() => setRawText('')}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Clear
              </button>
              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md active:scale-95 transition"
              >
                <span>Review & Categorize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('input')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Edit</span>
              </button>
              <button
                onClick={handleSaveToOS}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 active:scale-95 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving to OS...' : 'Save to Life OS'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
