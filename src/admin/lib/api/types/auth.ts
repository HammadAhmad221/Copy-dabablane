export interface AuthResponse {
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      email_verified_at: string | null;
      created_at: string;
      updated_at: string;
      roles: string[];
    };
    roles: string[];
    token_type: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
} 