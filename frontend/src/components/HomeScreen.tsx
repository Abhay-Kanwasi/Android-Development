// src/components/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import YouTubeVideoPlayer from './YouTubePlayer';
import VideoQuiz from './VideoQuiz';
import { VideoTask, VideoWatchSession, UserResponse, QuizResult } from '../types/video';
import { apiCall } from '../services/api';

// --- AdMob Imports ---
import { RewardedAd, RewardedAdEventType, TestIds, AdEventType } from 'react-native-google-mobile-ads';

// --- AdMob: Use the test ID for rewarded ads ---
const rewardedAdUnitId = Platform.select({
  ios: TestIds.REWARDED,
  android: TestIds.REWARDED,
}) as string;

// Navigation types
type RootStackParamList = {
  Home: undefined;
  VideoTask: { taskId: number };
};
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// --- AdMob: Create the ad instance outside the component ---
const rewardedAd = RewardedAd.createForAdRequest(rewardedAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // --- Your Existing State ---
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTask, setCurrentTask] = useState<VideoTask | null>(null);
  const [session, setSession] = useState<VideoWatchSession | null>(null);
  const [videoCompleted, setVideoCompleted] = useState<boolean>(false);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [submittingQuiz, setSubmittingQuiz] = useState<boolean>(false);

  // --- AdMob: State for the rewarded ad ---
  const [rewardedAdLoaded, setRewardedAdLoaded] = useState(false);

  useEffect(() => {
    fetchVideoTasks();

    // --- AdMob: Setup and load the rewarded ad ---
    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setRewardedAdLoaded(true);
      console.log('Rewarded Ad is loaded and ready.');
    });

    const unsubscribeEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('User earned reward:', reward);
        awardAdPoints(reward.amount);
      },
    );

    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setRewardedAdLoaded(false);
      rewardedAd.load();
    });

    rewardedAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
    };
  }, []);

  // --- AdMob: New Function to award points via your backend API ---
  const awardAdPoints = async (amount: number) => {
    console.log(`Attempting to award ${amount} points...`);
    Alert.alert('Reward Earned!', `You've earned ${amount} points.`);
    try {
      // This now matches your Django endpoint
      const response = await apiCall('/award-ad-points/', { 
        method: 'POST', 
        data: { points: amount } 
      });
      console.log('Backend response:', response.data);
      // You could even show the new total points from the response
      // Alert.alert('Success', `Points saved! New total: ${response.data.new_total_points}`);
    } catch (error) {
      console.error('Failed to award points via API:', error);
    }
  };

  // --- AdMob: New Function to show the ad ---
  const showRewardedAd = () => {
    if (rewardedAdLoaded) {
      rewardedAd.show();
    } else {
      Alert.alert('Ad Not Ready', 'The ad is still loading. Please try again in a moment.');
    }
  };

  // --- Your Existing Functions ---
  const fetchVideoTasks = async (): Promise<void> => {
    try {
      const response = await apiCall<VideoTask[]>('/video-tasks/');
      setVideoTasks(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load video tasks');
      console.error('Failed to fetch video tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVideoTask = async (task: VideoTask): Promise<void> => {
    try {
      const response = await apiCall<VideoWatchSession>('/start-video-session/', {
        method: 'POST',
        data: { task_id: task.id },
      });
      setSession(response.data);
      setCurrentTask(task);
      setVideoCompleted(false);
      setQuizSubmitted(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to start video task');
    }
  };

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleVideoEnd = async (): Promise<void> => {
    if (!videoCompleted && session) {
      try {
        await apiCall(`/complete-video-session/${session.id}/`, { method: 'POST' });
        setVideoCompleted(true);
        Alert.alert('Great!', 'Video completed! Now answer the quiz questions below.');
      } catch (error) {
        Alert.alert('Error', 'Failed to complete video session');
      }
    }
  };

  const handleProgressUpdate = async (currentTime: number): Promise<void> => {
    if (session && currentTime > 0) {
      try {
        await apiCall(`/update-watch-progress/${session.id}/`, {
          method: 'PUT',
          data: { watch_duration: Math.floor(currentTime) },
        });
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  };

  const handleQuizSubmit = async (responses: UserResponse[]): Promise<void> => {
    if (!session) {
      Alert.alert('Error', 'No active video session');
      return;
    }
    setSubmittingQuiz(true);
    try {
      const response = await apiCall<QuizResult>('/submit-quiz-responses/', {
        method: 'POST',
        data: { session_id: session.id, responses: responses },
      });
      const result = response.data;
      setQuizSubmitted(true);
      Alert.alert(
        'Task Complete! 🎉',
        `Score: ${result.quiz_score}%\nCorrect: ${result.correct_answers}/${result.total_questions}\nPoints Earned: ${result.total_points_awarded}`,
        [{ text: 'Continue', onPress: () => goBackToTaskList() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quiz responses');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const goBackToTaskList = () => {
    setCurrentTask(null);
    setSession(null);
    setVideoCompleted(false);
    setQuizSubmitted(false);
  };
  
  // --- Your Existing Render Logic ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading video tasks...</Text>
      </View>
    );
  }

  if (currentTask) {
    const videoId = extractVideoId(currentTask.youtube_url);
    return (
      <ScrollView style={styles.container}>
        <View style={styles.taskHeader}>
          <TouchableOpacity style={styles.backButton} onPress={goBackToTaskList}>
            <Text style={styles.backButtonText}>← Back to Tasks</Text>
          </TouchableOpacity>
          <Text style={styles.taskTitle}>{currentTask.title}</Text>
          <Text style={styles.taskDescription}>{currentTask.description}</Text>
        </View>
        {videoId && (
          <YouTubeVideoPlayer
            videoId={videoId}
            onVideoEnd={handleVideoEnd}
            onProgressUpdate={handleProgressUpdate}
            height={250}
          />
        )}
        {videoCompleted && !quizSubmitted && (
          <VideoQuiz
            questions={currentTask.questions}
            onSubmit={handleQuizSubmit}
            loading={submittingQuiz}
          />
        )}
        {quizSubmitted && (
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>Task Completed! 🎉</Text>
            <TouchableOpacity style={styles.continueButton} onPress={goBackToTaskList}>
              <Text style={styles.continueButtonText}>Choose Another Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Video Tasks</Text>
        <Text style={styles.subtitle}>Choose a video task to complete and earn points!</Text>
        
        {/* --- AdMob: New Card for Showing the Rewarded Ad --- */}
        <TouchableOpacity 
          style={[styles.taskCard, !rewardedAdLoaded && styles.disabledCard]}
          onPress={showRewardedAd}
          disabled={!rewardedAdLoaded}
        >
          <Text style={styles.taskCardTitle}>💎 Watch a Quick Ad</Text>
          <Text style={styles.taskCardDescription}>Watch a short video ad to earn instant points.</Text>
          <Text style={styles.taskCardQuestions}>
            {rewardedAdLoaded ? 'Ready to watch!' : 'Loading ad...'}
          </Text>
        </TouchableOpacity>
        
        {videoTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No video tasks available</Text>
          </View>
        ) : (
          videoTasks.map((task) => (
            <TouchableOpacity 
              key={task.id}
              style={styles.taskCard}
              onPress={() => startVideoTask(task)}
            >
              <Text style={styles.taskCardTitle}>📹 {task.title}</Text>
              <Text style={styles.taskCardDescription}>{task.description}</Text>
              <Text style={styles.taskCardQuestions}>
                {task.questions.length} quiz questions
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>• Select a video task from the list</Text>
          <Text style={styles.infoText}>• Watch the YouTube video completely</Text>
          <Text style={styles.infoText}>• Answer quiz questions after watching</Text>
          <Text style={styles.infoText}>• Earn points for completion + bonus for correct answers</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  infoContainer: {
    backgroundColor: '#ecf0f1',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#34495e',
    lineHeight: 20,
  },
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
  // --- AdMob: New Style ---
  disabledCard: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
});

export default HomeScreen;