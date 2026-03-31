import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '@/types/database';
import { Course, Flashcard, GeneratedFlashcard } from '@/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  level: 'collège' | 'lycée' | 'licence' | 'master',
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: firstName, level } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export async function getCourses(userId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function createCourse(course: {
  user_id: string;
  title: string;
  subject: string;
  level: 'collège' | 'lycée' | 'licence' | 'master';
  color: string;
  icon: string;
}): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

export async function getFlashcardsByCourse(courseId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Flashcard[];
}

/** Inserts multiple generated flashcards for a course in a single batch. */
export async function saveFlashcards(
  cards: GeneratedFlashcard[],
  courseId: string,
  userId: string,
  sourceText: string,
): Promise<Flashcard[]> {
  const rows = cards.map((c) => ({
    course_id:   courseId,
    user_id:     userId,
    question:    c.question,
    answer:      c.answer,
    difficulty:  c.difficulty,
    source_text: sourceText,
  }));

  const { data, error } = await supabase
    .from('flashcards')
    .insert(rows)
    .select();
  if (error) throw error;
  return (data ?? []) as Flashcard[];
}

export async function deleteFlashcard(id: string) {
  const { error } = await supabase.from('flashcards').delete().eq('id', id);
  if (error) throw error;
}

// ─── Quiz sessions ────────────────────────────────────────────────────────────

export async function getQuizSessions(userId: string) {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createQuizSession(session: {
  user_id: string;
  course_id: string;
  score: number;
  total_questions: number;
  duration_seconds: number;
}) {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert(session)
    .select()
    .single();
  if (error) throw error;
  return data;
}
