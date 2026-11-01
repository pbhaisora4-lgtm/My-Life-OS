import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  ModuleTab,
  BottomNavTab,
} from '../types';
import { dbService, DEFAULT_SETTINGS } from '../services/db';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  pushCloudVaultSnapshot,
  pullCloudVaultSnapshot,
  User,
} from '../services/firebase';

interface DynamicIslandNotice {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
}

interface LifeOSContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todayStr: string;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  // Firebase Auth & Cloud Sync
  currentUser: User | null;
  isAuthReady: boolean;
  isSyncingCloud: boolean;
  lastCloudSyncAt: string | null;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  syncToCloudNow: () => Promise<void>;
  pullFromCloudNow: () => Promise<void>;

  // Navigation & View
  activeModule: ModuleTab;
  setActiveModule: (mod: ModuleTab) => void;
  activeBottomTab: BottomNavTab;
  setActiveBottomTab: (tab: BottomNavTab) => void;
  showQuickEntryModal: boolean;
  setShowQuickEntryModal: (show: boolean) => void;

  // Data for selectedDate & lists
  dayRecord: DayRecord | null;
  saveDayRecord: (record: DayRecord) => Promise<void>;

  journalEntries: JournalEntry[];
  saveJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  fitnessRecord: FitnessRecord | null;
  allFitnessRecords: FitnessRecord[];
  saveFitnessRecord: (record: FitnessRecord) => Promise<void>;

  careerRecord: CareerRecord | null;
  allCareerRecords: CareerRecord[];
  saveCareerRecord: (record: CareerRecord) => Promise<void>;

  financeTransactions: FinanceTransaction[];
  savingsInvestments: SavingsInvestmentGoal[];
  saveFinanceTransaction: (tx: FinanceTransaction) => Promise<void>;
  deleteFinanceTransaction: (id: string) => Promise<void>;
  saveSavingsInvestment: (item: SavingsInvestmentGoal) => Promise<void>;
  deleteSavingsInvestment: (id: string) => Promise<void>;

  habits: HabitItem[];
  toggleHabit: (habitId: string, date?: string) => Promise<void>;
  saveHabit: (habit: HabitItem) => Promise<void>;

  learningEntries: LearningEntry[];
  saveLearningEntry: (entry: LearningEntry) => Promise<void>;
  deleteLearningEntry: (id: string) => Promise<void>;

  goals: GoalItem[];
  saveGoal: (goal: GoalItem) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  moodRecord: MoodRecord | null;
  allMoodRecords: MoodRecord[];
  saveMoodRecord: (record: MoodRecord) => Promise<void>;

  timelineItems: TimelineItem[];
  refreshTimeline: (query?: string, moduleFilter?: string) => Promise<void>;

  // Feedback
  islandNotice: DynamicIslandNotice | null;
  showIslandNotice: (title: string, subtitle?: string, icon?: string) => void;

  // Refresh & Demo
  refreshAll: () => Promise<void>;
  loadSampleData: () => Promise<void>;
  clearData: () => Promise<void>;
}

const LifeOSContext = createContext<LifeOSContextType | null>(null);

