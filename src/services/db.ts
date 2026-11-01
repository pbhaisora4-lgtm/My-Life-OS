import {
  DayRecord,
  JournalEntry,
  FitnessRecord,
  CareerRecord,
  FinanceTransaction,
  SavingsInvestmentGoal,
  HabitItem,
  LearningEntry,
  GoalItem,
  MoodRecord,
  AppSettings,
  TimelineItem,
} from '../types';

const DB_NAME = 'MyLifeOS_DB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  userName: 'Alex',
  useDeviceFrameOnDesktop: true,
  currency: 'USD',
  weightUnit: 'kg',
  waterTargetMl: 3000,
  stepTarget: 10000,
  calorieTarget: 2200,
  proteinTargetG: 140,
};

export const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'habit_gym',
    title: 'Gym Workout',
    category: 'health',
    targetDaysPerWeek: 5,
    color: '#38bdf8',
    icon: 'Dumbbell',
    streak: 0,
    completedDates: [],
  },
  {
    id: 'habit_wake_early',
    title: 'Wake Up Early (6:00 AM)',
    category: 'routine',
    targetDaysPerWeek: 6,
    color: '#fbbf24',
    icon: 'SunMedium',
    streak: 0,
    completedDates: [],
  },
  {
    id: 'habit_reading',
    title: 'Reading (20 mins)',
    category: 'growth',
    targetDaysPerWeek: 7,
    color: '#a855f7',
    icon: 'BookOpen',
    streak: 0,
    completedDates: [],
  },
  {
    id: 'habit_english',
    title: 'English Speaking / Vocabulary',
    category: 'growth',
    targetDaysPerWeek: 6,
    color: '#34d399',
    icon: 'Languages',
    streak: 0,
    completedDates: [],
  },
  {
    id: 'habit_water',
    title: 'Drink 3L Water',
    category: 'health',
    targetDaysPerWeek: 7,
    color: '#60a5fa',
    icon: 'Droplets',
    streak: 0,
    completedDates: [],
  },
  {
    id: 'habit_sleep',
    title: 'Sleep by 10:30 PM',
    category: 'routine',
    targetDaysPerWeek: 6,
    color: '#818cf8',
    icon: 'Moon',
    streak: 0,
    completedDates: [],
  },
];

class LifeOSDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('day_records')) {
          db.createObjectStore('day_records', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('journal_entries')) {
          const store = db.createObjectStore('journal_entries', { keyPath: 'id' });
          store.createIndex('by_date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('fitness_logs')) {
          const store = db.createObjectStore('fitness_logs', { keyPath: 'id' });
          store.createIndex('by_date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('career_logs')) {
          const store = db.createObjectStore('career_logs', { keyPath: 'id' });
          store.createIndex('by_date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('finance_logs')) {
          const store = db.createObjectStore('finance_logs', { keyPath: 'id' });
          store.createIndex('by_date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('savings_investments')) {
          db.createObjectStore('savings_investments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('habits')) {
          db.createObjectStore('habits', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('learning_items')) {
          const store = db.createObjectStore('learning_items', { keyPath: 'id' });
          store.createIndex('by_date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('goals')) {
          const store = db.createObjectStore('goals', { keyPath: 'id' });
          store.createIndex('by_timeframe', 'timeframe', { unique: false });
        }
        if (!db.objectStoreNames.contains('mood_logs')) {
          const store = db.createObjectStore('mood_logs', { keyPath: 'id' });
          store.createIndex('by_date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        // Check if habits are initialized
        const tx = db.transaction(['habits'], 'readwrite');
        const habitStore = tx.objectStore('habits');
        const countReq = habitStore.count();
        countReq.onsuccess = () => {
          if (countReq.result === 0) {
            INITIAL_HABITS.forEach((h) => habitStore.put(h));
          }
        };
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.openDB();
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // --- SETTINGS ---
  async getSettings(): Promise<AppSettings> {
    try {
      const store = await this.getStore('settings', 'readonly');
      return new Promise((resolve) => {
        const req = store.get('app_settings');
        req.onsuccess = () => {
          if (req.result?.value) {
            resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        };
        req.onerror = () => resolve(DEFAULT_SETTINGS);
      });
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    const store = await this.getStore('settings', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put({ key: 'app_settings', value: updated });
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  }

  // --- 1. MY DAY ---
  async getDayRecord(date: string): Promise<DayRecord | null> {
    const store = await this.getStore('day_records', 'readonly');
    return new Promise((resolve) => {
      const req = store.get(date);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async saveDayRecord(record: DayRecord): Promise<void> {
    const store = await this.getStore('day_records', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- 2. MY JOURNAL ---
  async getAllJournalEntries(): Promise<JournalEntry[]> {
    const store = await this.getStore('journal_entries', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const entries: JournalEntry[] = req.result || [];
        entries.sort((a, b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date));
        resolve(entries);
      };
      req.onerror = () => resolve([]);
    });
  }

  async getJournalEntriesByDate(date: string): Promise<JournalEntry[]> {
    const entries = await this.getAllJournalEntries();
    return entries.filter((e) => e.date === date);
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    const store = await this.getStore('journal_entries', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteJournalEntry(id: string): Promise<void> {
    const store = await this.getStore('journal_entries', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- 3. FITNESS ---
  async getFitnessRecord(date: string): Promise<FitnessRecord | null> {
    const store = await this.getStore('fitness_logs', 'readonly');
    const index = store.index('by_date');
    return new Promise((resolve) => {
      const req = index.getAll(date);
      req.onsuccess = () => {
        if (req.result && req.result.length > 0) {
          resolve(req.result[0]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  }

  async getAllFitnessRecords(): Promise<FitnessRecord[]> {
    const store = await this.getStore('fitness_logs', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const records: FitnessRecord[] = req.result || [];
        records.sort((a, b) => b.date.localeCompare(a.date));
        resolve(records);
      };
      req.onerror = () => resolve([]);
    });
  }

  async saveFitnessRecord(record: FitnessRecord): Promise<void> {
    const store = await this.getStore('fitness_logs', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- 4. CAREER ---
  async getCareerRecord(date: string): Promise<CareerRecord | null> {
    const store = await this.getStore('career_logs', 'readonly');
    const index = store.index('by_date');
    return new Promise((resolve) => {
      const req = index.getAll(date);
      req.onsuccess = () => {
        if (req.result && req.result.length > 0) {
          resolve(req.result[0]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  }

  async getAllCareerRecords(): Promise<CareerRecord[]> {
    const store = await this.getStore('career_logs', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const records: CareerRecord[] = req.result || [];
        records.sort((a, b) => b.date.localeCompare(a.date));
        resolve(records);
      };
      req.onerror = () => resolve([]);
    });
  }

  async saveCareerRecord(record: CareerRecord): Promise<void> {
    const store = await this.getStore('career_logs', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- 5. FINANCE ---
  async getAllFinanceTransactions(): Promise<FinanceTransaction[]> {
    const store = await this.getStore('finance_logs', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const txs: FinanceTransaction[] = req.result || [];
        txs.sort((a, b) => b.date.localeCompare(a.date));
        resolve(txs);
      };
      req.onerror = () => resolve([]);
    });
  }

  async saveFinanceTransaction(tx: FinanceTransaction): Promise<void> {
    const store = await this.getStore('finance_logs', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(tx);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteFinanceTransaction(id: string): Promise<void> {
    const store = await this.getStore('finance_logs', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllSavingsInvestments(): Promise<SavingsInvestmentGoal[]> {
    const store = await this.getStore('savings_investments', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async saveSavingsInvestment(item: SavingsInvestmentGoal): Promise<void> {
    const store = await this.getStore('savings_investments', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteSavingsInvestment(id: string): Promise<void> {
    const store = await this.getStore('savings_investments', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- 6. HABITS ---
  async getAllHabits(): Promise<HabitItem[]> {
    const store = await this.getStore('habits', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const habits: HabitItem[] = req.result || [];
        resolve(habits.length > 0 ? habits : INITIAL_HABITS);
      };
      req.onerror = () => resolve(INITIAL_HABITS);
    });
  }

  async saveHabit(habit: HabitItem): Promise<void> {
    const store = await this.getStore('habits', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(habit);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async toggleHabitDate(habitId: string, date: string): Promise<HabitItem | null> {
    const habits = await this.getAllHabits();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return null;

    const exists = habit.completedDates.includes(date);
    let updatedDates: string[];
    if (exists) {
      updatedDates = habit.completedDates.filter((d) => d !== date);
    } else {
      updatedDates = [...habit.completedDates, date].sort();
    }

    // Calculate current streak
    const streak = this.calculateStreak(updatedDates);
    const updatedHabit: HabitItem = {
      ...habit,
      completedDates: updatedDates,
      streak,
    };

    await this.saveHabit(updatedHabit);
    return updatedHabit;
  }

  private calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const sorted = [...new Set(dates)].sort().reverse();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if latest date is today or yesterday
    if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(sorted[0]);

    for (const d of sorted) {
      const dateExpected = checkDate.toISOString().split('T')[0];
      if (d === dateExpected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  // --- 7. LEARNING ---
  async getAllLearningEntries(): Promise<LearningEntry[]> {
    const store = await this.getStore('learning_items', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const items: LearningEntry[] = req.result || [];
        items.sort((a, b) => b.date.localeCompare(a.date));
        resolve(items);
      };
      req.onerror = () => resolve([]);
    });
  }

  async saveLearningEntry(entry: LearningEntry): Promise<void> {
    const store = await this.getStore('learning_items', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteLearningEntry(id: string): Promise<void> {
    const store = await this.getStore('learning_items', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- 8. GOALS ---
  async getAllGoals(): Promise<GoalItem[]> {
    const store = await this.getStore('goals', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async saveGoal(goal: GoalItem): Promise<void> {
    const store = await this.getStore('goals', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(goal);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteGoal(id: string): Promise<void> {
    const store = await this.getStore('goals', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- 9. MOOD ---
  async getMoodRecord(date: string): Promise<MoodRecord | null> {
    const store = await this.getStore('mood_logs', 'readonly');
    const index = store.index('by_date');
    return new Promise((resolve) => {
      const req = index.getAll(date);
      req.onsuccess = () => {
        if (req.result && req.result.length > 0) {
          resolve(req.result[0]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  }

  async getAllMoodRecords(): Promise<MoodRecord[]> {
    const store = await this.getStore('mood_logs', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const records: MoodRecord[] = req.result || [];
        records.sort((a, b) => b.date.localeCompare(a.date));
        resolve(records);
      };
      req.onerror = () => resolve([]);
    });
  }

  async saveMoodRecord(record: MoodRecord): Promise<void> {
    const store = await this.getStore('mood_logs', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- 10. TIMELINE / GLOBAL SEARCH ---
  async getLifeTimeline(query: string = '', moduleFilter?: string): Promise<TimelineItem[]> {
    const items: TimelineItem[] = [];

    // Journal
    const journals = await this.getAllJournalEntries();
    journals.forEach((j) => {
      items.push({
        id: `journal_${j.id}`,
        date: j.date,
        timestamp: j.timestamp,
        module: 'journal',
        title: j.title || 'Daily Journal',
        subtitle: j.moodTag ? `Mood: ${j.moodTag}` : undefined,
        content: j.story,
        tags: j.tags,
        meta: { photoCount: j.photos?.length || 0 },
      });
    });

    // Career
    const careers = await this.getAllCareerRecords();
    careers.forEach((c) => {
      c.achievements?.forEach((ach, idx) => {
        items.push({
          id: `career_ach_${c.id}_${idx}`,
          date: c.date,
          timestamp: `${c.date}T18:00:00.000Z`,
          module: 'career',
          title: `Career Milestone: ${ach}`,
          subtitle: 'Achievement Unlocked',
          content: ach,
        });
      });
      c.skillsLearned?.forEach((sk, idx) => {
        items.push({
          id: `career_sk_${c.id}_${idx}`,
          date: c.date,
          timestamp: `${c.date}T17:00:00.000Z`,
          module: 'career',
          title: `Skill Acquired: ${sk}`,
          subtitle: 'Professional Growth',
          content: sk,
        });
      });
    });

    // Fitness
    const fitnessLogs = await this.getAllFitnessRecords();
    fitnessLogs.forEach((f) => {
      const workouts = f.exercises.map((e) => e.name).join(', ');
      const cardio = f.cardio.map((c) => `${c.type} (${c.distanceKm}km)`).join(', ');
      const desc = [workouts && `Gym: ${workouts}`, cardio && `Cardio: ${cardio}`, f.steps > 0 && `${f.steps.toLocaleString()} steps`]
        .filter(Boolean)
        .join(' · ');

      if (desc || f.waterMl > 0) {
        items.push({
          id: `fitness_${f.id}`,
          date: f.date,
          timestamp: `${f.date}T20:00:00.000Z`,
          module: 'fitness',
          title: `Fitness Log: ${f.steps.toLocaleString()} steps`,
          subtitle: desc,
          content: f.notes,
          meta: { steps: f.steps, water: f.waterMl, weight: f.weightKg },
        });
      }
    });

    // Learning
    const learnings = await this.getAllLearningEntries();
    learnings.forEach((l) => {
      items.push({
        id: `learning_${l.id}`,
        date: l.date,
        timestamp: `${l.date}T19:00:00.000Z`,
        module: 'learning',
        title: `${l.category.toUpperCase()}: ${l.topic}`,
        subtitle: `${l.durationMin} mins`,
        content: l.notes,
      });
    });

    // Mood
    const moods = await this.getAllMoodRecords();
    moods.forEach((m) => {
      const moodLabels = ['', 'Tough', 'Low', 'Balanced', 'Good', 'Peak Flow'];
      const label = moodLabels[m.moodScore] || 'Mood';
      const gratitude = m.gratitudeItems.filter(Boolean).join(' · ');
      items.push({
        id: `mood_${m.id}`,
        date: m.date,
        timestamp: `${m.date}T21:30:00.000Z`,
        module: 'mood',
        title: `Evening Reflection · ${label}`,
        subtitle: gratitude ? `Gratitude: ${gratitude}` : undefined,
        content: m.reflection,
      });
    });

    // Finance Transactions
    const finances = await this.getAllFinanceTransactions();
    finances.forEach((tx) => {
      items.push({
        id: `finance_${tx.id}`,
        date: tx.date,
        timestamp: `${tx.date}T12:00:00.000Z`,
        module: 'finance',
        title: `${tx.type === 'income' ? '+' : '-'}${tx.currency} ${tx.amount.toFixed(2)} (${tx.category})`,
        subtitle: tx.paymentMethod,
        content: tx.notes,
      });
    });

    // Sort descending by date/timestamp
    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Filter
    return items.filter((item) => {
      if (moduleFilter && moduleFilter !== 'all' && item.module !== moduleFilter) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesContent = item.content?.toLowerCase().includes(q) || false;
        const matchesSubtitle = item.subtitle?.toLowerCase().includes(q) || false;
        const matchesDate = item.date.includes(q);
        return matchesTitle || matchesContent || matchesSubtitle || matchesDate;
      }
      return true;
    });
  }

  // --- FULL JSON EXPORT & IMPORT ---
  async exportFullDatabaseJSON(): Promise<string> {
    const [
      settings,
      dayRecords,
      journals,
      fitness,
      career,
      finance,
      savings,
      habits,
      learning,
      goals,
      mood,
    ] = await Promise.all([
      this.getSettings(),
      (await this.getStore('day_records')).getAllPromise<DayRecord>(),
      this.getAllJournalEntries(),
      this.getAllFitnessRecords(),
      this.getAllCareerRecords(),
      this.getAllFinanceTransactions(),
      this.getAllSavingsInvestments(),
      this.getAllHabits(),
      this.getAllLearningEntries(),
      this.getAllGoals(),
      this.getAllMoodRecords(),
    ]);

    const backup = {
      app: 'MY LIFE OS',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        settings,
        dayRecords,
        journals,
        fitness,
        career,
        finance,
        savings,
        habits,
        learning,
        goals,
        mood,
      },
    };

    return JSON.stringify(backup, null, 2);
  }

  async importFullDatabaseJSON(jsonStr: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonStr);
      const data = parsed.data || parsed;

      if (data.settings) await this.saveSettings(data.settings);

      if (Array.isArray(data.dayRecords)) {
        for (const item of data.dayRecords) await this.saveDayRecord(item);
      }
      if (Array.isArray(data.journals)) {
        for (const item of data.journals) await this.saveJournalEntry(item);
      }
      if (Array.isArray(data.fitness)) {
        for (const item of data.fitness) await this.saveFitnessRecord(item);
      }
      if (Array.isArray(data.career)) {
        for (const item of data.career) await this.saveCareerRecord(item);
      }
      if (Array.isArray(data.finance)) {
        for (const item of data.finance) await this.saveFinanceTransaction(item);
      }
      if (Array.isArray(data.savings)) {
        for (const item of data.savings) await this.saveSavingsInvestment(item);
      }
      if (Array.isArray(data.habits)) {
        for (const item of data.habits) await this.saveHabit(item);
      }
      if (Array.isArray(data.learning)) {
        for (const item of data.learning) await this.saveLearningEntry(item);
      }
      if (Array.isArray(data.goals)) {
        for (const item of data.goals) await this.saveGoal(item);
      }
      if (Array.isArray(data.mood)) {
        for (const item of data.mood) await this.saveMoodRecord(item);
      }

      return true;
    } catch (err) {
      console.error('Failed to import backup JSON', err);
      return false;
    }
  }

  // --- CSV EXPORTS ---
  async exportFitnessCSV(): Promise<string> {
    const records = await this.getAllFitnessRecords();
    const headers = ['Date', 'Weight_kg', 'Steps', 'Calories_Burned', 'Water_ml', 'Cardio_Summary', 'Gym_Summary', 'Meals_Summary', 'Notes'];
    const rows = records.map((r) => {
      const cardioStr = r.cardio.map((c) => `${c.type}(${c.distanceKm}km,${c.durationMin}m)`).join('; ');
      const gymStr = r.exercises.map((e) => `${e.name}(${e.sets.length}sets)`).join('; ');
      const mealStr = r.meals.map((m) => `${m.food}(${m.calories}kcal,${m.proteinG}gP)`).join('; ');

      return [
        r.date,
        r.weightKg || '',
        r.steps,
        r.caloriesBurnedTotal,
        r.waterMl,
        `"${cardioStr.replace(/"/g, '""')}"`,
        `"${gymStr.replace(/"/g, '""')}"`,
        `"${mealStr.replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  async exportFinanceCSV(): Promise<string> {
    const transactions = await this.getAllFinanceTransactions();
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Payment_Method', 'Notes'];
    const rows = transactions.map((t) => {
      return [
        t.date,
        t.type,
        `"${t.category.replace(/"/g, '""')}"`,
        t.amount,
        t.currency,
        `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  // Clear all data helper
  async clearAllData(): Promise<void> {
    const db = await this.openDB();
    const storeNames = Array.from(db.objectStoreNames);
    const tx = db.transaction(storeNames, 'readwrite');
    storeNames.forEach((name) => {
      tx.objectStore(name).clear();
    });
    return new Promise((resolve) => {
      tx.oncomplete = () => {
        // Re-seed habits
        INITIAL_HABITS.forEach((h) => this.saveHabit(h));
        resolve();
      };
    });
  }
}

// Augment IDBObjectStore for convenience
declare global {
  interface IDBObjectStore {
    getAllPromise<T = any>(): Promise<T[]>;
  }
}

IDBObjectStore.prototype.getAllPromise = function <T = any>(): Promise<T[]> {
  return new Promise((resolve) => {
    const req = this.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
};

export const dbService = new LifeOSDatabase();
