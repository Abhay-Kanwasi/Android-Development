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
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import SurveyCard from './SurveyCard';
import { apiCall } from '../services/api';
import type { Survey, SurveysResponse, StartSurveyResponse } from '../types/bitlabs';

const PAGE_SIZE = 5;

const SurveysScreen: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [startingSurveyId, setStartingSurveyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ difficulty: '', category: '', minReward: 0, maxDuration: 0 });
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchSurveys = useCallback(async (reset = false): Promise<void> => {
    try {
      if (reset) {
        setIsRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await apiCall<SurveysResponse>('/api/surveys/');
      const data = response.data;
      setUserBalance(data.user_balance || 0);
      setTotalEarnings(data.total_earnings || 0);

      let fetchedSurveys = data.surveys || [];

      // Apply filters
      if (filters.difficulty) {
        fetchedSurveys = fetchedSurveys.filter(s => s.conversion_level === filters.difficulty);
      }
      if (filters.category) {
        fetchedSurveys = fetchedSurveys.filter(s =>
          s.category.toLowerCase().includes(filters.category.toLowerCase())
        );
      }
      if (filters.minReward) {
        fetchedSurveys = fetchedSurveys.filter(s => s.reward >= filters.minReward);
      }
      if (filters.maxDuration) {
        fetchedSurveys = fetchedSurveys.filter(s => s.duration <= filters.maxDuration);
      }

      if (reset) {
        setSurveys(fetchedSurveys.slice(0, PAGE_SIZE));
      } else {
        setSurveys(prev => [...prev, ...fetchedSurveys.slice(prev.length, prev.length + PAGE_SIZE)]);
      }

      if (fetchedSurveys.length <= PAGE_SIZE * page) setHasMore(false);

    } catch (err) {
      console.error('Error fetching surveys:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      Alert.alert('Error', 'Failed to load surveys. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, page]);

  const handleRefresh = async (): Promise<void> => {
    await fetchSurveys(true);
  };

  const handleLoadMore = (): void => {
    if (!hasMore || isLoading) return;
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    fetchSurveys(true);
  }, [filters]);

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
          setTimeout(handleRefresh, 1000);
        } else {
          Alert.alert('Error', 'Cannot open survey URL.', [{ text: 'OK' }]);
        }
      } else {
        Alert.alert('Error', 'Failed to start survey.', [{ text: 'OK' }]);
      }
    } catch (err) {
      console.error('Error starting survey:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to start survey', [{ text: 'OK' }]);
    } finally {
      setStartingSurveyId(null);
    }
  };

  const renderSurveyCard = ({ item }: { item: Survey }) => (
    <SurveyCard survey={item} onStartSurvey={handleStartSurvey} isLoading={startingSurveyId === item.id} />
  );

  const FilterButton = ({ label, value, selected, onPress }: any) => (
    <TouchableOpacity
      onPress={() => onPress(value)}
      style={[styles.filterButton, selected === value && styles.filterButtonActive]}
    >
      <Text style={[styles.filterButtonText, selected === value && styles.filterButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <FlatList
        data={surveys}
        keyExtractor={item => item.id.toString()}
        renderItem={renderSurveyCard}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
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

              {/* Difficulty filter */}
              <View style={styles.filtersContainer}>
                <Text style={styles.filterLabel}>Difficulty:</Text>
                <View style={styles.filterButtonsRow}>
                  {['', 'easy', 'medium', 'hard'].map(level => (
                    <FilterButton
                      key={level}
                      label={level === '' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                      value={level}
                      selected={filters.difficulty}
                      onPress={value => setFilters(prev => ({ ...prev, difficulty: value }))}
                    />
                  ))}
                </View>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={!isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No surveys available.</Text>
          </View>
        )}
      />
      {isLoading && <ActivityIndicator style={{ marginVertical: 16 }} size="large" color="#007AFF" />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  balanceContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  balanceItem: { alignItems: 'center', flex: 1 },
  balanceLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  balanceValue: { fontSize: 20, fontWeight: '700', color: '#4CAF50' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#007AFF' },
  filtersContainer: { marginTop: 12 },
  filterLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  filterButtonsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  filterButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#007AFF', marginRight: 8, marginBottom: 8 },
  filterButtonActive: { backgroundColor: '#007AFF' },
  filterButtonText: { color: '#007AFF' },
  filterButtonTextActive: { color: '#fff' },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyStateText: { fontSize: 16, color: '#666' },
});

export default SurveysScreen;
