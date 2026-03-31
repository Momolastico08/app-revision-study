import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { GenerateFlashcardScreen } from '@/screens/GenerateFlashcardScreen';
import { Colors } from '@/constants/Colors';

/**
 * Route: /generate/[courseId]
 * Thin wrapper that resolves the course and session, then renders
 * GenerateFlashcardScreen with the required props.
 */
export default function GenerateRoute() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user, session } = useAuth();
  const { courses } = useCourses(user?.id);

  const course = courses.find((c) => c.id === courseId);
  const accessToken = session?.access_token;

  // Wait for courses to load
  if (!course || !accessToken || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <GenerateFlashcardScreen
      course={course}
      userId={user.id}
      accessToken={accessToken}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
