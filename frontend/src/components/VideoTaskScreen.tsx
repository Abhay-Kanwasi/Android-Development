// src/components/VideoTaskScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import YouTubeVideoPlayer from './YouTubePlayer';
import VideoQuiz from './VideoQuiz';
import { apiCall } from '../services/api';
import { VideoTask, VideoWatchSession, UserResponse, QuizResult } from '../types/video';

// Navigation types
type RootStackParamList = {
  VideoTask: { taskId: number };
};

type VideoTaskScreenRouteProp = RouteProp<RootStackParamList, 'VideoTask'>;
type VideoTaskScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const VideoTaskScreen: React.FC = () => {
  const route = useRoute<VideoTaskScreenRouteProp>();
  const navigation = useNavigation<VideoTaskScreenNavigationProp>();
  const { taskId } = route.params;

  const [task, setTask] = useState<VideoTask | null>(null);
  const [session, setSession] = useState<VideoWatchSession | null>(null);
  const [videoCompleted, setVideoCompleted] = useState<boolean>(false);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingQuiz, setSubmittingQuiz] = useState<boolean>(false);

  useEffect(() => {
    loadTask();
    startVideoSession();
  }, [taskId]);

  const loadTask = async (): Promise<void> => {
    try {
      const response = await apiCall<VideoTask>(`/video-tasks/${taskId}/`);
      setTask(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load video task');
    } finally {
      setLoading(false);
    }
  };

  const startVideoSession = async (): Promise<void> => {
    try {
      const response = await apiCall<VideoWatchSession>('/start-video-session/', {
        method: 'POST',
        data: { task_id: taskId }
      });
      setSession(response.data);
    } catch (error) {
      console.error('Failed to start video session:', error);
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
        await apiCall(`/complete-video-session/${session.id}/`, {
          method: 'POST'
        });
        setVideoCompleted(true);
        Alert.alert('Great!', 'Video completed! Now answer the quiz questions.');
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
          data: { watch_duration: Math.floor(currentTime) }
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
        data: {
          session_id: session.id,
          responses: responses
        }
      });

      const result = response.data;
      setQuizSubmitted(true);
      
      Alert.alert(
        'Quiz Complete!', 
        `Score: ${result.quiz_score}%\nCorrect: ${result.correct_answers}/${result.total_questions}\nPoints Earned: ${result.total_points_awarded}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quiz responses');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text>Task not found</Text>
      </View>
    );
  }

  const videoId = extractVideoId(task.youtube_url);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.description}>{task.description}</Text>
      
      {videoId && (
        <YouTubeVideoPlayer
          videoId={videoId}
          onVideoEnd={handleVideoEnd}
          onProgressUpdate={handleProgressUpdate}
          height={250}
        />
      )}

      {videoCompleted && !quizSubmitted && task.questions && task.questions.length > 0 && (
        <VideoQuiz
          questions={task.questions}
          onSubmit={handleQuizSubmit}
          loading={submittingQuiz}
        />
      )}

      {quizSubmitted && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>Task Completed! 🎉</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  completedContainer: {
    padding: 32,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'green',
  },
});

export default VideoTaskScreen;