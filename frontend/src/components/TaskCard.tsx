import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TaskCardProps {
  title: string;
  description: string;
  footerText: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'ad' | 'error';
}

const TaskCard: React.FC<TaskCardProps> = ({
  title,
  description,
  footerText,
  onPress,
  disabled = false,
  variant = 'default'
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'ad':
        return [styles.taskCard, disabled && styles.disabledCard];
      case 'error':
        return [styles.taskCard, styles.errorCard];
      default:
        return styles.taskCard;
    }
  };

  return (
    <TouchableOpacity 
      style={getCardStyle()}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.taskCardTitle}>{title}</Text>
      <Text style={styles.taskCardDescription}>{description}</Text>
      <Text style={styles.taskCardQuestions}>{footerText}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  taskCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  taskCardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskCardQuestions: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  disabledCard: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  errorCard: {
    backgroundColor: '#fff0f0',
    borderColor: '#d9534f',
  },
});

export default TaskCard;