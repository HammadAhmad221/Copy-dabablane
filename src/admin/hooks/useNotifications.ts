import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { notificationService } from '../lib/api/services';
import { Notification as ApiNotification, NotificationResponse } from '../lib/api/types/notification';

// Mock notification type
export interface Notification {
  id: string;
  message: string;
  read: boolean;
  date: string;
  type: 'info' | 'warning' | 'error' | 'success';
  vendorId?: number;
  vendorName?: string;
  originalData?: any;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);

  const transformApiNotification = (apiNotification: ApiNotification): Notification => {
    console.log('[Notifications] Transforming notification:', apiNotification);
    try {
      const message = apiNotification?.data?.message || 
                     (typeof apiNotification?.data === 'string' ? apiNotification.data : 'Notification') ||
                     'Notification';
      
      // Extract vendor information from notification data
      let vendorId: number | undefined;
      let vendorName: string | undefined;
      
      // Check if data is an object with vendor information
      if (apiNotification?.data && typeof apiNotification.data === 'object' && !Array.isArray(apiNotification.data)) {
        const data = apiNotification.data as any;
        vendorId = data.vendor_id || data.vendorId;
        vendorName = data.vendor_name || data.vendorName;
      }
      
      // If vendor info not in data, try to parse from message
      // Pattern 1: "Un nouveau vendeur "vendorName" vient de s'inscrire."
      // Pattern 2: Any quoted text after "vendeur"
      if (!vendorName && message) {
        // First try: look for quoted text after "vendeur"
        const vendeurMatch = message.match(/vendeur\s+"([^"]+)"/i);
        if (vendeurMatch) {
          vendorName = vendeurMatch[1];
        } else {
          // Fallback: look for any quoted text in the message
          const vendorMatch = message.match(/"([^"]+)"/);
          if (vendorMatch) {
            vendorName = vendorMatch[1];
          }
        }
      }
      
      return {
        id: apiNotification.id || String(apiNotification.id),
        message: message,
        read: !!apiNotification.read_at,
        date: apiNotification.created_at || new Date().toISOString(),
        type: 'info', // You can map this based on notification type if needed
        vendorId,
        vendorName,
        originalData: apiNotification.data
      };
    } catch (error) {
      console.error('[Notifications] Error transforming notification:', error, apiNotification);
      return {
        id: String(apiNotification?.id || Math.random()),
        message: 'Invalid notification',
        read: true,
        date: new Date().toISOString(),
        type: 'error'
      };
    }
  };

  const fetchNotifications = useCallback(async (pageNum: number = 1) => {
    try {
      setIsLoading(true);
      console.log('[Notifications] Fetching notifications, page:', pageNum);
      const response = await notificationService.getNotifications(pageNum);
      console.log('[Notifications] API Response:', response);
      console.log('[Notifications] Response.data:', response.data);
      
      // Based on the API response structure: {status: 'success', data: {current_page: 1, data: [], ...}}
      // response.data is the pagination object
      const paginatedData = response.data;
      
      // The notifications array is at paginatedData.data
      const notificationsArray = Array.isArray(paginatedData?.data) ? paginatedData.data : [];
      
      console.log('[Notifications] Notifications array:', notificationsArray);
      console.log('[Notifications] Notifications array length:', notificationsArray.length);
      console.log('[Notifications] Total in pagination:', paginatedData?.total || 0);
      
      const transformedNotifications = notificationsArray.map(transformApiNotification);
      console.log('[Notifications] Transformed notifications:', transformedNotifications);
      
      if (pageNum === 1) {
        setNotifications(transformedNotifications);
      } else {
        setNotifications(prev => [...prev, ...transformedNotifications]);
      }
      
      // Check for pagination - next_page_url is in the pagination object
      const nextPageUrl = paginatedData?.next_page_url;
      setHasMore(nextPageUrl !== null && nextPageUrl !== undefined);
      console.log('[Notifications] Has more pages?', nextPageUrl !== null && nextPageUrl !== undefined, 'Next page URL:', nextPageUrl);
    } catch (error: any) {
      console.error('[Notifications] Error fetching notifications:', error);
      console.error('[Notifications] Error response:', error?.response?.data);
      console.error('[Notifications] Error status:', error?.response?.status);
      toast.error(`Failed to fetch notifications: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
    console.log('[Notifications] Unread count updated:', count, 'Total notifications:', notifications.length);
  }, [notifications]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const refresh = useCallback(async () => {
    await fetchNotifications(1);
    toast.success('Notifications refreshed');
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      console.log('[Notifications] Marking notification as read:', id);
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      toast.success('Notification marked as read');
    } catch (error: any) {
      console.error('[Notifications] Error marking as read:', error);
      toast.error(`Failed to mark notification as read: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      console.log('[Notifications] Marking all notifications as read');
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error: any) {
      console.error('[Notifications] Error marking all as read:', error);
      toast.error(`Failed to mark all notifications as read: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      console.log('[Notifications] Deleting notification:', id);
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      toast.success('Notification deleted');
    } catch (error: any) {
      console.error('[Notifications] Error deleting notification:', error);
      toast.error(`Failed to delete notification: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
    }
  }, []);

  const deleteAll = useCallback(async () => {
    try {
      console.log('[Notifications] Deleting all notifications');
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      toast.success('All notifications deleted');
    } catch (error: any) {
      console.error('[Notifications] Error deleting all notifications:', error);
      toast.error(`Failed to delete all notifications: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchNotifications(nextPage);
  }, [hasMore, isLoading, page, fetchNotifications]);

  return {
    notifications,
    hasMore,
    isLoading,
    unreadCount,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    loadMore
  };
}; 