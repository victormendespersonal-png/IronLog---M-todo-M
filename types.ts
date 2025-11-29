
export interface User {
  id: string;
  name: string;
  email?: string;
  password?: string; // Only used for auth verification, not stored in session
  photo?: string;
  currentGoal?: UserGoal;
  level?: UserLevel;
  preferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  enabled: boolean;
  manualTime?: string; // HH:mm override
}

export type UserGoal = 'HYPERTROPHY' | 'STRENGTH' | 'DEFINITION' | 'REHAB';
export type UserLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface SetLog {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
  restTimeSeconds: number; // Time rested *after* this set
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  defaultSets: number;
  defaultReps: string; // e.g., "8-12"
  defaultWeight?: number;
  defaultRestSeconds?: number;
  notes?: string;
}

export interface ExerciseSession {
  exerciseId: string;
  exerciseName: string;
  targetMuscle?: string; // Added for analytics
  sets: SetLog[];
  notes?: string; // Session specific notes
}

export interface WorkoutRoutine {
  id: string;
  userId: string; // Link to user
  name: string; // e.g., "Leg Day A"
  exercises: Exercise[]; // Template exercises
  targetMuscles: string[];
}

export interface WorkoutLog {
  id: string;
  userId: string; // Link to user
  routineName: string;
  routineId?: string;
  startTime: number;
  endTime: number | null;
  exercises: ExerciseSession[];
  notes?: string;
  totalDuration?: number; // In minutes
  totalVolume?: number; // In kg
}

// --- Analytics Types ---

export interface MonthlyStats {
  monthName: string;
  totalVolume: number;
  totalWorkouts: number;
  avgVolumePerWorkout: number;
}

export interface MonthlyComparison {
  current: MonthlyStats;
  previous: MonthlyStats;
  volumeDeltaPercent: number;
  frequencyDeltaPercent: number;
  bestExercises: { name: string; weight: number; muscle: string }[];
}

export interface WorkoutPerformanceReport {
  volumeDelta: number; // Percentage vs last time
  loadDelta: number; // Avg load percentage vs last time
  durationDelta: number;
  volumeDiffValue: number; // Actual kg difference
  message: string;
  highlight: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

// --- Gamification Types ---

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
export type BadgeCategory = 'CONSISTENCY' | 'STRENGTH' | 'VOLUME' | 'DEDICATION';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string; // Icon name reference
  requirementValue: number; // e.g., 10000 (kg), 3 (workouts)
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: number;
  currentProgress: number; // For progress bars
  isUnlocked: boolean;
}

// --- AI Recommendation Types ---

export interface AiRecommendation {
  exerciseId: string;
  suggestedWeight?: number;
  action: 'INCREASE' | 'MAINTAIN' | 'DECREASE' | 'NEW';
  reasoning: string;
  stagnationWarning?: boolean; // If true, suggest changing stimulus
  suggestedRest?: number;
}

export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  SELECT_ROUTINE = 'SELECT_ROUTINE',
  ACTIVE_WORKOUT = 'ACTIVE_WORKOUT',
  CREATE_ROUTINE = 'CREATE_ROUTINE',
  HISTORY = 'HISTORY',
  HISTORY_DETAILS = 'HISTORY_DETAILS',
  AI_ANALYSIS = 'AI_ANALYSIS',
  AI_PLANNER = 'AI_PLANNER',
  PROGRESS = 'PROGRESS',
  SETTINGS = 'SETTINGS',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  WORKOUT_SUMMARY = 'WORKOUT_SUMMARY'
}
