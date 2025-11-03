import { adminApiClient as apiClient } from '../client';
import BACK_NOTIFICATION_ENDPOINTS from '../endpoints/notification';
import { NotificationResponse, NotificationApiResponse } from '../types/notification';

class NotificationService {
  async getNotifications(page: number = 1) {
    const url = BACK_NOTIFICATION_ENDPOINTS.GET_ALL();
    console.log('[NotificationService] Fetching notifications from:', url, 'Page:', page);
    try {
      const response = await apiClient.get<NotificationResponse>(
        url,
        {
          params: { page }
        }
      );
      console.log('[NotificationService] Response received:', response);
      console.log('[NotificationService] Response data:', response.data);
      console.log('[NotificationService] Full response structure:', JSON.stringify(response.data, null, 2));
      
      // Check the response structure
      if (response.data?.status === 'success' && response.data?.data) {
        // Response has wrapper: {status: 'success', data: {...}}
        console.log('[NotificationService] Response has status wrapper');
        const paginationData = response.data.data;
        console.log('[NotificationService] Pagination data:', paginationData);
        console.log('[NotificationService] Notifications array:', paginationData?.data);
        console.log('[NotificationService] Notifications count:', paginationData?.data?.length || 0);
        return response.data;
      } else if (response.data?.current_page !== undefined) {
        // Response is direct pagination object: {current_page: 1, data: [], ...}
        console.log('[NotificationService] Response is direct pagination object');
        console.log('[NotificationService] Notifications array:', response.data?.data);
        console.log('[NotificationService] Notifications count:', response.data?.data?.length || 0);
        // Wrap it in the expected structure
        return {
          status: 'success',
          data: response.data
        };
      } else {
        console.warn('[NotificationService] Unexpected response structure:', response.data);
        return response.data;
      }
    } catch (error: any) {
      console.error('[NotificationService] Error in getNotifications:', error);
      console.error('[NotificationService] Error URL:', error?.config?.url);
      console.error('[NotificationService] Error status:', error?.response?.status);
      console.error('[NotificationService] Error data:', error?.response?.data);
      throw error;
    }
  }

  async markAsRead(id: string) {
    console.log('[NotificationService] Marking as read:', id);
    const url = BACK_NOTIFICATION_ENDPOINTS.MARK_AS_READ(id);
    const response = await apiClient.post<NotificationApiResponse>(url);
    console.log('[NotificationService] Mark as read response:', response.data);
    return response.data;
  }

  async markAllAsRead() {
    console.log('[NotificationService] Marking all as read');
    const response = await apiClient.post<NotificationApiResponse>(
      BACK_NOTIFICATION_ENDPOINTS.MARK_ALL_AS_READ
    );
    console.log('[NotificationService] Mark all as read response:', response.data);
    return response.data;
  }

  async deleteNotification(id: string) {
    console.log('[NotificationService] Deleting notification:', id);
    const response = await apiClient.delete<NotificationApiResponse>(
      BACK_NOTIFICATION_ENDPOINTS.DELETE(id)
    );
    console.log('[NotificationService] Delete response:', response.data);
    return response.data;
  }

  async deleteAllNotifications() {
    console.log('[NotificationService] Deleting all notifications');
    const response = await apiClient.delete<NotificationApiResponse>(
      BACK_NOTIFICATION_ENDPOINTS.DELETE_ALL
    );
    console.log('[NotificationService] Delete all response:', response.data);
    return response.data;
  }

  async checkExpiration() {
    console.log('[NotificationService] Checking expiration');
    const response = await apiClient.post<NotificationApiResponse>(
      BACK_NOTIFICATION_ENDPOINTS.CHECK_EXPIRATION
    );
    console.log('[NotificationService] Check expiration response:', response.data);
    return response.data;
  }
}

export const notificationService = new NotificationService(); 