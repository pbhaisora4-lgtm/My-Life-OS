import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { GymExercise, CardioLog, MealLog, FitnessRecord } from '../../types';
import { dbService } from '../../services/db';
import {
  Flame,
  Footprints,
  Droplets,
  Scale,
  Dumbbell,
  Utensils,
  Plus,
  Trash2,
  Download,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const FitnessModule: React.FC = () => {
  const {
    selectedDate,
    fitnessRecord,
    allFitnessRecords,
    saveFitnessRecord,
    settings,
    showIslandNotice,
  } = useLifeOS();

  // Current record or empty template
  const current: FitnessRecord = fitnessRecord || {
    id: `fit_${selectedDate}`,
    date: selectedDate,
    weightKg: undefined,
    steps: 0,
    caloriesBurnedTotal: 0,
    waterMl: 0,
    exercises: [],
    cardio: [],
    meals: [],
    notes: '',
  };

  // Local form states
  const [stepsInput, setStepsInput] = useState<number>(current.steps || 0);
  const [weightInput, setWeightInput] = useState<string>(
    current.weightKg ? String(current.weightKg) : ''
  );
  const [caloriesInput, setCaloriesInput] = useState<number>(
    current.caloriesBurnedTotal || 0
  );

  // Sync when date changes
  React.useEffect(() => {
    setStepsInput(fitnessRecord?.steps || 0);
    setWeightInput(fitnessRecord?.weightKg ? String(fitnessRecord.weightKg) : '');
    setCaloriesInput(fitnessRecord?.caloriesBurnedTotal || 0);
  }, [fitnessRecord]);

  // Save base metrics
  const handleSaveBaseMetrics = async () => {
    await saveFitnessRecord({
      ...current,
      steps: Number(stepsInput) || 0,
      weightKg: weightInput ? parseFloat(weightInput) : undefined,
      caloriesBurnedTotal: Number(caloriesInput) || 0,
    });
  };

  // Quick water addition
  const handleAddWater = async (amount: number) => {
    const updated = (current.waterMl || 0) + amount;
    await saveFitnessRecord({
      ...current,
      waterMl: updated,
    });
  };

  // Cardio state & add
  const [cardioType, setCardioType] = useState('Running');
  const [cardioDist, setCardioDist] = useState('5.0');
  const [cardioDuration, setCardioDuration] = useState('25');
  const [cardioCals, setCardioCals] = useState('320');

  const handleAddCardio = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCardio: CardioLog = {
      id: `c_${Date.now()}`,
      type: cardioType,
      distanceKm: parseFloat(cardioDist) || 0,
      durationMin: parseInt(cardioDuration, 10) || 0,
      caloriesBurned: parseInt(cardioCals, 10) || undefined,
    };
    await saveFitnessRecord({
      ...current,
      cardio: [...current.cardio, newCardio],
      caloriesBurnedTotal:
        (current.caloriesBurnedTotal || 0) + (newCardio.caloriesBurned || 0),
    });
  };

  const handleRemoveCardio = async (id: string) => {
    await saveFitnessRecord({
      ...current,
      cardio: current.cardio.filter((c) => c.id !== id),
    });
  };

  // Gym Exercise state & add
  const [exName, setExName] = useState('');
  const [exCategory, setExCategory] = useState<GymExercise['category']>('chest');
  const [exWeight, setExWeight] = useState('60');
  const [exReps, setExReps] = useState('10');
  const [exSets, setExSets] = useState('3');

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exName.trim()) return;

    const setsCount = parseInt(exSets, 10) || 3;
    const repsCount = parseInt(exReps, 10) || 10;
    const weightNum = parseFloat(exWeight) || 0;

    const newEx: GymExercise = {
      id: `ex_${Date.now()}`,
      name: exName.trim(),
      category: exCategory,
      sets: Array.from({ length: setsCount }).map((_, i) => ({
        setNumber: i + 1,
        reps: repsCount,
        weightKg: weightNum,
      })),
    };

    await saveFitnessRecord({
      ...current,
      exercises: [...current.exercises, newEx],
    });

    setExName('');
  };

  const handleRemoveExercise = async (id: string) => {
    await saveFitnessRecord({
      ...current,
      exercises: current.exercises.filter((e) => e.id !== id),
    });
  };

  // Meals state & add
  const [mealTime, setMealTime] = useState<MealLog['timeOfDay']>('lunch');
  const [mealFood, setMealFood] = useState('');
  const [mealCals, setMealCals] = useState('500');
  const [mealProtein, setMealProtein] = useState('35');

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealFood.trim()) return;

    const newMeal: MealLog = {
      id: `meal_${Date.now()}`,
      timeOfDay: mealTime,
      food: mealFood.trim(),
      calories: parseInt(mealCals, 10) || 0,
      proteinG: parseInt(mealProtein, 10) || 0,
    };

    await saveFitnessRecord({
      ...current,
      meals: [...current.meals, newMeal],
    });

    setMealFood('');
  };

  const handleRemoveMeal = async (id: string) => {
    await saveFitnessRecord({
      ...current,
      meals: current.meals.filter((m) => m.id !== id),
    });
  };

  // Export CSV
  const handleExportCSV = async () => {
    const csv = await dbService.exportFitnessCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lifeos_fitness_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showIslandNotice('Fitness CSV Exported', 'Downloaded records file');
  };

  // Nutrition totals
  const totalCaloriesIntake = current.meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProteinIntake = current.meals.reduce((acc, m) => acc + m.proteinG, 0);

  // Weekly Progress (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split('T')[0];
    const rec = allFitnessRecords.find((r) => r.date === dStr);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    return {
      date: dStr,
      label: dayLabel,
      steps: rec?.steps || 0,
      water: rec?.waterMl || 0,
      active: dStr === selectedDate,
    };
  });

  const maxStepsWeek = Math.max(10000, ...last7Days.map((d) => d.steps));

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-cyan-500">
            Module 03
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fitness & Body
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gym sets, cardio, walking steps, meals, protein, water and weekly charts.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-slate-200 transition"
          title="Export Fitness CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>CSV</span>
        </button>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Steps */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <span>Walking Steps</span>
            <Footprints className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <input
            type="number"
            value={stepsInput || ''}
            onChange={(e) => setStepsInput(parseInt(e.target.value, 10) || 0)}
            onBlur={handleSaveBaseMetrics}
            placeholder="0"
            className="mt-1 w-full text-lg font-bold font-mono bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
          <span className="text-[10px] text-slate-400 font-mono">
            Target: {settings.stepTarget.toLocaleString()}
          </span>
        </div>

        {/* Water */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <span>Water Intake</span>
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {(current.waterMl / 1000).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">L</span>
          </div>
          <span className="text-[10px] text-blue-500 font-mono">
            {current.waterMl} ml
          </span>
        </div>

        {/* Weight */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <span>Morning Weight</span>
            <Scale className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <input
            type="number"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            onBlur={handleSaveBaseMetrics}
            placeholder="e.g. 74.0"
            className="mt-1 w-full text-lg font-bold font-mono bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
          <span className="text-[10px] text-slate-400 font-mono">kg</span>
        </div>

        {/* Protein */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <span>Protein</span>
            <Flame className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {totalProteinIntake}
            </span>
            <span className="text-xs text-slate-400 font-mono">g</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-mono">
            Target: {settings.proteinTargetG}g
          </span>
        </div>
      </div>

      {/* Quick Water Tap Ribbon */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
          <Droplets className="w-3.5 h-3.5 text-blue-500" />
          Hydration:
        </span>
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <button
            onClick={() => handleAddWater(250)}
            className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-500/20 active:scale-95 transition"
          >
            +250ml
          </button>
          <button
            onClick={() => handleAddWater(500)}
            className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-500/20 active:scale-95 transition"
          >
            +500ml
          </button>
          <button
            onClick={() => handleAddWater(1000)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-500 active:scale-95 transition"
          >
            +1 Liter
          </button>
        </div>
      </div>

      {/* Weekly Steps & Water Progress Chart */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            7-Day Activity Trend
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Steps & Water</span>
        </div>

        {/* 7-bar chart */}
        <div className="pt-2 flex items-end justify-between h-28 gap-2 px-1">
          {last7Days.map((d, idx) => {
            const heightPercent = Math.min(100, Math.round((d.steps / maxStepsWeek) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[9px] font-mono text-slate-400">
                  {d.steps > 0 ? `${Math.round(d.steps / 1000)}k` : '0'}
                </span>
                <div className="w-full max-w-[28px] bg-slate-100 dark:bg-white/5 rounded-t-lg h-20 flex items-end overflow-hidden p-0.5">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      d.active
                        ? 'bg-gradient-to-t from-cyan-600 to-indigo-500'
                        : 'bg-cyan-500/40 hover:bg-cyan-500/70'
                    }`}
                    style={{ height: `${Math.max(8, heightPercent)}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    d.active
                      ? 'text-indigo-600 dark:text-cyan-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gym Exercises Section */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-indigo-500" />
            Gym Exercises ({current.exercises.length})
          </h3>
        </div>

        {/* Add exercise form */}
        <form onSubmit={handleAddExercise} className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Exercise Name</label>
              <input
                type="text"
                value={exName}
                onChange={(e) => setExName(e.target.value)}
                placeholder="e.g. Barbell Squat, Bench Press"
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Muscle Focus</label>
              <select
                value={exCategory}
                onChange={(e) => setExCategory(e.target.value as any)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              >
                <option value="chest">Chest</option>
                <option value="back">Back</option>
                <option value="legs">Legs</option>
                <option value="shoulders">Shoulders</option>
                <option value="arms">Arms</option>
                <option value="core">Core</option>
                <option value="full">Full Body</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Weight (kg)</label>
              <input
                type="number"
                value={exWeight}
                onChange={(e) => setExWeight(e.target.value)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Sets</label>
              <input
                type="number"
                value={exSets}
                onChange={(e) => setExSets(e.target.value)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Reps / Set</label>
              <input
                type="number"
                value={exReps}
                onChange={(e) => setExReps(e.target.value)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!exName.trim()}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition"
          >
            + Add Exercise Log
          </button>
        </form>

        {/* Exercises list */}
        {current.exercises.length > 0 && (
          <div className="space-y-2 pt-2">
            {current.exercises.map((ex) => (
              <div
                key={ex.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {ex.name}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                      {ex.category}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1 font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                    {ex.sets.map((s, i) => (
                      <span key={i} className="bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        Set {s.setNumber}: {s.weightKg}kg × {s.reps}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveExercise(ex.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cardio & Running */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-rose-500" />
          Cardio & Outdoor Runs
        </h3>

        <form onSubmit={handleAddCardio} className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Type</label>
            <select
              value={cardioType}
              onChange={(e) => setCardioType(e.target.value)}
              className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
            >
              <option value="Running">Running</option>
              <option value="Walking">Walking</option>
              <option value="Cycling">Cycling</option>
              <option value="Swimming">Swimming</option>
              <option value="HIIT">HIIT</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Dist (km)</label>
            <input
              type="number"
              step="0.1"
              value={cardioDist}
              onChange={(e) => setCardioDist(e.target.value)}
              className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400">Mins</label>
            <input
              type="number"
              value={cardioDuration}
              onChange={(e) => setCardioDuration(e.target.value)}
              className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition"
            >
              + Log
            </button>
          </div>
        </form>

        {current.cardio.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {current.cardio.map((c) => (
              <div
                key={c.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">{c.type}</span>
                  <span className="text-slate-400 ml-2 font-mono">
                    {c.distanceKm} km · {c.durationMin} mins
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveCardio(c.id)}
                  className="p-1 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meals & Nutrition */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-emerald-500" />
            Meals & Nutrition ({totalCaloriesIntake} kcal · {totalProteinIntake}g P)
          </h3>
        </div>

        <form onSubmit={handleAddMeal} className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Meal</label>
              <select
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value as any)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Food Item</label>
              <input
                type="text"
                value={mealFood}
                onChange={(e) => setMealFood(e.target.value)}
                placeholder="e.g. Oatmeal with protein powder, grilled chicken breast"
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Calories</label>
              <input
                type="number"
                value={mealCals}
                onChange={(e) => setMealCals(e.target.value)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">Protein (g)</label>
              <input
                type="number"
                value={mealProtein}
                onChange={(e) => setMealProtein(e.target.value)}
                className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!mealFood.trim()}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition"
              >
                + Add Meal
              </button>
            </div>
          </div>
        </form>

        {current.meals.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {current.meals.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 mr-2">
                    {m.timeOfDay}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{m.food}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-emerald-500 font-bold">
                    {m.calories} kcal · {m.proteinG}g P
                  </span>
                  <button
                    onClick={() => handleRemoveMeal(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
