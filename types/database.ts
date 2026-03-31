/**
 * Types Supabase — générés manuellement depuis supabase/migrations/001_init.sql.
 * Régénérer après modification du schéma :
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Tier  = 'free' | 'pro';
export type Level = 'collège' | 'lycée' | 'licence' | 'master';

export interface Database {
  public: {
    Tables: {

      // ── profiles ────────────────────────────────────────────────────────────
      profiles: {
        Row: {
          id:         string;
          email:      string;
          full_name:  string;
          avatar_url: string | null;
          tier:       Tier;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id:          string;
          email:       string;
          full_name?:  string;
          avatar_url?: string | null;
          tier?:       Tier;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?:  string;
          avatar_url?: string | null;
          tier?:       Tier;
          updated_at?: string;
        };
      };

      // ── courses ─────────────────────────────────────────────────────────────
      courses: {
        Row: {
          id:         string;
          user_id:    string;
          title:      string;
          subject:    string;
          level:      Level;
          color:      string;
          icon:       string;
          created_at: string;
        };
        Insert: {
          id?:        string;
          user_id:    string;
          title:      string;
          subject:    string;
          level:      Level;
          color?:     string;
          icon?:      string;
          created_at?: string;
        };
        Update: {
          title?:   string;
          subject?: string;
          level?:   Level;
          color?:   string;
          icon?:    string;
        };
      };

      // ── flashcards ──────────────────────────────────────────────────────────
      flashcards: {
        Row: {
          id:            string;
          user_id:       string;
          course_id:     string;
          question:      string;
          answer:        string;
          source_text:   string | null;
          difficulty:    number;          // 1–5
          review_count:  number;
          last_reviewed: string | null;
          next_review:   string | null;
          created_at:    string;
          updated_at:    string;
        };
        Insert: {
          id?:            string;
          user_id:        string;
          course_id:      string;
          question:       string;
          answer:         string;
          source_text?:   string | null;
          difficulty?:    number;
          review_count?:  number;
          last_reviewed?: string | null;
          next_review?:   string | null;
          created_at?:    string;
          updated_at?:    string;
        };
        Update: {
          question?:      string;
          answer?:        string;
          source_text?:   string | null;
          difficulty?:    number;
          review_count?:  number;
          last_reviewed?: string | null;
          next_review?:   string | null;
          updated_at?:    string;
        };
      };

      // ── quiz_sessions ────────────────────────────────────────────────────────
      quiz_sessions: {
        Row: {
          id:               string;
          user_id:          string;
          course_id:        string;
          score:            number;
          total_questions:  number;
          duration_seconds: number;
          completed_at:     string;
        };
        Insert: {
          id?:               string;
          user_id:           string;
          course_id:         string;
          score?:            number;
          total_questions?:  number;
          duration_seconds?: number;
          completed_at?:     string;
        };
        Update: {
          score?:            number;
          total_questions?:  number;
          duration_seconds?: number;
          completed_at?:     string;
        };
      };

      // ── quiz_results ─────────────────────────────────────────────────────────
      quiz_results: {
        Row: {
          id:                 string;
          session_id:         string;
          flashcard_id:       string;
          user_answer:        string;
          is_correct:         boolean;
          time_spent_seconds: number;
          created_at:         string;
        };
        Insert: {
          id?:                 string;
          session_id:          string;
          flashcard_id:        string;
          user_answer:         string;
          is_correct:          boolean;
          time_spent_seconds?: number;
          created_at?:         string;
        };
        Update: Record<string, never>;  // immuable après insertion
      };

    };

    Views: Record<string, never>;

    Functions: {
      get_course_stats: {
        Args: { p_course_id: string };
        Returns: {
          course_id:           string;
          total_flashcards:    number;
          due_flashcards:      number;
          mastered_flashcards: number;
          avg_difficulty:      number;
          total_quiz_sessions: number;
          avg_score_pct:       number;
          last_studied_at:     string | null;
        };
      };
      get_due_flashcards: {
        Args: { p_user_id: string; p_limit?: number };
        Returns: Database['public']['Tables']['flashcards']['Row'][];
      };
    };

    Enums: {
      tier:  { free: 'free'; pro: 'pro' };
      level: { collège: 'collège'; lycée: 'lycée'; licence: 'licence'; master: 'master' };
    };
  };
}
