// ─── Shared enums ─────────────────────────────────────────────────────────────

export type Level = 'collège' | 'lycée' | 'licence' | 'master';
export type SubscriptionTier = 'free' | 'pro';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  tier: SubscriptionTier;
  level?: Level;
  created_at: string;
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  level: Level;
  color: string;   // hex, e.g. '#4F46E5'
  icon: string;    // Ionicons name, e.g. 'book-outline'
  created_at: string;
}

// ─── Flashcard ────────────────────────────────────────────────────────────────

/** Matches the DB schema from 001_init.sql */
export interface Flashcard {
  id: string;
  user_id: string;
  course_id: string;
  question: string;
  answer: string;
  source_text: string | null;
  difficulty: number;          // 1–5
  review_count: number;
  last_reviewed: string | null;
  next_review: string | null;
  created_at: string;
  updated_at: string;
}

/** Flashcard as returned by the generate-flashcards Edge Function (pre-save) */
export interface GeneratedFlashcard {
  question: string;
  answer: string;
  difficulty: number; // 1–5
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question:      string;
  choices:       [string, string, string, string];
  correct_index: number; // 0–3
  explanation:   string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  course_id: string;
  score: number;
  total_questions: number;
  duration_seconds: number;
  completed_at: string;
}

export interface QuizResult {
  id: string;
  session_id: string;
  flashcard_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface SubscriptionLimits {
  maxFlashcards: number;
  maxQuizzesPerDay: number;
  aiGenerationsPerDay: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: { maxFlashcards: 10, maxQuizzesPerDay: 3, aiGenerationsPerDay: 3 },
  pro:  { maxFlashcards: Infinity, maxQuizzesPerDay: Infinity, aiGenerationsPerDay: Infinity },
};

// ─── UI constants ─────────────────────────────────────────────────────────────

export const COURSE_COLORS = [
  '#4F46E5', // indigo
  '#EC4899', // pink
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#64748B', // slate
] as const;

export const COURSE_ICONS = [
  'book-outline',
  'flask-outline',
  'calculator-outline',
  'globe-outline',
  'musical-notes-outline',
  'code-slash-outline',
  'leaf-outline',
  'people-outline',
] as const;
