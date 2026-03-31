import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>Utilisateur</Text>
          <Text style={styles.userEmail}>user@example.com</Text>
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planLabel}>Abonnement</Text>
          <Text style={styles.planName}>Gratuit</Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Passer à Pro ✨</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <MenuRow label="Mes statistiques" icon="📊" />
          <MenuRow label="Paramètres" icon="⚙️" />
          <MenuRow label="Aide & Support" icon="💬" />
          <MenuRow label="Mentions légales" icon="📄" />
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ label, icon }: { label: string; icon: string }) {
  return (
    <TouchableOpacity style={styles.menuRow}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 24 },
  header: { paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text },
  avatarSection: { alignItems: 'center', gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36 },
  userName: { fontSize: 20, fontWeight: '600', color: Colors.text },
  userEmail: { fontSize: 14, color: Colors.textSecondary },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    alignItems: 'center',
  },
  planLabel: { fontSize: 13, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  planName: { fontSize: 22, fontWeight: '700', color: Colors.text },
  upgradeButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  upgradeButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  section: { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.text },
  menuChevron: { fontSize: 20, color: Colors.textMuted },
  logoutButton: { alignItems: 'center', paddingVertical: 16 },
  logoutText: { color: Colors.danger, fontSize: 15, fontWeight: '500' },
});
