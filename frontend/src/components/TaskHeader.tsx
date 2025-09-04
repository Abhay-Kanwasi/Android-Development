import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TaskHeaderProps {
  title: string;
  description: string;
  onBackPress: () => void;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  title,
  description,
  onBackPress
}) => {
  return (
    <View style={styles.taskHeader}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <Text style={styles.backButtonText}>← Back to Tasks</Text>
      </TouchableOpacity>
      <Text style={styles.taskTitle}>{title}</Text>
      <Text style={styles.taskDescription}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  taskHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
});

export default TaskHeader;