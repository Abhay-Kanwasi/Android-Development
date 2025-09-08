// src/components/SurveysScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  Linking,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ListRenderItem,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import SurveyCard from './SurveyCard';
import { apiCall } from '../services/api';
import type { Survey, SurveysResponse, StartSurveyResponse } from '../types/bitlabs';

const SurveysScreen: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [startingSurveyId, setStartingSurveyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = async (showLoader: boolean = true): Promise<void> => {
    try {
      if (showLoader) {
        setIsLoading(true);
        setError(null);
      }
      
      const response = await apiCall<SurveysResponse>('/api/surveys/');
      const data = response.data;
      setSurveys(data.surveys || []);
      setUserBalance(data.user_balance || 0);
      setTotalEarnings(data.total_earnings || 0);
      setError(null);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      Alert.alert(
        'Error',
        'Failed to load surveys. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    await fetchSurveys(false);
    setIsRefreshing(false);
  }, []);

  const handleStartSurvey = async (surveyId: string): Promise<void> => {
    try {
      setStartingSurveyId(surveyId);
      
      const apiResponse = await apiCall<StartSurveyResponse>('/api/surveys/start/', {
        method: 'POST',
        data: { survey_id: surveyId },
      });
      const response = apiResponse.data;
      
      if (response.survey_url) {
        const supported = await Linking.canOpenURL(response.survey_url);
        
        if (supported) {
          await Linking.openURL(response.survey_url);
          
          // Refresh surveys after starting one
          setTimeout(() => {
            handleRefresh();
          }, 1000);
        } else {
          Alert.alert(
            'Error',
            'Cannot open survey URL. Please check your device settings.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Error',
          'Failed to start survey. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error starting survey:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start survey';
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setStartingSurveyId(null);
    }
  };

  const handleRetry = (): void => {
    fetchSurveys();
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const renderSurveyCard: ListRenderItem<Survey> = ({ item }) => (
    <SurveyCard
      survey={item}
      onStartSurvey={handleStartSurvey}
      isLoading={startingSurveyId === item.id}
    />
  );

  const renderHeader = (): React.ReactElement => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Available Surveys</Text>
      <View style={styles.balanceContainer}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceValue}>${userBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Total Earned</Text>
          <Text style={styles.totalValue}>${totalEarnings.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        No surveys available at the moment.
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Pull to refresh and check for new opportunities!
      </Text>
    </View>
  );

  const renderError = (): React.ReactElement => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        {error || 'Something went wrong'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && surveys.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading surveys...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && surveys.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        {renderHeader()}
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <FlatList<Survey>
        data={surveys}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSurveyCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
            title="Pull to refresh"
            titleColor="#666666"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={surveys.length === 0 ? styles.emptyContainer : undefined}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  balanceContainer: ViewStyle;
  balanceItem: ViewStyle;
  balanceLabel: TextStyle;
  balanceValue: TextStyle;
  totalValue: TextStyle;
  emptyContainer: ViewStyle;
  emptyState: ViewStyle;
  emptyStateText: TextStyle;
  emptyStateSubtext: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SurveysScreen;
