// src/components/VideoQuiz.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { QuizQuestion, UserResponse } from '../types/video';


interface VideoQuizProps {
  questions: QuizQuestion[];
  onSubmit: (responses: UserResponse[]) => void;
  loading: boolean;
}

const VideoQuiz: React.FC<VideoQuizProps> = ({ questions, onSubmit, loading }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  console.log("inside video quiz")
  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    const responses: UserResponse[] = questions.map(question => ({
      question: question.id,
      user_answer: answers[question.id]
    }));

    onSubmit(responses);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Video Quiz</Text>
      {questions.map((question, index) => (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {index + 1}. {question.question_text}
          </Text>
          <TextInput
            style={styles.answerInput}
            placeholder="Enter your answer"
            value={answers[question.id] || ''}
            onChangeText={(text) => handleAnswerChange(question.id, text)}
            multiline
          />
        </View>
      ))}
      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Submit Quiz'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VideoQuiz;