import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { supabase } from '@/services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

/**
 * Gère la session Supabase et les redirections automatiques :
 * - Connecté     → /(tabs)
 * - Non connecté → /(auth)/login
 *
 * À utiliser une seule fois, dans app/_layout.tsx.
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // ── Souscription à l'état d'authentification ────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Redirection automatique ──────────────────────────────────────────────────
  // On attend que le navigator soit monté (navigationState?.key) avant de router.
  useEffect(() => {
    if (loading || !navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, navigationState?.key]);

  return { session, user: session?.user ?? null, loading };
}
