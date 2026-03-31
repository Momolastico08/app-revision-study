/**
 * GenerateFlashcardScreen
 *
 * Lets the user paste text or type a topic, then generates a flashcard via
 * the Anthropic API (proxied through a Supabase Edge Function).
 */
import { View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';

interface GenerateFlashcardScreenProps {
  onGenerate: (subject: string, text: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

export function GenerateFlashcardScreen({
  onGenerate,
  onBack,
  loading,
}: GenerateFlashcardScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.nav}>
        <Text style={styles.backButton} onPress={onBack}>
          ‹ Retour
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer une fiche IA</Text>
        <Text style={styles.subtitle}>
          Colle ton cours ou décris le sujet. L'IA structure une fiche de révision pour toi.
        </Text>

        <TextInput style={styles.input} placeholder="Matière (ex: Biologie, Histoire)" placeholderTextColor={Colors.textMuted} />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Colle ton texte de cours ici..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />

        <Button label={loading ? 'Génération...' : 'Générer avec l\'IA ✨'} onPress={() => {}} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  nav: { paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { color: Colors.primary, fontSize: 17 },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
  },
  textarea: { minHeight: 160, paddingTop: 14 },
});
