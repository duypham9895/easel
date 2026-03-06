export type UserRole = 'moon' | 'sun' | null;

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface SOSOption {
  id: string;
  title: string;
  icon: string; // Feather icon name
  color: string;
  description: string;
}

export interface CycleSettings {
  avgCycleLength: number;
  avgPeriodLength: number;
  lastPeriodStartDate: string; // ISO date YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Database row types — mirror the Supabase schema exactly
// ---------------------------------------------------------------------------

export interface DbProfile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCouple {
  id: string;
  girlfriend_id: string;
  boyfriend_id: string | null;
  link_code: string | null;
  link_code_expires_at: string | null;
  status: 'pending' | 'linked';
  created_at: string;
  linked_at: string | null;
}

export interface DbCycleSettings {
  id: string;
  user_id: string;
  avg_cycle_length: number;
  avg_period_length: number;
  last_period_start_date: string;
  created_at: string;
  updated_at: string;
}

export interface DbPeriodLog {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface DbDailyLog {
  id: string;
  user_id: string;
  log_date: string;
  mood: number | null;       // 1–5
  energy: number | null;     // 1–5
  symptoms: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSOSSignal {
  id: string;
  couple_id: string;
  sender_id: string;
  type: 'sweet_tooth' | 'need_a_hug' | 'cramps_alert' | 'quiet_time';
  message: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface DbUserPreferences {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  sos_notifications_enabled: boolean;
  ai_greetings_enabled: boolean;
  proxy_url: string | null;
  ai_model: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  periodApproaching: boolean;
  periodStarted: boolean;
  periodEnded: boolean;
  whisperAlerts: boolean;
  useAiTiming: boolean;
  manualDaysBefore: number;
}

export interface CyclePrediction {
  predictedDate: string;
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  notifyDaysBefore: number;
}
