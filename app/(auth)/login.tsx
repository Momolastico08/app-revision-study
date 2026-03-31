import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { signIn } from '@/services/supabase';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');

    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // useAuth redirige automatiquement vers (tabs) après connexion
    } catch (e: unknown) {
      setError(formatAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* En-tête */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>📖</Text>
            </View>
            <Text style={styles.title}>StudyForge</Text>
            <Text style={styles.subtitle}>Connecte-toi pour continuer</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Adresse email</Text>
              <TextInput
                style={[styles.input, error && !email.trim() && styles.inputError]}
                placeholder="exemple@email.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={[styles.input, error && !password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
            </View>

            {/* Bloc erreur */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Pied de page */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Pas encore de compte ?{' '}
              <Text style={styles.link}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Traduit les erreurs Supabase Auth en messages français lisibles. */
function formatAuthError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);

  if (msg.includes('Invalid login credentials'))
    return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed'))
    return 'Confirme ton adresse email avant de te connecter.';
  if (msg.includes('Too many requests'))
    return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (msg.includes('Network'))
    return 'Problème de connexion. Vérifie ta connexion internet.';

  return 'Une erreur est survenue. Réessaie.';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    gap: 36,
  },

  // Header
  header: { alignItems: 'center', gap: 12 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 40 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },

  // Formulaire
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginLeft: 2 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.danger,
  },

  // Erreur
  errorBox: {
    backgroundColor: Colors.danger + '12',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '500' },

  // Bouton
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Lien
  linkText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
  link: { color: Colors.primary, fontWeight: '700' },
});
