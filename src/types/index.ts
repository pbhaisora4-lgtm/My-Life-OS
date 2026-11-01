export type ModuleTab =
  | 'dashboard'
  | 'my-day'
  | 'journal'
  | 'fitness'
  | 'career'
  | 'finance'
  | 'habits'
  | 'learning'
  | 'goals'
  | 'mood'
  | 'timeline'
  | 'ai-studio'
  | 'bioscience'
  | 'three-world'
  | 'music-player'
  | 'settings';

export type BottomNavTab = 'dashboard' | 'day-journal' | 'fitness-habits' | 'career-finance' | 'hub';

// 1. MY DAY
export interface DayEvent {
  id: string;
  time: string;
  title: string;
  category: 'routine' | 'office' | 'personal' | 'fitness' | 'learning' | 'rest';
  completed: boolean;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  wakeUpTime?: string;
  sleepTime?: string;
  energyRating?: number; // 1-5
  events: DayEvent[];
  notes?: string;
}

// 2. MY JOURNAL
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  title: string;
  story: string;
  photos: string[]; // Base64 data URLs
  moodTag?: string;
  tags: string[];
  location?: string;
}

// 3. FITNESS
export interface GymSet {
  setNumber: number;
  reps: number;
  weightKg: number;
}

export interface GymExercise {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full';
  sets: GymSet[];
}

export interface CardioLog {
  id: string;
  type: string; // Run, Walk, Cycle, Swim, HIIT
  distanceKm: number;
  durationMin: number;
  caloriesBurned?: number;
}

export interface MealLog {
  id: string;
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food: string;
  calories: number;
  proteinG: number;
}

export interface FitnessRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  steps: number;
  caloriesBurnedTotal: number;
  waterMl: number;
  exercises: GymExercise[];
  cardio: CardioLog[];
  meals: MealLog[];
  notes?: string;
}

// 4. CAREER
export interface CareerTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: 'office' | 'project' | 'admin' | 'review';
  date: string;
  dueDate?: string;
}

export interface CareerMeeting {
  id: string;
  time: string;
  title: string;
  attendees?: string;
  keyTakeaways: string;
}

export interface CareerRecord {
  id: string;
  date: string; // YYYY-MM-DD
  tasks: CareerTask[];
  achievements: string[];
  meetings: CareerMeeting[];
  skillsLearned: string[];
  mistakesReflection: string[];
  leadershipActivities: string[];
  performanceSummary?: string;
}

// 5. FINANCE
export type TransactionType = 'income' | 'expense';

export interface FinanceTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string; // Food, Rent, Tech, Transport, Health, Leisure, Salary, Freelance, Investment, Other
  amount: number;
  currency: string;
  notes: string;
  paymentMethod?: string;
}

export interface SavingsInvestmentGoal {
  id: string;
  title: string;
  type: 'savings' | 'investment';
  currentAmount: number;
  targetAmount: number;
  currency: string;
  deadline?: string;
  notes?: string;
}

// 6. HABITS
export interface HabitItem {
  id: string;
  title: string;
  category: 'health' | 'mindset' | 'growth' | 'routine';
  targetDaysPerWeek: number;
  color: string;
  icon: string;
  streak: number;
  completedDates: string[]; // Array of YYYY-MM-DD
  archived?: boolean;
}

// 7. LEARNING
export interface LearningEntry {
  id: string;
  date: string;
  category: 'english' | 'communication' | 'leadership' | 'technology';
  topic: string;
  notes: string;
  durationMin: number;
  completed: boolean;
  referenceUrl?: string;
}

// 8. GOALS
export type GoalTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  timeframe: GoalTimeframe;
  category: 'career' | 'health' | 'finance' | 'personal' | 'skills';
  targetDate: string;
  progress: number; // 0-100
  milestones: GoalMilestone[];
  notes?: string;
}

// 9. MOOD
export interface MoodRecord {
  id: string;
  date: string; // YYYY-MM-DD
  moodScore: number; // 1-5 (1: Terrible, 2: Low, 3: Neutral, 4: Good, 5: Awesome)
  energyLevel: number; // 1-5
  stressLevel: number; // 1-5
  gratitudeItems: [string, string, string]; // 3 daily gratitudes
  reflection: string;
}

// 10. TIMELINE ITEM
export interface TimelineItem {
  id: string;
  date: string;
  timestamp: string;
  module: ModuleTab;
  title: string;
  subtitle?: string;
  content?: string;
  tags?: string[];
  meta?: Record<string, any>;
}

// APP SETTINGS
export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  userName: string;
  useDeviceFrameOnDesktop: boolean;
  currency: string;
  weightUnit: 'kg' | 'lbs';
  waterTargetMl: number;
  stepTarget: number;
  calorieTarget: number;
  proteinTargetG: number;
}

// QUICK ENTRY PARSED PAYLOAD
export interface ParsedQuickEntry {
  rawText: string;
  date: string;
  wakeUpTime?: string;
  sleepTime?: string;
  journalStory?: string;
  fitness?: {
    weight?: number;
    steps?: number;
    waterMl?: number;
    caloriesBurned?: number;
    cardio?: { type: string; distanceKm?: number; durationMin?: number }[];
    exercises?: { name: string; sets?: number; reps?: number; weightKg?: number }[];
    meals?: { food: string; calories?: number; proteinG?: number }[];
  };
  career?: {
    tasksDone?: string[];
    achievements?: string[];
    meetings?: string[];
    skillsLearned?: string[];
    mistakes?: string[];
    leadership?: string[];
  };
  finance?: {
    expenses?: { category: string; amount: number; notes: string }[];
    income?: { category: string; amount: number; notes: string }[];
  };
  habitsToggled?: string[];
  learning?: {
    category: 'english' | 'communication' | 'leadership' | 'technology';
    topic: string;
    notes: string;
  }[];
  mood?: {
    score?: number;
    energy?: number;
    stress?: number;
    gratitude?: string[];
    reflection?: string;
  };
}
