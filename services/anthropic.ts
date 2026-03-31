// services/anthropic.ts
//
// Client-side wrappers pour les Supabase Edge Functions IA.
// La clé Anthropic n'est jamais exposée côté client :
//   App (JWT) → Edge Function → Anthropic API

const EDGE_FUNCTION_BASE = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`
  : '';

// ─── Types (miroir des interfaces des Edge Functions) ─────────────────────────

export interface GeneratedFlashcard {
  question:   string;
  answer:     string;
  difficulty: number; // 1–5
}

export interface GenerateFlashcardsResponse {
  flashcards: GeneratedFlashcard[];
  count:      number;
}

export interface QuizQuestion {
  question:      string;
  choices:       [string, string, string, string];
  correct_index: number; // 0–3
  explanation:   string;
}

export interface GenerateQuizResponse {
  questions:       QuizQuestion[];
  count:           number;
  course_id:       string;
  flashcard_count: number;
}

// ─── Helper interne ───────────────────────────────────────────────────────────

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`${EDGE_FUNCTION_BASE}/${functionName}`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error ?? response.statusText;
    throw new EdgeFunctionError(message, response.status);
  }

  return data as T;
}

export class EdgeFunctionError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'EdgeFunctionError';
  }
}

// ─── generate-flashcards ──────────────────────────────────────────────────────

/**
 * Génère des fiches de révision à partir d'un texte source.
 *
 * @param text         - Texte de cours brut
 * @param courseId     - UUID du cours cible
 * @param count        - Nombre de fiches souhaitées (plafonné par le tier côté serveur)
 * @param accessToken  - JWT Supabase de l'utilisateur connecté
 *
 * @example
 * const { flashcards } = await generateFlashcards(courseText, course.id, 10, session.access_token);
 * // Insérer ensuite dans Supabase :
 * await supabase.from('flashcards').insert(
 *   flashcards.map(f => ({ ...f, user_id, course_id, source_text: text }))
 * );
 */
export async function generateFlashcards(
  text:        string,
  courseId:    string,
  count:       number,
  accessToken: string,
): Promise<GenerateFlashcardsResponse> {
  return callEdgeFunction<GenerateFlashcardsResponse>(
    'generate-flashcards',
    { text, course_id: courseId, count },
    accessToken,
  );
}

// ─── generate-quiz ────────────────────────────────────────────────────────────

/**
 * Génère un QCM à partir d'un ensemble de fiches existantes.
 *
 * @param courseId      - UUID du cours
 * @param flashcardIds  - UUIDs des fiches à utiliser comme source
 * @param questionCount - Nombre de questions souhaitées (max 20)
 * @param accessToken   - JWT Supabase de l'utilisateur connecté
 *
 * @example
 * const { questions } = await generateQuiz(course.id, selectedIds, 10, session.access_token);
 */
export async function generateQuiz(
  courseId:      string,
  flashcardIds:  string[],
  questionCount: number,
  accessToken:   string,
): Promise<GenerateQuizResponse> {
  return callEdgeFunction<GenerateQuizResponse>(
    'generate-quiz',
    { course_id: courseId, flashcard_ids: flashcardIds, question_count: questionCount },
    accessToken,
  );
}
