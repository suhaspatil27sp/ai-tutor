export interface User {
  user_id: string;
  email?: string;
  auth_provider?: 'email' | 'google';
  provider_user_id?: string;
  last_login_at?: string;
  username?: string;
  first_name: string;
  last_name?: string;
  age?: number;
  grade_level?: number;
  education_board?: 'CBSE' | 'ICSE' | 'IB' | 'STATE_BOARD' | 'OTHER';
  preferred_language?: string;
  timezone?: string;
  facts_opt_in?: boolean;
  is_active?: boolean;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  last_active_at?: string;
}

export interface Session {
  session_id: string;
  user_id: string;
  is_active?: boolean;
  current_concept?: string;
  concepts_covered?: string[];
  device_info?: string;
  started_at?: string;
  last_message_at?: string;
  auto_extended_count?: number;
  session_timeout_hours?: number;
  ended_at?: string | null;
  end_reason?: 'timeout' | 'explicit' | 'inactivity' | 'system' | 'manual' | 'user_ended' | 'goal_achieved' | null;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  message_id: string;
  session_id: string;
  user_id: string;
  sender_type: 'user' | 'bot';
  message_text: string;
  intent?: string;
  temp_id?: string;
  status?: 'sent' | 'failed';
  is_meaningful?: boolean;
  token_count?: number;
  sent_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  tempId?: string;
}

export interface OnboardingData {
  first_name: string;
  last_name?: string;
  age: number;
  grade_level: number;
  education_board: 'CBSE' | 'ICSE' | 'IB' | 'STATE_BOARD' | 'OTHER';
  email?: string;
}