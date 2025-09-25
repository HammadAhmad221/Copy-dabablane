import { adminApiClient as apiClient } from '../client';
import BACK_SITE_FEEDBACK_ENDPOINTS from '../endpoints/siteFeedback';
import { SiteFeedback, SiteFeedbackFormData } from '../types/siteFeedback';
import { ApiResponse } from '../types/api';

export const siteFeedbackApi = {
  async getSiteFeedbacks() {
    const response = await apiClient.get<ApiResponse<SiteFeedback[]>>(
      BACK_SITE_FEEDBACK_ENDPOINTS.getAllSiteFeedback()
    );
    return response.data.data;
  },

  async getSiteFeedback(id: string) {
    const response = await apiClient.get<ApiResponse<SiteFeedback>>(
      BACK_SITE_FEEDBACK_ENDPOINTS.getSiteFeedbackById(id)
    );
    return response.data.data;
  },

  async createSiteFeedback(data: SiteFeedbackFormData) {
    const response = await apiClient.post<ApiResponse<SiteFeedback>>(
      BACK_SITE_FEEDBACK_ENDPOINTS.createSiteFeedback(),
      data
    );
    return response.data.data;
  },

  async updateSiteFeedback(id: string, data: SiteFeedbackFormData) {
    const response = await apiClient.put<ApiResponse<SiteFeedback>>(
      BACK_SITE_FEEDBACK_ENDPOINTS.updateSiteFeedback(id),
      data
    );
    return response.data.data;
  },

  async deleteSiteFeedback(id: string) {
    await apiClient.delete<ApiResponse<void>>(
      BACK_SITE_FEEDBACK_ENDPOINTS.deleteSiteFeedback(id)
    );
  }
};