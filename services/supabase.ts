import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '@/types/database';

// Set these in your .env file and load via expo-constants or a config plugin
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * SecureStore adapter for Supabase auth session persistence on native.
 * Falls back to in-memory on web.
 */
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

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  level: 'collège' | 'lycée' | 'licence' | 'master',
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Transmis à auth.users.raw_user_meta_data → lu par le trigger handle_new_user
      data: { full_name: firstName, level },
    },
  });
  if (error) throw error;

  // Si l'inscription ne nécessite pas de confirmation email, le profil est déjà
  // créé par le trigger. On met à jour le niveau qui n'est pas dans le trigger.
  if (data.user) {
    await supabase
      .from('profiles')
      .update({ full_name: firstName })
      .eq('id', data.user.id);
  }

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

// ─── Flashcard helpers ────────────────────────────────────────────────────────

export async function getFlashcards(userId: string) {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createFlashcard(flashcard: {
  user_id: string;
  title: string;
  subject: string;
  content: string;
  source_text?: string;
}) {
  const { data, error } = await supabase.from('flashcards').insert(flashcard).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFlashcard(id: string) {
  const { error } = await supabase.from('flashcards').delete().eq('id', id);
  if (error) throw error;
}

// ─── Quiz helpers ─────────────────────────────────────────────────────────────

export async function getQuizSessions(userId: string) {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*, quiz_answers(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createQuizSession(session: {
  user_id: string;
  flashcard_id: string;
  score?: number;
}) {
  const { data, error } = await supabase.from('quiz_sessions').insert(session).select().single();
  if (error) throw error;
  return data;
}
