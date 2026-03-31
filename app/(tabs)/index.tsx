import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.subtitle}>Prêt à réviser aujourd'hui ?</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Fiches" value="0" />
          <StatCard label="Quizz" value="0" />
          <StatCard label="Streak" value="0j" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récemment consultés</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune fiche pour le moment.</Text>
            <Text style={styles.emptyHint}>Crée ta première fiche depuis la Bibliothèque !</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaText}>+ Créer une fiche avec l'IA</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 24 },
  header: { gap: 4 },
  greeting: { fontSize: 28, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 16, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptyState: { gap: 4, alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  emptyHint: { fontSize: 13, color: Colors.textMuted },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
