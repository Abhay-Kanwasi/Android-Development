// src/types/bitlabs.ts

export interface Survey {
  id: string;
  name: string;
  reward: number;
  duration: number;
  category: string;
  rating: number;
  conversion_level: 'easy' | 'medium' | 'hard';
}

export interface SurveysResponse {
  surveys: Survey[];
  user_balance: number;
  total_earnings: number;
}

export interface StartSurveyResponse {
  survey_url: string;
  click_id: string;
}

export interface UserProfile {
  username: string;
  available_balance: number;
  total_earnings: number;
}

export interface SurveyCompletion {
  survey_id: string;
  status: 'pending' | 'completed' | 'rejected' | 'quota_full';
  reward_amount: number;
  started_at: string;
  completed_at: string | null;
}

export interface Transaction {
  type: 'survey_reward' | 'withdrawal' | 'bonus';
  amount: number;
  description: string;
  created_at: string;
}

export interface DashboardResponse {
  user_profile: UserProfile;
  recent_completions: SurveyCompletion[];
  recent_transactions: Transaction[];
}

export interface SurveyCardProps {
  survey: Survey;
  onStartSurvey: (surveyId: string) => void;
  isLoading: boolean;
}
