import { adminApiClient as apiClient } from '../client';
import BACK_RATING_ENDPOINTS from '../endpoints/rating';
import { RatingType, RatingFormData } from '../types/ratings';
import { ApiResponse } from '../types/api';

export const ratingApi = {
  async getRatings() {
    const response = await apiClient.get<ApiResponse<RatingType[]>>(
      BACK_RATING_ENDPOINTS.getAllRatings()
    );
    return response.data.data;
  },

  async getRating(id: string) {
    const response = await apiClient.get<ApiResponse<RatingType>>(
      BACK_RATING_ENDPOINTS.getRatingById(id)
    );
    return response.data.data;
  },

  async createRating(data: RatingFormData) {
    const response = await apiClient.post<ApiResponse<RatingType>>(
      BACK_RATING_ENDPOINTS.createRating(),
      data
    );
    return response.data.data;
  },

  async updateRating(id: string, data: Partial<RatingFormData>) {
    const response = await apiClient.put<ApiResponse<RatingType>>(
      BACK_RATING_ENDPOINTS.updateRating(id),
      data
    );
    return response.data.data;
  },

  async deleteRating(id: string) {
    await apiClient.delete<ApiResponse<void>>(
      BACK_RATING_ENDPOINTS.deleteRating(id)
    );
  },

  async markAsFlagged(id: string) {
    const response = await apiClient.post<ApiResponse<RatingType>>(
      BACK_RATING_ENDPOINTS.markAsFlagged(id)
    );
    return response.data.data;
  },

  async unmarkAsFlagged(id: string) {
    const response = await apiClient.post<ApiResponse<RatingType>>(
      BACK_RATING_ENDPOINTS.unmarkAsFlagged(id)
    );
    return response.data.data;
  }
};