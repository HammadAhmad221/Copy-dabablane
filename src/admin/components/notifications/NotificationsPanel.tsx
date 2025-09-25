import React from 'react';
import { Notification } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onDeleteAll: () => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onMarkAllRead,
  onMarkAsRead,
  onDeleteNotification,
  onDeleteAll,
  onLoadMore,
  onRefresh,
  hasMore,
  isLoading
}) => {
  return (
    <div className="notifications-panel">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-medium">Notifications</h3>
        <div className="flex space-x-2">
          <button 
            onClick={onRefresh}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Refresh
          </button>
          <button 
            onClick={onMarkAllRead}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Mark all as read
          </button>
          <button 
            onClick={onDeleteAll}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Clear all
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li 
                key={notification.id} 
                className={`p-3 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between">
                  <div>
                    <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <button 
                        onClick={() => onMarkAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark read
                      </button>
                    )}
                    <button 
                      onClick={() => onDeleteNotification(notification.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {hasMore && (
        <div className="p-2 text-center border-t">
          <button 
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;