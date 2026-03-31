/**
 * Auto-generated Supabase database types.
 * Run `npx supabase gen types typescript --project-id <id> > types/database.ts` to regenerate.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      flashcards: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subject: string;
          content: string;
          source_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          subject: string;
          content: string;
          source_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subject?: string;
          content?: string;
          source_text?: string | null;
          updated_at?: string;
        };
      };
      quiz_sessions: {
        Row: {
          id: string;
          user_id: string;
          flashcard_id: string;
          score: number;
          total_questions: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          flashcard_id: string;
          score?: number;
          total_questions?: number;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          score?: number;
          total_questions?: number;
          completed_at?: string;
        };
      };
      quiz_answers: {
        Row: {
          id: string;
          session_id: string;
          question_index: number;
          selected_index: number;
          is_correct: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_index: number;
          selected_index: number;
          is_correct: boolean;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
