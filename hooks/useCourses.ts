import { useState, useEffect, useCallback } from 'react';
import { Course } from '@/types';
import { getCourses, createCourse, deleteCourse } from '@/services/supabase';

interface CreateCourseInput {
  title: string;
  subject: string;
  level: 'collège' | 'lycée' | 'licence' | 'master';
  color: string;
  icon: string;
}

interface CoursesState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateCourseInput) => Promise<Course>;
  remove: (id: string) => Promise<void>;
}

export function useCourses(userId: string | undefined): CoursesState {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCourses(userId);
      setCourses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const create = useCallback(async (input: CreateCourseInput): Promise<Course> => {
    if (!userId) throw new Error('Non authentifié');
    const course = await createCourse({ ...input, user_id: userId });
    setCourses((prev) => [course, ...prev]);
    return course;
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    await deleteCourse(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { courses, loading, error, refresh, create, remove };
}
