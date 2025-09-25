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
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);

  const transformApiNotification = (apiNotification: ApiNotification): Notification => {
    return {
      id: apiNotification.id,
      message: apiNotification.data.message || 'Notification',
      read: !!apiNotification.read_at,
      date: apiNotification.created_at,
      type: 'info' // You can map this based on notification type if needed
    };
  };

  const fetchNotifications = useCallback(async (pageNum: number = 1) => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications(pageNum);
      const paginatedData = response.data;
      const transformedNotifications = paginatedData.data.map(transformApiNotification);
      
      if (pageNum === 1) {
        setNotifications(transformedNotifications);
      } else {
        setNotifications(prev => [...prev, ...transformedNotifications]);
      }
      
      setUnreadCount(transformedNotifications.filter(n => !n.read).length);
      setHasMore(paginatedData.next_page_url !== null);
    } catch (error) {
      toast.error('Failed to fetch notifications');
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const refresh = useCallback(async () => {
    await fetchNotifications(1);
    toast.success('Notifications refreshed');
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      const wasUnread = notifications.find(n => n.id === id && !n.read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  const deleteAll = useCallback(async () => {
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications deleted');
    } catch (error) {
      toast.error('Failed to delete all notifications');
      console.error('Error deleting all notifications:', error);
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