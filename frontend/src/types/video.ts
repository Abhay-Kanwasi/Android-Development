// src/types/video.ts
export interface QuizQuestion {
  id: number;
  question_text: string;
}

export interface VideoTask {
  id: number;
  youtube_url: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface VideoWatchSession {
  id: number;
  task: number;
  started_at: string;
  completed_at?: string;
  watch_duration: number;
  is_completed: boolean;
  points_awarded: number;
}

export interface UserResponse {
  question: number;
  user_answer: string;
}

export interface QuizResult {
  quiz_score: number;
  correct_answers: number;
  total_questions: number;
  bonus_points: number;
  total_points_awarded: number;
}