import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Flashcard } from '@/types';
import { Colors } from '@/constants/Colors';

interface FlashcardItemProps {
  flashcard: Flashcard;
  onPress: (flashcard: Flashcard) => void;
}

export function FlashcardItem({ flashcard, onPress }: FlashcardItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(flashcard)} activeOpacity={0.8}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{flashcard.subject}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{flashcard.title}</Text>
      <Text style={styles.date}>
        {new Date(flashcard.created_at).toLocaleDateString('fr-FR')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight + '30',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  date: { fontSize: 12, color: Colors.textMuted },
});
