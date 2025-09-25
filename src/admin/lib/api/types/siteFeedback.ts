export interface SiteFeedback {
    id: string;
    user_id: string;
    feedback: string;
    created_at: string | null;
    updated_at: string | null;
  }
export interface SiteFeedbackFormData {
    user_id: string;
    feedback: string;
    updated_at: string | null;
  }