/**
 * FlashcardDetailScreen
 *
 * Displays a flashcard's full content and provides actions to start a quiz
 * or delete the card. Navigate to this screen with:
 *   router.push({ pathname: '/flashcard/[id]', params: { id } })
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flashcard } from '@/types';
import { Colors } from '@/constants/Colors';

interface FlashcardDetailScreenProps {
  flashcard: Flashcard;
  onStartQuiz: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function FlashcardDetailScreen({
  flashcard,
  onStartQuiz,
  onDelete,
  onBack,
}: FlashcardDetailScreenProps) {
  const confirmDelete = () => {
    Alert.alert('Supprimer la fiche', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>‹ Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete}>
          <Text style={styles.deleteButton}>Supprimer</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{flashcard.subject}</Text>
        </View>
        <Text style={styles.title}>{flashcard.title}</Text>
        <Text style={styles.body}>{flashcard.content}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.quizButton} onPress={onStartQuiz}>
          <Text style={styles.quizButtonText}>Démarrer un quizz 🧠</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: { color: Colors.primary, fontSize: 17 },
  deleteButton: { color: Colors.danger, fontSize: 15 },
  content: { padding: 20, gap: 16 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight + '30',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  body: { fontSize: 15, color: Colors.text, lineHeight: 24 },
  footer: { padding: 20 },
  quizButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  quizButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
