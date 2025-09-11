// src/components/SurveyCard.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import type { SurveyCardProps } from '../types/bitlabs';

const SurveyCard: React.FC<SurveyCardProps> = ({ survey, onStartSurvey, isLoading }) => {
  const getDifficultyColor = (conversionLevel: 'easy' | 'medium' | 'hard'): string => {
    switch (conversionLevel) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };
  console.log("ss", survey.conversion_level)
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleStartPress = (): void => {
    Alert.alert(
      'Start Survey',
      `Are you sure you want to start this survey for $${survey.reward}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => onStartSurvey(survey.id) },
      ]
    );
  };

  const renderStarRating = (rating: number): string => {
    return '★'.repeat(Math.floor(rating));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {survey.name}
        </Text>
        <View style={[
          styles.difficultyBadge,
          { backgroundColor: getDifficultyColor(survey.conversion_level) }
        ]}>
          <Text style={styles.difficultyText}>
            {survey.conversion_level.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reward:</Text>
          <Text style={styles.reward}>${survey.reward}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{formatDuration(survey.duration)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {survey.category}
          </Text>
        </View>
        
        {survey.rating > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rating:</Text>
            <Text style={styles.detailValue}>
              {renderStarRating(survey.rating)} ({survey.rating}/5)
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.startButton, isLoading && styles.disabledButton]}
        onPress={handleStartPress}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>
          {isLoading ? 'Starting...' : 'Start Survey'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

interface Styles {
  card: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  difficultyBadge: ViewStyle;
  difficultyText: TextStyle;
  details: ViewStyle;
  detailRow: ViewStyle;
  detailLabel: TextStyle;
  detailValue: TextStyle;
  reward: TextStyle;
  startButton: ViewStyle;
  disabledButton: ViewStyle;
  startButtonText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  reward: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SurveyCard;
