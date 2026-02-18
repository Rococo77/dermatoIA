export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Diagnosis {
  id: string;
  lesion_type: string;
  lesion_type_confidence: number;
  severity_level: SeverityLevel;
  severity_confidence: number;
  recommendation: string;
  requires_hospital: boolean;
  model_version: string;
  image_path: string;
  created_at: string;
}

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DiagnosisListResponse {
  items: Diagnosis[];
  total: number;
  page: number;
  limit: number;
}

export interface DiagnosisStats {
  total_diagnoses: number;
  by_lesion_type: Record<string, number>;
  by_severity: Record<string, number>;
  hospital_required_count: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  notification_type: string;
  diagnosis_id: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
}
