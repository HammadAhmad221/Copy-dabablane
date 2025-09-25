export interface ContactFormData {
  fullName: string;
  email: string;
  phone?: string;
  type?: 'client' | 'commercant';
  subject: string;
  message: string;
  privacy?: boolean;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
    type?: string;
    subject: string;
    message: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  errors?: Record<string, string[]>;
} 