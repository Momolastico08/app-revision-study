import { useState, useEffect, useCallback } from 'react';
import { Flashcard } from '@/types';
import { getFlashcards, deleteFlashcard } from '@/services/supabase';

interface FlashcardsState {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useFlashcards(userId: string | undefined): FlashcardsState {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFlashcards(userId);
      setFlashcards((data as Flashcard[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    await deleteFlashcard(id);
    setFlashcards((prev) => prev.filter((f) => f.id !== id));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { flashcards, loading, error, refresh, remove };
}
