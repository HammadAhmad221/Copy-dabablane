import { adminApiClient as apiClient } from '../client';
import BACK_NOTIFICATION_ENDPOINTS from '../endpoints/notification';
import { NotificationResponse, NotificationApiResponse } from '../types/notification';

class NotificationService {
  async getNotifications(page: number = 1) {
    const response = await apiClient.get<NotificationResponse>(
      `${BACK_NOTIFICATION_ENDPOINTS.GET_ALL()}`,
      {
        params: { page }
      }
    );
    return response.data;
  }

  async markAsRead(id: string) {
    const response = await apiClient.post<NotificationApiResponse>(
      BACK_NOTIFICATION_ENDPOINTS.MARK_AS_READ(id)
    );
    return response.data;
  }

  async markAllAsRead() {
    const response = await apiClient.post<NotificationApiResponse>(
      BACK_NOTIFICATION_ENDPOINTS.MARK_ALL_AS_READ
    );
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await apiClient.delete<NotificationApiResponse>(
      BACK_NOTIFICATION_ENDPOINTS.DELETE(id)
    );
    return response.data;
  }

  async deleteAllNotifications() {
    const response = await apiClient.delete<NotificationApiResponse>(
      BACK_NOTIFICATION_ENDPOINTS.DELETE_ALL
    );
    return response.data;
  }

  async checkExpiration() {
    const response = await apiClient.post<NotificationApiResponse>(
      BACK_NOTIFICATION_ENDPOINTS.CHECK_EXPIRATION
    );
    return response.data;
  }
}

export const notificationService = new NotificationService(); 