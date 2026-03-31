// supabase/functions/generate-flashcards/index.ts
// Déployer : npx supabase functions deploy generate-flashcards
//
// Variables d'environnement requises (Supabase dashboard > Settings > Edge Functions > Secrets) :
//   ANTHROPIC_API_KEY   → clé API Anthropic
//   SUPABASE_URL        → injectée automatiquement par Supabase
//   SUPABASE_ANON_KEY   → injectée automatiquement par Supabase

import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

// ─── Constantes ───────────────────────────────────────────────────────────────

const FREE_MAX  = 10;
const PRO_MAX   = 50;
const MODEL     = "claude-sonnet-4-6";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestBody {
  text:      string;
  course_id: string;
  count:     number;
}

interface GeneratedFlashcard {
  question:   string;
  answer:     string;
  difficulty: number; // 1–5
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

    const { text, course_id, count } = body;

    if (!text?.trim())      return error(400, "Le champ 'text' est requis.");
    if (!course_id?.trim()) return error(400, "Le champ 'course_id' est requis.");
    if (!Number.isInteger(count) || count < 1) {
      return error(400, "Le champ 'count' doit être un entier >= 1.");
    }

    // ── 3. Vérification ownership du cours ───────────────────────────────────

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", course_id)
      .eq("user_id", user.id)
      .single();

    if (courseError || !course) {
      return error(404, "Cours introuvable ou accès refusé.");
    }

    // ── 4. Lecture du tier utilisateur + calcul de la limite ─────────────────

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return error(500, "Impossible de lire le profil utilisateur.");
    }

    const maxCount  = profile.tier === "pro" ? PRO_MAX : FREE_MAX;
    const safeCount = Math.min(count, maxCount);

    if (count > maxCount) {
      console.warn(
        `[generate-flashcards] user=${user.id} tier=${profile.tier} ` +
        `requested=${count} clamped to ${maxCount}`,
      );
    }

    // ── 5. Appel Anthropic ───────────────────────────────────────────────────

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return error(500, "Clé API Anthropic non configurée.");
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `Tu es un expert pédagogique spécialisé dans la création de fiches de révision pour étudiants.
Tes fiches doivent être :
- Claires et précises : une question = un concept
- Pédagogiques : la réponse explique le "pourquoi", pas seulement le "quoi"
- Adaptées au niveau universitaire et lycéen
- Rédigées en français

Réponds TOUJOURS avec un tableau JSON valide et rien d'autre.
Aucun texte avant ou après le JSON. Pas de balises markdown.`;

    const userPrompt = `À partir du texte suivant, génère exactement ${safeCount} fiche(s) de révision.

TEXTE SOURCE :
"""
${text.slice(0, 12_000)}
"""

FORMAT DE RÉPONSE (tableau JSON strict) :
[
  {
    "question": "Question claire et précise ?",
    "answer": "Réponse complète et pédagogique.",
    "difficulty": 3
  }
]

Règles :
- "difficulty" est un entier entre 1 (très facile) et 5 (très difficile)
- Évalue la difficulté selon la complexité conceptuelle du contenu
- Varie les difficultés selon le contenu
- Pas de doublons
- Génère exactement ${safeCount} objet(s)`;

    let message: Anthropic.Message;
    try {
      message = await anthropic.messages.create({
        model:      MODEL,
        max_tokens: 4096,
        system:     systemPrompt,
        messages:   [{ role: "user", content: userPrompt }],
      });
    } catch (e) {
      console.error("[generate-flashcards] Anthropic error:", e);
      return error(502, "Erreur lors de l'appel à l'API Anthropic.");
    }

    // ── 6. Parse et validation de la réponse ─────────────────────────────────

    const rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    let flashcards: GeneratedFlashcard[];
    try {
      flashcards = JSON.parse(rawText);
    } catch {
      // Tentative de récupération : extraire le premier tableau JSON trouvé
      const match = rawText.match(/\[[\s\S]*\]/);
      if (!match) {
        console.error("[generate-flashcards] Unparseable response:", rawText.slice(0, 500));
        return error(502, "La réponse de l'IA n'est pas au format JSON attendu.");
      }
      try {
        flashcards = JSON.parse(match[0]);
      } catch {
        return error(502, "Impossible de parser la réponse de l'IA.");
      }
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return error(502, "L'IA n'a généré aucune fiche.");
    }

    // Valider et sanitiser chaque fiche
    const validated: GeneratedFlashcard[] = flashcards
      .filter((f) => typeof f.question === "string" && typeof f.answer === "string")
      .map((f) => ({
        question:   f.question.trim(),
        answer:     f.answer.trim(),
        difficulty: Math.min(5, Math.max(1, Math.round(Number(f.difficulty) || 3))),
      }));

    if (validated.length === 0) {
      return error(502, "Aucune fiche valide générée par l'IA.");
    }

    // ── 7. Réponse ───────────────────────────────────────────────────────────

    console.info(
      `[generate-flashcards] user=${user.id} course=${course_id} ` +
      `generated=${validated.length} input_tokens=${message.usage.input_tokens} ` +
      `output_tokens=${message.usage.output_tokens}`,
    );

    return json({ flashcards: validated, count: validated.length });

  } catch (e) {
    console.error("[generate-flashcards] Unexpected error:", e);
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
