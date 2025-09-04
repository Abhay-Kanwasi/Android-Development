import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CompletedTaskViewProps {
  onContinue: () => void;
  message?: string;
  buttonText?: string;
}

const CompletedTaskView: React.FC<CompletedTaskViewProps> = ({
  onContinue,
  message = 'Task Completed! 🎉',
  buttonText = 'Choose Another Task'
}) => {
  return (
    <View style={styles.completedContainer}>
      <Text style={styles.completedText}>{message}</Text>
      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  completedContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CompletedTaskView;