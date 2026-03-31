import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useCourses } from '@/hooks/useCourses';
import { Flashcard } from '@/types';
import { Colors } from '@/constants/Colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Flashcard row ────────────────────────────────────────────────────────────

function FlashcardRow({ card, courseColor, onDelete }: {
  card: Flashcard;
  courseColor: string;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const difficultyColor = card.difficulty <= 2
    ? Colors.success
    : card.difficulty <= 3
      ? Colors.warning
      : Colors.danger;

  return (
    <TouchableOpacity
      style={styles.flashcardRow}
      onPress={() => setExpanded((v) => !v)}
      onLongPress={onDelete}
      activeOpacity={0.8}
    >
      <View style={styles.flashcardHeader}>
        <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
        <Text style={styles.flashcardQuestion} numberOfLines={expanded ? undefined : 2}>
          {card.question}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
        />
      </View>
      {expanded && (
        <View style={[styles.flashcardAnswer, { borderLeftColor: courseColor }]}>
          <Text style={styles.flashcardAnswerText}>{card.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { courses } = useCourses(user?.id);
  const { flashcards, loading, remove, refresh } = useFlashcards(id, user?.id);

  const course = courses.find((c) => c.id === id);

  const confirmDelete = useCallback((card: Flashcard) => {
    Alert.alert(
      'Supprimer cette fiche ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => remove(card.id) },
      ],
    );
  }, [remove]);

  const courseColor = course?.color ?? Colors.primary;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {course && (
            <View style={[styles.courseIconSmall, { backgroundColor: courseColor + '20' }]}>
              <Ionicons name={course.icon as IoniconsName} size={18} color={courseColor} />
            </View>
          )}
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {course?.title ?? 'Cours'}
            </Text>
            {course && (
              <Text style={styles.headerSub}>{course.subject} · {course.level}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: courseColor }]}>{flashcards.length}</Text>
          <Text style={styles.statLabel}>Fiches</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: courseColor }]}>
            {flashcards.filter(f => f.next_review && new Date(f.next_review) <= new Date()).length}
          </Text>
          <Text style={styles.statLabel}>À réviser</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: courseColor }]}>
            {flashcards.filter(f => f.difficulty <= 2 && f.review_count >= 3).length}
          </Text>
          <Text style={styles.statLabel}>Maîtrisées</Text>
        </View>
      </View>

      {/* Flashcard list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={flashcards}
          keyExtractor={(f) => f.id}
          contentContainerStyle={flashcards.length === 0 ? styles.emptyContainer : styles.list}
          onRefresh={refresh}
          refreshing={loading}
          renderItem={({ item }) => (
            <FlashcardRow
              card={item}
              courseColor={courseColor}
              onDelete={() => confirmDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={styles.emptyTitle}>Aucune fiche</Text>
              <Text style={styles.emptyText}>
                Génère des fiches de révision avec l'IA à partir de ton cours.
              </Text>
              <TouchableOpacity
                style={[styles.generateBtn, { backgroundColor: courseColor }]}
                onPress={() => router.push({ pathname: '/generate/[courseId]', params: { courseId: id } })}
              >
                <Ionicons name="sparkles-outline" size={18} color="#fff" />
                <Text style={styles.generateBtnText}>Générer avec l'IA</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB — generate flashcards */}
      {flashcards.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: courseColor }]}
          onPress={() => router.push({ pathname: '/generate/[courseId]', params: { courseId: id } })}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles-outline" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  courseIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  // Stats
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border },

  // List
  list: { padding: 20, paddingBottom: 100 },
  emptyContainer: { flex: 1 },

  // Flashcard row
  flashcardRow: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  flashcardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  difficultyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  flashcardQuestion: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500', lineHeight: 21 },
  flashcardAnswer: {
    marginTop: 10,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  flashcardAnswerText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    gap: 12,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  generateBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
