import { BACK_AUTH_ENDPOINTS } from '../endpoints/autho';
import { adminApiClient as apiClient } from '../client';
import { adminGuestApiClient as apiGuest } from '../client';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiGuest.post(BACK_AUTH_ENDPOINTS.login(), data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterRequest> => {
    const response = await apiGuest.post(BACK_AUTH_ENDPOINTS.register(), data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(BACK_AUTH_ENDPOINTS.logout());
  }
};
