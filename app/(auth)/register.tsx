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
import { signUp } from '@/services/supabase';
import { Colors } from '@/constants/Colors';

type Level = 'collège' | 'lycée' | 'licence' | 'master';

const LEVELS: { value: Level; label: string }[] = [
  { value: 'collège',  label: '🏫 Collège' },
  { value: 'lycée',   label: '🎒 Lycée' },
  { value: 'licence', label: '🎓 Licence' },
  { value: 'master',  label: '📚 Master' },
];

interface FormErrors {
  firstName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  level?: string;
  global?: string;
}

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [level, setLevel] = useState<Level | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};

    if (!firstName.trim())
      next.firstName = 'Le prénom est requis.';
    else if (firstName.trim().length < 2)
      next.firstName = 'Le prénom doit contenir au moins 2 caractères.';

    if (!email.trim())
      next.email = "L'adresse email est requise.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "L'adresse email n'est pas valide.";

    if (!password)
      next.password = 'Le mot de passe est requis.';
    else if (password.length < 8)
      next.password = 'Le mot de passe doit contenir au moins 8 caractères.';

    if (!confirmPassword)
      next.confirmPassword = 'Confirme ton mot de passe.';
    else if (password !== confirmPassword)
      next.confirmPassword = 'Les mots de passe ne correspondent pas.';

    if (!level)
      next.level = 'Sélectionne ton niveau d\'études.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      await signUp(
        email.trim().toLowerCase(),
        password,
        firstName.trim(),
        level!,
      );
      setSuccess(true);
    } catch (e: unknown) {
      setErrors({ global: formatAuthError(e) });
    } finally {
      setLoading(false);
    }
  }

  // Écran de confirmation après inscription
  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✉️</Text>
          <Text style={styles.successTitle}>Vérifie ta boîte mail</Text>
          <Text style={styles.successText}>
            Un lien de confirmation a été envoyé à{'\n'}
            <Text style={styles.successEmail}>{email.trim().toLowerCase()}</Text>
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
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
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoins des milliers d'étudiants 🚀</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>

            {/* Prénom */}
            <View style={styles.field}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={[styles.input, !!errors.firstName && styles.inputError]}
                placeholder="Marie"
                placeholderTextColor={Colors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!loading}
              />
              {!!errors.firstName && <Text style={styles.fieldError}>{errors.firstName}</Text>}
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Adresse email</Text>
              <TextInput
                style={[styles.input, !!errors.email && styles.inputError]}
                placeholder="marie@exemple.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!loading}
              />
              {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
            </View>

            {/* Mot de passe */}
            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={[styles.input, !!errors.password && styles.inputError]}
                placeholder="8 caractères minimum"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
                editable={!loading}
              />
              {!!errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
            </View>

            {/* Confirmation mot de passe */}
            <View style={styles.field}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={[styles.input, !!errors.confirmPassword && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="done"
                editable={!loading}
              />
              {!!errors.confirmPassword && (
                <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Niveau d'études */}
            <View style={styles.field}>
              <Text style={styles.label}>Niveau d'études</Text>
              <View style={styles.levelGrid}>
                {LEVELS.map((l) => (
                  <TouchableOpacity
                    key={l.value}
                    style={[styles.levelChip, level === l.value && styles.levelChipActive]}
                    onPress={() => setLevel(l.value)}
                    disabled={loading}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[styles.levelChipText, level === l.value && styles.levelChipTextActive]}
                    >
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!errors.level && <Text style={styles.fieldError}>{errors.level}</Text>}
            </View>

            {/* Erreur globale */}
            {!!errors.global && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errors.global}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Pied de page */}
          <TouchableOpacity onPress={() => router.back()} disabled={loading}>
            <Text style={styles.linkText}>
              Déjà un compte ? <Text style={styles.link}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatAuthError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);

  if (msg.includes('already registered') || msg.includes('User already registered'))
    return 'Un compte existe déjà avec cette adresse email.';
  if (msg.includes('Password should be'))
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (msg.includes('Network'))
    return 'Problème de connexion. Vérifie ta connexion internet.';
  if (msg.includes('invalid email') || msg.includes('Invalid email'))
    return "L'adresse email n'est pas valide.";

  return 'Une erreur est survenue. Réessaie.';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 32,
  },

  // Header
  header: { gap: 6 },
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
  inputError: { borderColor: Colors.danger },
  fieldError: { fontSize: 12, color: Colors.danger, marginLeft: 2, marginTop: 2 },

  // Niveau d'études — grille 2×2
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  levelChip: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  levelChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  levelChipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  levelChipTextActive: { color: Colors.primary, fontWeight: '700' },

  // Erreur globale
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

  // Écran succès
  successContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  successEmoji: { fontSize: 64 },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  successText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  successEmail: { fontWeight: '700', color: Colors.text },
});
