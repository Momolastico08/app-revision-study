// supabase/functions/generate-quiz/index.ts
// Déployer : npx supabase functions deploy generate-quiz
//
// Variables d'environnement requises :
//   ANTHROPIC_API_KEY   → clé API Anthropic
//   SUPABASE_URL        → injectée automatiquement par Supabase
//   SUPABASE_ANON_KEY   → injectée automatiquement par Supabase

import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MODEL              = "claude-sonnet-4-6";
const MAX_QUESTIONS      = 20;
const MIN_QUESTIONS      = 1;
const MAX_FLASHCARDS_CTX = 30;  // nb max de fiches envoyées en contexte

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestBody {
  course_id:      string;
  flashcard_ids:  string[];
  question_count: number;
}

interface QuizQuestion {
  question:      string;
  choices:       [string, string, string, string]; // toujours 4 choix
  correct_index: number;                           // 0–3
  explanation:   string;
}

interface FlashcardRow {
  id:       string;
  question: string;
  answer:   string;
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {

  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return error(405, "Méthode non autorisée.");
  }

  try {
    // ── 1. Vérification du JWT Supabase ──────────────────────────────────────

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error(401, "Token d'authentification manquant.");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return error(401, "Token invalide ou expiré.");
    }

    // ── 2. Lecture et validation du body ─────────────────────────────────────

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return error(400, "Body JSON invalide.");
    }

    const { course_id, flashcard_ids, question_count } = body;

    if (!course_id?.trim()) {
      return error(400, "Le champ 'course_id' est requis.");
    }
    if (!Array.isArray(flashcard_ids) || flashcard_ids.length === 0) {
      return error(400, "Le champ 'flashcard_ids' doit être un tableau non vide.");
    }
    if (!Number.isInteger(question_count) || question_count < MIN_QUESTIONS) {
      return error(400, `Le champ 'question_count' doit être un entier >= ${MIN_QUESTIONS}.`);
    }

    const safeQuestionCount = Math.min(question_count, MAX_QUESTIONS);

    // ── 3. Vérification ownership du cours ───────────────────────────────────

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, subject")
      .eq("id", course_id)
      .eq("user_id", user.id)
      .single();

    if (courseError || !course) {
      return error(404, "Cours introuvable ou accès refusé.");
    }

    // ── 4. Récupération des fiches (filtrées par ownership) ──────────────────
    //
    //  On filtre par course_id ET user_id (RLS) et on limite le contexte
    //  pour ne pas dépasser la fenêtre de tokens du modèle.

    const idsToFetch = flashcard_ids.slice(0, MAX_FLASHCARDS_CTX);

    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("id, question, answer")
      .eq("course_id", course_id)
      .eq("user_id", user.id)
      .in("id", idsToFetch);

    if (flashcardsError) {
      console.error("[generate-quiz] Flashcards fetch error:", flashcardsError);
      return error(500, "Erreur lors de la récupération des fiches.");
    }

    if (!flashcards || flashcards.length === 0) {
      return error(404, "Aucune fiche accessible avec ces identifiants.");
    }

    // Limiter le nombre de questions au nombre de fiches disponibles
    const effectiveCount = Math.min(safeQuestionCount, flashcards.length);

    // ── 5. Construction du contexte pour l'IA ────────────────────────────────

    const flashcardsContext = (flashcards as FlashcardRow[])
      .map((f, i) => `Fiche ${i + 1}:\nQ: ${f.question}\nR: ${f.answer}`)
      .join("\n\n");

    // ── 6. Appel Anthropic ───────────────────────────────────────────────────

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return error(500, "Clé API Anthropic non configurée.");
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `Tu es un expert pédagogique qui crée des questionnaires à choix multiples (QCM) de haute qualité.
Tes questions doivent :
- Tester la compréhension réelle, pas la mémorisation mécanique
- Avoir des distracteurs (mauvaises réponses) plausibles et instructifs
- Fournir une explication claire qui aide l'étudiant à comprendre son erreur
- Être rédigées en français correct

Réponds TOUJOURS avec un tableau JSON valide et rien d'autre.
Aucun texte avant ou après le JSON. Pas de balises markdown.`;

    const userPrompt = `Cours : "${course.title}" (${course.subject})

Voici les fiches de révision à partir desquelles tu dois créer le quiz :

${flashcardsContext}

Génère exactement ${effectiveCount} question(s) QCM.

FORMAT DE RÉPONSE (tableau JSON strict) :
[
  {
    "question": "Énoncé de la question ?",
    "choices": [
      "Choix A (correct ou incorrect)",
      "Choix B",
      "Choix C",
      "Choix D"
    ],
    "correct_index": 0,
    "explanation": "Explication pédagogique de la bonne réponse."
  }
]

Règles STRICTES :
- "choices" contient TOUJOURS exactement 4 chaînes
- "correct_index" est un entier entre 0 et 3 (index de la bonne réponse dans "choices")
- Varie la position de la bonne réponse (ne mets pas toujours 0)
- Les distracteurs doivent être crédibles, pas absurdes
- "explanation" doit expliquer POURQUOI la bonne réponse est correcte
- Génère exactement ${effectiveCount} objet(s)`;

    let message: Anthropic.Message;
    try {
      message = await anthropic.messages.create({
        model:      MODEL,
        max_tokens: 4096,
        system:     systemPrompt,
        messages:   [{ role: "user", content: userPrompt }],
      });
    } catch (e) {
      console.error("[generate-quiz] Anthropic error:", e);
      return error(502, "Erreur lors de l'appel à l'API Anthropic.");
    }

    // ── 7. Parse et validation de la réponse ─────────────────────────────────

    const rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    let questions: QuizQuestion[];
    try {
      questions = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\[[\s\S]*\]/);
      if (!match) {
        console.error("[generate-quiz] Unparseable response:", rawText.slice(0, 500));
        return error(502, "La réponse de l'IA n'est pas au format JSON attendu.");
      }
      try {
        questions = JSON.parse(match[0]);
      } catch {
        return error(502, "Impossible de parser la réponse de l'IA.");
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return error(502, "L'IA n'a généré aucune question.");
    }

    // Valider et sanitiser chaque question
    const validated: QuizQuestion[] = questions
      .filter((q) =>
        typeof q.question === "string" &&
        Array.isArray(q.choices) &&
        q.choices.length === 4 &&
        q.choices.every((c: unknown) => typeof c === "string") &&
        Number.isInteger(q.correct_index) &&
        q.correct_index >= 0 &&
        q.correct_index <= 3 &&
        typeof q.explanation === "string"
      )
      .map((q) => ({
        question:      q.question.trim(),
        choices:       q.choices.map((c: string) => c.trim()) as [string, string, string, string],
        correct_index: q.correct_index,
        explanation:   q.explanation.trim(),
      }));

    if (validated.length === 0) {
      return error(502, "Aucune question valide générée par l'IA.");
    }

    // ── 8. Réponse ───────────────────────────────────────────────────────────

    console.info(
      `[generate-quiz] user=${user.id} course=${course_id} ` +
      `questions=${validated.length} input_tokens=${message.usage.input_tokens} ` +
      `output_tokens=${message.usage.output_tokens}`,
    );

    return json({
      questions:      validated,
      count:          validated.length,
      course_id,
      flashcard_count: flashcards.length,
    });

  } catch (e) {
    console.error("[generate-quiz] Unexpected error:", e);
    return error(500, "Erreur interne du serveur.");
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function error(status: number, message: string): Response {
  return json({ error: message }, status);
}
