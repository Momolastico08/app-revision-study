import Anthropic from '@anthropic-ai/sdk';
import { FlashcardContent, QuizQuestion } from '@/types';

// IMPORTANT: Never expose your Anthropic API key in the client.
// All Anthropic calls should be proxied through your Supabase Edge Functions
// to keep the key server-side only.
//
// Pattern:
//   client → Supabase Edge Function → Anthropic API
//
// The helpers below call your Supabase Edge Functions, not the SDK directly.
// The SDK import is kept for reference / potential server-side usage.

const EDGE_FUNCTION_BASE = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`
  : '';

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`${EDGE_FUNCTION_BASE}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message ?? 'Edge function error');
  }

  return response.json() as Promise<T>;
}

// ─── Flashcard generation ─────────────────────────────────────────────────────

/**
 * Generate structured flashcard content from a body of text.
 * Calls the `generate-flashcard` Supabase Edge Function which wraps the Anthropic API.
 */
export async function generateFlashcard(
  sourceText: string,
  subject: string,
  accessToken: string,
): Promise<FlashcardContent> {
  return callEdgeFunction<FlashcardContent>(
    'generate-flashcard',
    { source_text: sourceText, subject },
    accessToken,
  );
}

// ─── Quiz generation ──────────────────────────────────────────────────────────

/**
 * Generate a multiple-choice quiz from flashcard content.
 * Calls the `generate-quiz` Supabase Edge Function.
 */
export async function generateQuiz(
  flashcardContent: string,
  questionCount: number = 5,
  accessToken: string,
): Promise<QuizQuestion[]> {
  return callEdgeFunction<QuizQuestion[]>(
    'generate-quiz',
    { flashcard_content: flashcardContent, question_count: questionCount },
    accessToken,
  );
}

// ─── Example Edge Function implementation (deploy to Supabase) ────────────────
//
// supabase/functions/generate-flashcard/index.ts
//
// import Anthropic from 'npm:@anthropic-ai/sdk';
//
// const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
//
// Deno.serve(async (req) => {
//   const { source_text, subject } = await req.json();
//
//   const message = await anthropic.messages.create({
//     model: 'claude-opus-4-6',
//     max_tokens: 2048,
//     messages: [{
//       role: 'user',
//       content: `Tu es un expert pédagogique. À partir du texte suivant sur "${subject}",
//                 génère une fiche de révision structurée avec :
//                 - Un titre clair
//                 - Les concepts clés (liste)
//                 - Un résumé (3-5 phrases)
//                 - Des points importants à retenir
//
//                 Texte : ${source_text}
//
//                 Réponds en JSON avec les clés : title, key_concepts, summary, key_points.`,
//     }],
//   });
//
//   const content = JSON.parse(message.content[0].text);
//   return new Response(JSON.stringify(content), {
//     headers: { 'Content-Type': 'application/json' },
//   });
// });
