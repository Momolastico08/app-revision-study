import { useState, useEffect, useCallback } from 'react';
import { Flashcard, GeneratedFlashcard } from '@/types';
import { getFlashcardsByCourse, saveFlashcards, deleteFlashcard } from '@/services/supabase';

interface FlashcardsState {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (cards: GeneratedFlashcard[], sourceText: string) => Promise<Flashcard[]>;
  remove: (id: string) => Promise<void>;
}

export function useFlashcards(
  courseId: string | undefined,
  userId: string | undefined,
): FlashcardsState {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFlashcardsByCourse(courseId);
      setFlashcards(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const save = useCallback(async (
    cards: GeneratedFlashcard[],
    sourceText: string,
  ): Promise<Flashcard[]> => {
    if (!courseId || !userId) throw new Error('courseId et userId requis');
    const saved = await saveFlashcards(cards, courseId, userId, sourceText);
    setFlashcards((prev) => [...saved, ...prev]);
    return saved;
  }, [courseId, userId]);

  const remove = useCallback(async (id: string) => {
    await deleteFlashcard(id);
    setFlashcards((prev) => prev.filter((f) => f.id !== id));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { flashcards, loading, error, refresh, save, remove };
}
