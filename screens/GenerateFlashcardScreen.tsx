/**
 * GenerateFlashcardScreen
 * Route: app/generate/[courseId].tsx
 *
 * Flow:
 *  1. Paste text OR import PDF
 *  2. Choose number of flashcards (5 / 10 / 20 / 50)
 *  3. Call generate-flashcards Edge Function
 *  4. Preview generated cards
 *  5. Save to Supabase
 */
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { generateFlashcards } from '@/services/anthropic';
import { useFlashcards } from '@/hooks/useFlashcards';
import { GeneratedFlashcard, Course } from '@/types';
import { Colors } from '@/constants/Colors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  course: Course;
  userId: string;
  accessToken: string;
}

type Step = 'input' | 'generating' | 'preview' | 'saving';

const COUNT_OPTIONS = [5, 10, 20, 50] as const;

// ─── Preview card ─────────────────────────────────────────────────────────────

function PreviewCard({ card, index, color }: {
  card: GeneratedFlashcard;
  index: number;
  color: string;
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  const diffLabel = card.difficulty <= 2 ? 'Facile' : card.difficulty <= 3 ? 'Moyen' : 'Difficile';
  const diffColor = card.difficulty <= 2 ? Colors.success : card.difficulty <= 3 ? Colors.warning : Colors.danger;

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewCardHeader}>
        <Text style={styles.previewIndex}>#{index + 1}</Text>
        <View style={[styles.diffBadge, { backgroundColor: diffColor + '20' }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
        </View>
      </View>
      <Text style={styles.previewQuestion}>{card.question}</Text>
      <TouchableOpacity
        style={[styles.showAnswerBtn, { borderColor: color }]}
        onPress={() => setShowAnswer((v) => !v)}
      >
        <Text style={[styles.showAnswerText, { color }]}>
          {showAnswer ? 'Masquer la réponse' : 'Voir la réponse'}
        </Text>
        <Ionicons name={showAnswer ? 'eye-off-outline' : 'eye-outline'} size={15} color={color} />
      </TouchableOpacity>
      {showAnswer && (
        <View style={[styles.answerBox, { borderLeftColor: color }]}>
          <Text style={styles.answerText}>{card.answer}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GenerateFlashcardScreen({ course, userId, accessToken }: Props) {
  const { save } = useFlashcards(course.id, userId);

  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [count, setCount] = useState<number>(10);
  const [generated, setGenerated] = useState<GeneratedFlashcard[]>([]);
  const [error, setError] = useState('');

  // ── PDF import ──────────────────────────────────────────────────────────────

  async function handlePickPdf() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setPdfName(asset.name);

      // Best-effort text extraction: reads the raw file and strips binary chars.
      // Works reasonably for text-based PDFs; scanned PDFs will yield garbage.
      const raw = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      }).catch(() => null);

      if (raw) {
        // Keep only printable ASCII + common accented chars, collapse whitespace
        const cleaned = raw
          .replace(/[^\x20-\x7E\u00C0-\u024F\n\r\t]/g, ' ')
          .replace(/\s{3,}/g, '\n\n')
          .trim();
        setText(cleaned.slice(0, 15_000)); // cap at 15k chars
      } else {
        Alert.alert(
          'Extraction limitée',
          'Le contenu du PDF n\'a pas pu être extrait automatiquement. Colle ton texte manuellement.',
        );
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier.');
    }
  }

  // ── Generation ──────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!text.trim()) {
      setError('Colle un texte ou importe un PDF avant de générer.');
      return;
    }
    if (text.trim().length < 50) {
      setError('Le texte est trop court pour générer des fiches (50 caractères minimum).');
      return;
    }
    setError('');
    setStep('generating');
    try {
      const response = await generateFlashcards(text.trim(), course.id, count, accessToken);
      setGenerated(response.flashcards);
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération.');
      setStep('input');
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    setStep('saving');
    try {
      await save(generated, text.trim());
      router.back();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Sauvegarde impossible.');
      setStep('preview');
    }
  }

  // ── Input step ──────────────────────────────────────────────────────────────

  if (step === 'input' || step === 'generating') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>Générer des fiches</Text>
              <Text style={styles.headerSub}>{course.title}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* PDF import */}
            <TouchableOpacity style={styles.pdfBtn} onPress={handlePickPdf} disabled={step === 'generating'}>
              <Ionicons name="document-outline" size={20} color={course.color} />
              <Text style={[styles.pdfBtnText, { color: course.color }]}>
                {pdfName ? `📄 ${pdfName}` : 'Importer un PDF'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou coller du texte</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Text area */}
            <TextInput
              style={styles.textarea}
              placeholder="Colle ici ton cours, tes notes ou un extrait de manuel…"
              placeholderTextColor={Colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
              editable={step === 'input'}
            />
            <Text style={styles.charCount}>{text.length} caractères</Text>

            {/* Count selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nombre de fiches</Text>
              <View style={styles.countRow}>
                {COUNT_OPTIONS.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.countChip, count === n && { backgroundColor: course.color, borderColor: course.color }]}
                    onPress={() => setCount(n)}
                    disabled={step === 'generating'}
                  >
                    <Text style={[styles.countChipText, count === n && { color: '#fff', fontWeight: '700' }]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.countHint}>
                Limité à 10 en version gratuite · illimité en Pro
              </Text>
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* Generate button */}
            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: course.color }, step === 'generating' && styles.btnDisabled]}
              onPress={handleGenerate}
              disabled={step === 'generating'}
              activeOpacity={0.85}
            >
              {step === 'generating' ? (
                <View style={styles.generatingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.generateBtnText}>Génération en cours…</Text>
                </View>
              ) : (
                <View style={styles.generatingRow}>
                  <Ionicons name="sparkles-outline" size={20} color="#fff" />
                  <Text style={styles.generateBtnText}>Générer {count} fiches</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Preview step ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setStep('input')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>{generated.length} fiches générées</Text>
          <Text style={styles.headerSub}>Vérifie avant de sauvegarder</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.previewList}>
        {generated.map((card, i) => (
          <PreviewCard key={i} card={card} index={i} color={course.color} />
        ))}
      </ScrollView>

      {/* Save bar */}
      <View style={styles.saveBar}>
        <TouchableOpacity style={styles.discardBtn} onPress={() => setStep('input')}>
          <Text style={styles.discardText}>Refaire</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: course.color }, step === 'saving' && styles.btnDisabled]}
          onPress={handleSave}
          disabled={step === 'saving'}
          activeOpacity={0.85}
        >
          {step === 'saving' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Sauvegarder les {generated.length} fiches</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  // Input step body
  body: { padding: 20, gap: 16, paddingBottom: 40 },

  // PDF button
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
  },
  pdfBtnText: { fontSize: 15, fontWeight: '600' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textMuted },

  // Textarea
  textarea: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 180,
    borderWidth: 1.5,
    borderColor: Colors.border,
    lineHeight: 20,
  },
  charCount: { fontSize: 12, color: Colors.textMuted, textAlign: 'right', marginTop: -8 },

  // Count selector
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  countRow: { flexDirection: 'row', gap: 10 },
  countChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  countChipText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  countHint: { fontSize: 12, color: Colors.textMuted },

  // Error
  errorBox: {
    backgroundColor: Colors.danger + '12',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '500' },

  // Generate button
  generateBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },

  // Preview list
  previewList: { padding: 20, gap: 12, paddingBottom: 120 },

  // Preview card
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewIndex: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  diffBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 12, fontWeight: '600' },
  previewQuestion: { fontSize: 15, fontWeight: '600', color: Colors.text, lineHeight: 21 },
  showAnswerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  showAnswerText: { fontSize: 13, fontWeight: '600' },
  answerBox: { borderLeftWidth: 3, paddingLeft: 12 },
  answerText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  // Save bar
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  discardBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
