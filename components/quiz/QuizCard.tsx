import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { QuizQuestion } from '@/types';
import { Colors } from '@/constants/Colors';

interface QuizCardProps {
  question: QuizQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  showAnswer: boolean;
}

export function QuizCard({ question, selectedIndex, onSelect, showAnswer }: QuizCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question.question}</Text>
      <View style={styles.options}>
        {question.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === question.correct_index;
          let optionStyle = styles.option;
          if (showAnswer) {
            if (isCorrect) optionStyle = { ...optionStyle, ...styles.optionCorrect };
            else if (isSelected) optionStyle = { ...optionStyle, ...styles.optionWrong };
          } else if (isSelected) {
            optionStyle = { ...optionStyle, ...styles.optionSelected };
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => !showAnswer && onSelect(index)}
              disabled={showAnswer}
            >
              <Text style={styles.optionLabel}>{String.fromCharCode(65 + index)}. </Text>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {showAnswer && (
        <View style={styles.explanation}>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  question: { fontSize: 18, fontWeight: '600', color: Colors.text, lineHeight: 26 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '15' },
  optionCorrect: { borderColor: Colors.success, backgroundColor: Colors.success + '15' },
  optionWrong: { borderColor: Colors.danger, backgroundColor: Colors.danger + '15' },
  optionLabel: { fontWeight: '700', color: Colors.primary, fontSize: 14 },
  optionText: { flex: 1, color: Colors.text, fontSize: 14, lineHeight: 20 },
  explanation: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  explanationText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