export const LifeOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(null);

  const [activeModule, setActiveModule] = useState<ModuleTab>('dashboard');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomNavTab>('dashboard');
  const [showQuickEntryModal, setShowQuickEntryModal] = useState(false);

  // Data states
  const [dayRecord, setDayRecord] = useState<DayRecord | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [fitnessRecord, setFitnessRecord] = useState<FitnessRecord | null>(null);
  const [allFitnessRecords, setAllFitnessRecords] = useState<FitnessRecord[]>([]);
  const [careerRecord, setCareerRecord] = useState<CareerRecord | null>(null);
  const [allCareerRecords, setAllCareerRecords] = useState<CareerRecord[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [savingsInvestments, setSavingsInvestments] = useState<SavingsInvestmentGoal[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [learningEntries, setLearningEntries] = useState<LearningEntry[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [moodRecord, setMoodRecord] = useState<MoodRecord | null>(null);
  const [allMoodRecords, setAllMoodRecords] = useState<MoodRecord[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);

  const [islandNotice, setIslandNotice] = useState<DynamicIslandNotice | null>(null);

  const showIslandNotice = useCallback((title: string, subtitle?: string, icon?: string) => {
    const id = Date.now().toString();
    setIslandNotice({ id, title, subtitle, icon });
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      setIslandNotice((current) => (current?.id === id ? null : current));
    }, 3500);
  }, []);

  const refreshDateSpecific = useCallback(async (date: string) => {
    const [day, fit, car, mood] = await Promise.all([
      dbService.getDayRecord(date),
      dbService.getFitnessRecord(date),
      dbService.getCareerRecord(date),
      dbService.getMoodRecord(date),
    ]);
    setDayRecord(day);
    setFitnessRecord(fit);
    setCareerRecord(car);
    setMoodRecord(mood);
  }, []);

  const refreshAll = useCallback(async () => {
    const [
      st,
      journals,
      fitAll,
      carAll,
      finances,
      savings,
      hbs,
      learns,
      gls,
      moodAll,
      tl,
    ] = await Promise.all([
      dbService.getSettings(),
      dbService.getAllJournalEntries(),
      dbService.getAllFitnessRecords(),
      dbService.getAllCareerRecords(),
      dbService.getAllFinanceTransactions(),
      dbService.getAllSavingsInvestments(),
      dbService.getAllHabits(),
      dbService.getAllLearningEntries(),
      dbService.getAllGoals(),
      dbService.getAllMoodRecords(),
      dbService.getLifeTimeline(),
    ]);

    setSettings(st);
    setJournalEntries(journals);
    setAllFitnessRecords(fitAll);
    setAllCareerRecords(carAll);
    setFinanceTransactions(finances);
    setSavingsInvestments(savings);
    setHabits(hbs);
    setLearningEntries(learns);
    setGoals(gls);
    setAllMoodRecords(moodAll);
    setTimelineItems(tl);

    await refreshDateSpecific(selectedDate);
  }, [refreshDateSpecific, selectedDate]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    refreshDateSpecific(selectedDate);
  }, [selectedDate, refreshDateSpecific]);

  // Helper to push current IndexedDB snapshot to Firestore if authenticated
  const autoPushCloudIfSignedIn = useCallback(async (userOverride?: User | null) => {
    const activeUser = userOverride !== undefined ? userOverride : auth.currentUser;
    if (!activeUser) return;
    try {
      setIsSyncingCloud(true);
      const jsonStr = await dbService.exportFullDatabaseJSON();
      const tl = await dbService.getLifeTimeline();
      const updatedAt = await pushCloudVaultSnapshot(activeUser.uid, jsonStr, tl.length);
      setLastCloudSyncAt(updatedAt);
    } catch (e) {
      console.error('Cloud auto-sync error:', e);
    } finally {
      setIsSyncingCloud(false);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
      if (user) {
        try {
          setIsSyncingCloud(true);
          const remoteSnap = await pullCloudVaultSnapshot(user.uid);
          const localTl = await dbService.getLifeTimeline();
          if (remoteSnap && remoteSnap.payloadJson && localTl.length === 0 && remoteSnap.recordCount > 0) {
            await dbService.importFullDatabaseJSON(remoteSnap.payloadJson);
            await refreshAll();
            setLastCloudSyncAt(remoteSnap.updatedAt);
            showIslandNotice('Cloud Vault Restored', `${remoteSnap.recordCount} records synced from Firebase`);
          } else {
            await autoPushCloudIfSignedIn(user);
          }
        } catch (err) {
          console.error('Initial cloud check failed:', err);
        } finally {
          setIsSyncingCloud(false);
        }
      }
    });
    return () => unsubscribe();
  }, [autoPushCloudIfSignedIn, refreshAll, showIslandNotice]);

  const loginWithGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      setCurrentUser(user);
      if (user.displayName && settings.userName === 'Alex') {
        const firstName = user.displayName.split(' ')[0];
        await dbService.saveSettings({ userName: firstName });
        setSettings((prev) => ({ ...prev, userName: firstName }));
      }
      showIslandNotice('Signed In with Google', user.email || 'Cloud Vault connected');
      await autoPushCloudIfSignedIn(user);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      showIslandNotice('Sign-In Cancelled', 'Could not complete Google authentication');
    }
  };

  const logoutUser = async () => {
    await signOutUser();
    setCurrentUser(null);
    showIslandNotice('Signed Out', 'Local IndexedDB remains intact');
  };

  const syncToCloudNow = async () => {
    if (!currentUser) {
      showIslandNotice('Sign In Required', 'Connect Google account first to sync to Firestore');
      return;
    }
    try {
      setIsSyncingCloud(true);
      const jsonStr = await dbService.exportFullDatabaseJSON();
      const tl = await dbService.getLifeTimeline();
      const updatedAt = await pushCloudVaultSnapshot(currentUser.uid, jsonStr, tl.length);
      setLastCloudSyncAt(updatedAt);
      showIslandNotice('Synced to Firestore', `${tl.length} life records backed up to Cloud`);
    } catch (err) {
      console.error('Manual cloud push failed:', err);
      showIslandNotice('Cloud Sync Error', 'Failed to push vault snapshot');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const pullFromCloudNow = async () => {
    if (!currentUser) {
      showIslandNotice('Sign In Required', 'Connect Google account first');
      return;
    }
    try {
      setIsSyncingCloud(true);
      const snap = await pullCloudVaultSnapshot(currentUser.uid);
      if (snap && snap.payloadJson) {
        await dbService.importFullDatabaseJSON(snap.payloadJson);
        await refreshAll();
        setLastCloudSyncAt(snap.updatedAt);
        showIslandNotice('Pulled from Firestore', `Restored ${snap.recordCount} cloud records`);
      } else {
        showIslandNotice('No Cloud Backup Found', 'Push your current records first');
      }
    } catch (err) {
      console.error('Manual cloud pull failed:', err);
      showIslandNotice('Cloud Pull Error', 'Failed to fetch Firestore vault');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await dbService.saveSettings(newSettings);
    setSettings(updated);
    showIslandNotice('Settings Saved', 'Preferences updated in Life OS');
    autoPushCloudIfSignedIn();
  };

  const saveDayRecord = async (record: DayRecord) => {
    await dbService.saveDayRecord(record);
    setDayRecord(record);
    showIslandNotice('Day Schedule Updated', `${record.events.length} activities logged`);
    autoPushCloudIfSignedIn();
  };

  const saveJournalEntry = async (entry: JournalEntry) => {
    await dbService.saveJournalEntry(entry);
    const updated = await dbService.getAllJournalEntries();
    setJournalEntries(updated);
    refreshTimeline();
    showIslandNotice('Journal Saved', entry.title || 'Entry recorded');
    autoPushCloudIfSignedIn();
  };

  const deleteJournalEntry = async (id: string) => {
    await dbService.deleteJournalEntry(id);
    const updated = await dbService.getAllJournalEntries();
    setJournalEntries(updated);
    refreshTimeline();
    showIslandNotice('Entry Deleted', 'Journal updated');
    autoPushCloudIfSignedIn();
  };

  const saveFitnessRecord = async (record: FitnessRecord) => {
    await dbService.saveFitnessRecord(record);
    setFitnessRecord(record);
    const all = await dbService.getAllFitnessRecords();
    setAllFitnessRecords(all);
    refreshTimeline();
    showIslandNotice('Fitness Logged', `${record.steps.toLocaleString()} steps · ${record.waterMl}ml`);
    autoPushCloudIfSignedIn();
  };

  const saveCareerRecord = async (record: CareerRecord) => {
    await dbService.saveCareerRecord(record);
    setCareerRecord(record);
    const all = await dbService.getAllCareerRecords();
    setAllCareerRecords(all);
    refreshTimeline();
    showIslandNotice('Career Record Saved', `${record.tasks.length} tasks tracked`);
    autoPushCloudIfSignedIn();
  };

  const saveFinanceTransaction = async (tx: FinanceTransaction) => {
    await dbService.saveFinanceTransaction(tx);
    const updated = await dbService.getAllFinanceTransactions();
    setFinanceTransactions(updated);
    refreshTimeline();
    showIslandNotice(
      tx.type === 'income' ? 'Income Added' : 'Expense Logged',
      `${tx.currency} ${tx.amount.toFixed(2)} · ${tx.category}`
    );
    autoPushCloudIfSignedIn();
  };

  const deleteFinanceTransaction = async (id: string) => {
    await dbService.deleteFinanceTransaction(id);
    const updated = await dbService.getAllFinanceTransactions();
    setFinanceTransactions(updated);
    refreshTimeline();
    showIslandNotice('Transaction Deleted');
    autoPushCloudIfSignedIn();
  };

  const saveSavingsInvestment = async (item: SavingsInvestmentGoal) => {
    await dbService.saveSavingsInvestment(item);
    const updated = await dbService.getAllSavingsInvestments();
    setSavingsInvestments(updated);
    showIslandNotice('Savings Goal Saved', item.title);
    autoPushCloudIfSignedIn();
  };

  const deleteSavingsInvestment = async (id: string) => {
    await dbService.deleteSavingsInvestment(id);
    const updated = await dbService.getAllSavingsInvestments();
    setSavingsInvestments(updated);
    showIslandNotice('Goal Removed');
    autoPushCloudIfSignedIn();
  };

  const toggleHabit = async (habitId: string, date?: string) => {
    const targetDate = date || selectedDate;
    const updated = await dbService.toggleHabitDate(habitId, targetDate);
    if (updated) {
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
      const isDone = updated.completedDates.includes(targetDate);
      showIslandNotice(
        isDone ? 'Habit Completed!' : 'Habit Unchecked',
        `${updated.title} · ${updated.streak} day streak`
      );
      autoPushCloudIfSignedIn();
    }
  };

  const saveHabit = async (habit: HabitItem) => {
    await dbService.saveHabit(habit);
    const updated = await dbService.getAllHabits();
    setHabits(updated);
    showIslandNotice('Habit Saved', habit.title);
    autoPushCloudIfSignedIn();
  };

  const saveLearningEntry = async (entry: LearningEntry) => {
    await dbService.saveLearningEntry(entry);
    const updated = await dbService.getAllLearningEntries();
    setLearningEntries(updated);
    refreshTimeline();
    showIslandNotice('Learning Logged', `${entry.category.toUpperCase()}: ${entry.topic}`);
    autoPushCloudIfSignedIn();
  };

  const deleteLearningEntry = async (id: string) => {
    await dbService.deleteLearningEntry(id);
    const updated = await dbService.getAllLearningEntries();
    setLearningEntries(updated);
    refreshTimeline();
    showIslandNotice('Learning Removed');
    autoPushCloudIfSignedIn();
  };

  const saveGoal = async (goal: GoalItem) => {
    await dbService.saveGoal(goal);
    const updated = await dbService.getAllGoals();
    setGoals(updated);
    showIslandNotice('Goal Updated', `${goal.title} (${goal.progress}%)`);
    autoPushCloudIfSignedIn();
  };

  const deleteGoal = async (id: string) => {
    await dbService.deleteGoal(id);
    const updated = await dbService.getAllGoals();
    setGoals(updated);
    showIslandNotice('Goal Deleted');
    autoPushCloudIfSignedIn();
  };

  const saveMoodRecord = async (record: MoodRecord) => {
    await dbService.saveMoodRecord(record);
    setMoodRecord(record);
    const all = await dbService.getAllMoodRecords();
    setAllMoodRecords(all);
    refreshTimeline();
    showIslandNotice('Reflection Saved', `Daily Mood Score: ${record.moodScore}/5`);
    autoPushCloudIfSignedIn();
  };

  const refreshTimeline = async (query: string = '', filter?: string) => {
    const tl = await dbService.getLifeTimeline(query, filter);
    setTimelineItems(tl);
  };

  const loadSampleData = async () => {
    const today = new Date().toISOString().split('T')[0];

    await dbService.saveDayRecord({
      date: today,
      wakeUpTime: '06:15',
      sleepTime: '22:45',
      energyRating: 5,
      events: [
        { id: '1', time: '06:30', title: 'Morning hydration & meditation', category: 'routine', completed: true },
        { id: '2', time: '07:15', title: 'Gym Workout - Push Focus', category: 'fitness', completed: true },
        { id: '3', time: '09:00', title: 'Executive Standup & Team Sync', category: 'office', completed: true },
        { id: '4', time: '13:00', title: 'Deep Work: System Architecture Refactor', category: 'office', completed: true },
        { id: '5', time: '18:30', title: 'English practice & reading 20 pages', category: 'learning', completed: true },
      ],
      notes: 'Exceptional flow state today. Completed all high-priority engineering objectives.',
    });

    await dbService.saveJournalEntry({
      id: 'journal_sample_1',
      date: today,
      timestamp: new Date().toISOString(),
      title: 'Clarity, Discipline and High Momentum',
      story: 'Started the morning with a crisp 5km run and heavy bench press. Focused intensely for 4 hours at the office on the distributed state engine. Had a productive one-on-one with the product lead. Truly grateful for good health and steady progress.',
      photos: [],
      moodTag: 'Energized',
      tags: ['Health', 'Focus', 'Engineering'],
    });

    await dbService.saveFitnessRecord({
      id: `fit_${today}`,
      date: today,
      weightKg: 73.8,
      steps: 11420,
      caloriesBurnedTotal: 580,
      waterMl: 3200,
      exercises: [
        {
          id: 'ex1',
          name: 'Barbell Bench Press',
          category: 'chest',
          sets: [
            { setNumber: 1, reps: 10, weightKg: 70 },
            { setNumber: 2, reps: 8, weightKg: 80 },
            { setNumber: 3, reps: 6, weightKg: 85 },
          ],
        },
        {
          id: 'ex2',
          name: 'Incline Dumbbell Press',
          category: 'chest',
          sets: [
            { setNumber: 1, reps: 12, weightKg: 28 },
            { setNumber: 2, reps: 10, weightKg: 30 },
          ],
        },
      ],
      cardio: [{ id: 'c1', type: 'Outdoor Jog', distanceKm: 5.2, durationMin: 28, caloriesBurned: 340 }],
      meals: [
        { id: 'm1', timeOfDay: 'breakfast', food: 'Oatmeal with whey & berries', calories: 480, proteinG: 38 },
        { id: 'm2', timeOfDay: 'lunch', food: 'Grilled chicken breast with quinoa', calories: 620, proteinG: 48 },
        { id: 'm3', timeOfDay: 'dinner', food: 'Wild salmon with roasted vegetables', calories: 550, proteinG: 42 },
      ],
      notes: 'Form was solid on all compound sets.',
    });

    await dbService.saveCareerRecord({
      id: `car_${today}`,
      date: today,
      tasks: [
        { id: 't1', title: 'Review PR for distributed cache invalidation', status: 'done', priority: 'high', category: 'project', date: today },
        { id: 't2', title: 'Prepare Q4 technical roadmap slide deck', status: 'done', priority: 'high', category: 'office', date: today },
        { id: 't3', title: 'Conduct architecture interview with candidate', status: 'in_progress', priority: 'medium', category: 'review', date: today },
      ],
      achievements: ['Shipped zero-downtime database migration successfully to production'],
      meetings: [{ id: 'm1', time: '10:00', title: 'Sprint Review', keyTakeaways: 'All 8 user stories accepted on schedule.' }],
      skillsLearned: ['Mastered Go worker pool patterns for high-throughput stream processing'],
      mistakesReflection: ['Should have cached the session lookup query earlier to cut p99 latency'],
      leadershipActivities: ['Mentored junior engineer on writing clean idempotent API handlers'],
      performanceSummary: 'Strong technical execution and effective cross-team coordination.',
    });

    await dbService.saveFinanceTransaction({
      id: 'fin_sample_1',
      date: today,
      type: 'expense',
      category: 'Food & Dining',
      amount: 14.50,
      currency: 'USD',
      notes: 'Espresso & avocado sourdough lunch',
      paymentMethod: 'Apple Pay',
    });
    await dbService.saveFinanceTransaction({
      id: 'fin_sample_2',
      date: today,
      type: 'income',
      category: 'Salary',
      amount: 4500.00,
      currency: 'USD',
      notes: 'Bi-weekly tech payroll direct deposit',
      paymentMethod: 'Direct Deposit',
    });

    await dbService.toggleHabitDate('habit_gym', today);
    await dbService.toggleHabitDate('habit_wake_early', today);
    await dbService.toggleHabitDate('habit_reading', today);
    await dbService.toggleHabitDate('habit_water', today);

    await dbService.saveLearningEntry({
      id: 'learn_1',
      date: today,
      category: 'english',
      topic: 'Executive idioms: "Move the needle", "Touch base"',
      notes: 'Practiced speaking concise summaries during morning status call.',
      durationMin: 25,
      completed: true,
    });
    await dbService.saveLearningEntry({
      id: 'learn_2',
      date: today,
      category: 'technology',
      topic: 'IndexedDB transactions and PWA lifecycle',
      notes: 'Analyzed service worker cache-first strategy for zero-latency offline boot.',
      durationMin: 35,
      completed: true,
    });

    await dbService.saveGoal({
      id: 'goal_1',
      title: 'Bench Press 100kg clean for 5 reps',
      timeframe: 'monthly',
      category: 'health',
      targetDate: '2026-12-31',
      progress: 85,
      milestones: [
        { id: 'ms1', title: 'Hit 80kg x 8', done: true },
        { id: 'ms2', title: 'Hit 90kg x 5', done: true },
        { id: 'ms3', title: 'Hit 100kg x 3', done: false },
      ],
      notes: 'Consistency in progressive overload is key.',
    });

    await dbService.saveMoodRecord({
      id: `mood_${today}`,
      date: today,
      moodScore: 5,
      energyLevel: 5,
      stressLevel: 2,
      gratitudeItems: [
        'Energizing morning sunrise during the run',
        'Exceptional collaborative trust with the engineering team',
        'Uninterrupted focus time in the afternoon',
      ],
      reflection: 'Staying proactive and executing with calm focus eliminates anxiety.',
    });

    await refreshAll();
    showIslandNotice('Sample Data Loaded', 'Preview data ready across all 10 modules');
    autoPushCloudIfSignedIn();
  };

  const clearData = async () => {
    await dbService.clearAllData();
    await refreshAll();
    showIslandNotice('Data Cleared', 'All personal records reset to fresh state');
    autoPushCloudIfSignedIn();
  };

  return (
    <LifeOSContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        todayStr,
        settings,
        updateSettings,
        currentUser,
        isAuthReady,
        isSyncingCloud,
        lastCloudSyncAt,
        loginWithGoogle,
        logoutUser,
        syncToCloudNow,
        pullFromCloudNow,
        activeModule,
        setActiveModule,
        activeBottomTab,
        setActiveBottomTab,
        showQuickEntryModal,
        setShowQuickEntryModal,
        dayRecord,
        saveDayRecord,
        journalEntries,
        saveJournalEntry,
        deleteJournalEntry,
        fitnessRecord,
        allFitnessRecords,
        saveFitnessRecord,
        careerRecord,
        allCareerRecords,
        saveCareerRecord,
        financeTransactions,
        savingsInvestments,
        saveFinanceTransaction,
        deleteFinanceTransaction,
        saveSavingsInvestment,
        deleteSavingsInvestment,
        habits,
        toggleHabit,
        saveHabit,
        learningEntries,
        saveLearningEntry,
        deleteLearningEntry,
        goals,
        saveGoal,
        deleteGoal,
        moodRecord,
        allMoodRecords,
        saveMoodRecord,
        timelineItems,
        refreshTimeline,
        islandNotice,
        showIslandNotice,
        refreshAll,
        loadSampleData,
        clearData,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
};

export function useLifeOS() {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error('useLifeOS must be used within a LifeOSProvider');
  }
  return context;
}
