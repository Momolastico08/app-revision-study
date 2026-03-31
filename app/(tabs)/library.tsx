import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, ScrollView, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { Course, COURSE_COLORS, COURSE_ICONS } from '@/types';
import { Colors } from '@/constants/Colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Course card ──────────────────────────────────────────────────────────────

function CourseCard({ course, onPress, onLongPress }: {
  course: Course;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.courseCard, { borderLeftColor: course.color }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
      <View style={[styles.courseIcon, { backgroundColor: course.color + '20' }]}>
        <Ionicons name={course.icon as IoniconsName} size={26} color={course.color} />
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
        <Text style={styles.courseMeta}>{course.subject} · {course.level}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Creation modal ───────────────────────────────────────────────────────────

const LEVELS = ['collège', 'lycée', 'licence', 'master'] as const;
type Level = typeof LEVELS[number];

function CreateCourseModal({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; subject: string; level: Level; color: string; icon: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState<Level>('licence');
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [icon, setIcon] = useState(COURSE_ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setTitle(''); setSubject(''); setLevel('licence');
    setColor(COURSE_COLORS[0]); setIcon(COURSE_ICONS[0]);
    setError('');
  }

  async function handleCreate() {
    if (!title.trim()) { setError('Le titre est requis.'); return; }
    if (!subject.trim()) { setError('La matière est requise.'); return; }
    setError('');
    setSaving(true);
    try {
      await onCreate({ title: title.trim(), subject: subject.trim(), level, color, icon });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() { reset(); onClose(); }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.modalSafe}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau cours</Text>
            <TouchableOpacity onPress={handleCreate} disabled={saving} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              {saving
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={styles.modalSave}>Créer</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Titre du cours</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: Biologie cellulaire"
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            {/* Subject */}
            <View style={styles.field}>
              <Text style={styles.label}>Matière</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: Sciences de la vie, Maths…"
                placeholderTextColor={Colors.textMuted}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Level */}
            <View style={styles.field}>
              <Text style={styles.label}>Niveau</Text>
              <View style={styles.chipRow}>
                {LEVELS.map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.chip, level === l && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                    onPress={() => setLevel(l)}
                  >
                    <Text style={[styles.chipText, level === l && { color: '#fff', fontWeight: '700' }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color */}
            <View style={styles.field}>
              <Text style={styles.label}>Couleur</Text>
              <View style={styles.colorRow}>
                {COURSE_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchSelected]}
                    onPress={() => setColor(c)}
                  >
                    {color === c && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Icon */}
            <View style={styles.field}>
              <Text style={styles.label}>Icône</Text>
              <View style={styles.iconRow}>
                {COURSE_ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[styles.iconOption, icon === ic && { backgroundColor: color + '25', borderColor: color }]}
                    onPress={() => setIcon(ic)}
                  >
                    <Ionicons name={ic as IoniconsName} size={22} color={icon === ic ? color : Colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.field}>
              <Text style={styles.label}>Aperçu</Text>
              <View style={[styles.courseCard, { borderLeftColor: color, marginBottom: 0 }]}>
                <View style={[styles.courseIcon, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon as IoniconsName} size={26} color={color} />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{title || 'Titre du cours'}</Text>
                  <Text style={styles.courseMeta}>{subject || 'Matière'} · {level}</Text>
                </View>
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>⚠️ {error}</Text>}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const { user } = useAuth();
  const { courses, loading, create, remove } = useCourses(user?.id);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) => c.title.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q),
    );
  }, [courses, search]);

  function confirmDelete(course: Course) {
    Alert.alert(
      'Supprimer ce cours ?',
      `"${course.title}" et toutes ses fiches seront supprimés définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => remove(course.id) },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bibliothèque</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un cours…"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* List */}
      {loading && courses.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              onPress={() => router.push({ pathname: '/course/[id]', params: { id: item.id } })}
              onLongPress={() => confirmDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyTitle}>
                {search ? 'Aucun résultat' : 'Aucun cours'}
              </Text>
              <Text style={styles.emptyText}>
                {search
                  ? `Aucun cours ne correspond à "${search}".`
                  : 'Crée ton premier cours pour commencer à réviser avec l\'IA !'}
              </Text>
              {!search && (
                <TouchableOpacity style={styles.emptyButton} onPress={() => setShowModal(true)}>
                  <Text style={styles.emptyButtonText}>+ Créer un cours</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <CreateCourseModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onCreate={create}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: Colors.text },

  // List
  list: { paddingHorizontal: 20, paddingBottom: 100 },

  // Course card
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  courseMeta: { fontSize: 13, color: Colors.textSecondary },

  // Empty state
  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  modalCancel: { fontSize: 16, color: Colors.textSecondary },
  modalSave: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  modalBody: { padding: 20, gap: 24 },

  // Form
  field: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },

  // Level chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },

  // Colors
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  // Icons
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },

  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '500', textAlign: 'center' },
});
