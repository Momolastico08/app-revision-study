// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  avatar_url?: string;
  created_at: string;
  is_pro: boolean;
}

// ─── Flashcard ────────────────────────────────────────────────────────────────

export interface Flashcard {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  content: string;
  source_text?: string;
  created_at: string;
  updated_at: string;
}

/** Structured AI output for a generated flashcard */
export interface FlashcardContent {
  title: string;
  key_concepts: string[];
  summary: string;
  key_points: string[];
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question:      string;
  choices:       [string, string, string, string]; // toujours 4 choix
  correct_index: number;                           // 0–3
  explanation:   string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  flashcard_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  question_index: number;
  selected_index: number;
  is_correct: boolean;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro';

export interface SubscriptionLimits {
  maxFlashcards: number;
  maxQuizzesPerDay: number;
  aiGenerationsPerDay: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxFlashcards: 10,
    maxQuizzesPerDay: 3,
    aiGenerationsPerDay: 3,
  },
  pro: {
    maxFlashcards: Infinity,
    maxQuizzesPerDay: Infinity,
    aiGenerationsPerDay: Infinity,
  },
};
