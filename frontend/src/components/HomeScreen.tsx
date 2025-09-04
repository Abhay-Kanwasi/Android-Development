import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import YouTubeVideoPlayer from './YouTubePlayer';
import VideoQuiz from './VideoQuiz';
import TaskCard from './TaskCard';
import TaskHeader from './TaskHeader';
import LoadingScreen from './LoadingScreen';
import CompletedTaskView from './CompletedTaskView';
import InfoSection from './InfoSection';
import EmptyState from './EmptyState';
import { VideoTask, VideoWatchSession, UserResponse, QuizResult } from '../types/video';
import { apiCall } from '../services/api';
import { RewardedAd, InterstitialAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';

// --- Type Definitions ---
interface AdPlacement {
  is_enabled: boolean;
  points_reward: number;
  ad_unit_id: string;
}
interface AllPlacements {
  [key: string]: AdPlacement;
}
type RootStackParamList = {
  Home: undefined;
  VideoTask: { taskId: number };
};
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  // --- State for Video Tasks ---
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTask, setCurrentTask] = useState<VideoTask | null>(null);
  const [session, setSession] = useState<VideoWatchSession | null>(null);
  const [videoCompleted, setVideoCompleted] = useState<boolean>(false);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [submittingQuiz, setSubmittingQuiz] = useState<boolean>(false);
  
  // --- State for Dynamic Ad System ---
  const [adPlacements, setAdPlacements] = useState<AllPlacements | null>(null);
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [interstitialAd, setInterstitialAd] = useState<InterstitialAd | null>(null);
  const [interstitialAdLoaded, setInterstitialAdLoaded] = useState(false);
  const [settingsError, setSettingsError] = useState(false);

  useEffect(() => {
    fetchVideoTasks();
    fetchAdPlacements();
  }, []);
  
  useEffect(() => {
    if (!adPlacements) return;

    // --- Load Rewarded Ad ---
    const rewardedPlacement = adPlacements['home_screen_rewarded'];
    if (rewardedPlacement?.is_enabled && rewardedPlacement.ad_unit_id) {
      const ad = RewardedAd.createForAdRequest(rewardedPlacement.ad_unit_id);
      const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => setAdLoaded(true));
      const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => awardAdPoints());
      const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => { setAdLoaded(false); ad.load(); });
      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => console.error('[Ad System] Rewarded Ad failed:', error));
      ad.load();
      setRewardedAd(ad);
    }

    // --- Load Interstitial Ad ---
    const interstitialPlacement = adPlacements['start_video_interstitial'];
    if (interstitialPlacement?.is_enabled && interstitialPlacement.ad_unit_id) {
      const ad = InterstitialAd.createForAdRequest(interstitialPlacement.ad_unit_id);
      const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => setInterstitialAdLoaded(true));
      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => console.error('[Ad System] Interstitial Ad failed:', error));
      ad.load();
      setInterstitialAd(ad);
    }
  }, [adPlacements]);

  const fetchAdPlacements = async () => {
    try {
      setSettingsError(false);
      const response = await apiCall<{ data: AllPlacements }>('/api/ad-placements/');
      setAdPlacements(response.data);
    } catch (error) {
      console.error('Failed to fetch ad placements:', error);
      setSettingsError(true);
    }
  };

  const awardAdPoints = async () => {
    const pointsToAward = adPlacements?.['home_screen_rewarded']?.points_reward;
    if (!pointsToAward) return;
    
    Alert.alert('Reward Earned!', `You've earned ${pointsToAward} points.`);
    try {
      await apiCall('/api/award-ad-points/', { method: 'POST', data: { points: pointsToAward } });
    } catch (error) {
      Alert.alert('Sync Error', 'Could not save your points.');
    }
  };
  
  const showRewardedAd = () => {
    if (rewardedAd && adLoaded) rewardedAd.show();
  };

  const showInterstitialAndStartTask = (task: VideoTask) => {
    if (interstitialAd && interstitialAdLoaded) {
      const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        unsubscribeClosed();
        startVideoTask(task);
        interstitialAd.load(); // Pre-load the next one
      });
      interstitialAd.show();
    } else {
      // If ad isn't ready, go straight to the task
      startVideoTask(task);
    }
  };

  const fetchVideoTasks = async (): Promise<void> => {
    try {
      const response = await apiCall<{ data: VideoTask[] }>('/api/video-tasks/');
      setVideoTasks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch video tasks:', error);
      setVideoTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const startVideoTask = async (task: VideoTask): Promise<void> => {
    try {
      const response = await apiCall<VideoWatchSession>('/api/start-video-session/', {
        method: 'POST', data: { task_id: task.id },
      });
      console.log("session : ", response)
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
        await apiCall(`/api/complete-video-session/${session.id}/`, { method: 'POST' });
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
        await apiCall(`/api/update-watch-progress/${session.id}/`, {
          method: 'PUT',
          data: { watch_duration: Math.floor(currentTime) },
        });
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  };

  const handleQuizSubmit = async (responses: UserResponse[]): Promise<void> => {
    if (!session) return;
    setSubmittingQuiz(true);
    try {
      const result = await apiCall<QuizResult>('/api/submit-quiz-responses/', {
        method: 'POST',
        data: { session_id: session.id, responses: responses },
      });
      setQuizSubmitted(true);
      console.log("quiz submit", result)
      Alert.alert(
        'Task Complete! 🎉',
        `Score: ${result.data.quiz_score}%\nCorrect: ${result.data.correct_answers}/${result.data.total_questions}\nPoints Earned: ${result.data.total_points_awarded}`,
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
  
  if (loading) {
    return <LoadingScreen message="Loading tasks..." />;
  }

  if (currentTask) {
    const videoId = extractVideoId(currentTask.youtube_url);
    return (
      <ScrollView style={styles.container}>
        <TaskHeader 
          title={currentTask.title}
          description={currentTask.description}
          onBackPress={goBackToTaskList}
        />
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
          <CompletedTaskView onContinue={goBackToTaskList} />
        )}
      </ScrollView>
    );
  }

  const rewardedPlacement = adPlacements?.['home_screen_rewarded'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Available Tasks</Text>
        <Text style={styles.subtitle}>Choose a task to complete and earn points!</Text>
        
        {settingsError ? (
          <TaskCard
            title="⚠️ Ads Not Available"
            description="Could not load ad settings. Please try again later."
            footerText=""
            onPress={() => {}}
            variant="error"
          />
        ) : rewardedPlacement?.is_enabled && (
          <TaskCard
            title="💎 Watch a Quick Ad"
            description={`Watch a short video ad to earn ${rewardedPlacement.points_reward} points.`}
            footerText={adLoaded ? 'Ready to watch!' : 'Loading ad...'}
            onPress={showRewardedAd}
            disabled={!adLoaded}
            variant="ad"
          />
        )}
        
        {videoTasks.length === 0 ? (
          <EmptyState message="No video tasks available" />
        ) : (
          videoTasks.map((task) => (
            <TaskCard
              key={task.id}
              title={`📹 ${task.title}`}
              description={task.description}
              footerText={`${task.questions.length} quiz questions`}
              onPress={() => showInterstitialAndStartTask(task)}
            />
          ))
        )}
        
        <InfoSection 
          title="How it works:"
          items={[
            'Select a video task from the list',
            'Watch the YouTube video completely',
            'Answer quiz questions after watching',
            'Earn points for completion + bonus for correct answers'
          ]}
        />
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
});

export default HomeScreen;