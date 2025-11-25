import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  onClose?: () => void;
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
  isLoading,
  onClose
}) => {
  const navigate = useNavigate();

  // Handle vendor click - navigate and close popover
  const handleVendorClick = (vendorId?: number, vendorName?: string) => {
    console.log('🔗 Vendor click:', { vendorId, vendorName });
    
    // Close the popover first
    if (onClose) {
      onClose();
    }
    
    // Small delay to ensure popover closes smoothly
    setTimeout(() => {
      if (vendorId) {
        // Always prefer vendorId when available - more reliable
        // Also pass vendorName as fallback in case vendorId lookup fails
        const params = new URLSearchParams();
        params.set('vendorId', String(vendorId));
        if (vendorName) {
          params.set('vendorName', vendorName);
        }
        console.log(`🔗 Navigating to vendor by ID: ${vendorId}${vendorName ? ` (name: "${vendorName}")` : ''}`);
        navigate(`/admin/vendors?${params.toString()}`);
      } else if (vendorName) {
        // Fallback to name search if no ID available
        console.log(`🔗 Navigating to vendor by name: "${vendorName}"`);
        navigate(`/admin/vendors?search=${encodeURIComponent(vendorName)}`);
      } else {
        console.log('🔗 No vendor info, navigating to vendors page');
        navigate('/admin/vendors');
      }
    }, 100);
  };

  // Handle blane click - navigate to blane page
  const handleBlaneClick = (blaneId?: number, blaneName?: string) => {
    console.log('🔗 Blane click:', { blaneId, blaneName });
    
    // Close the popover first
    if (onClose) {
      onClose();
    }
    
    // Navigate immediately - no delay needed
    if (blaneId) {
      console.log(`🔗 Navigating to blane by ID: ${blaneId}${blaneName ? ` (name: "${blaneName}")` : ''}`);
      // Navigate to blanes page with search/filter for the specific blane
      const params = new URLSearchParams();
      params.set('blaneId', String(blaneId));
      if (blaneName) {
        params.set('search', blaneName);
      }
      const url = `/admin/blanes?${params.toString()}`;
      console.log(`🔗 Navigation URL: ${url}`);
      navigate(url);
    } else if (blaneName) {
      // Fallback to name search if no ID available
      console.log(`🔗 Navigating to blane by name: "${blaneName}"`);
      const url = `/admin/blanes?search=${encodeURIComponent(blaneName)}`;
      console.log(`🔗 Navigation URL: ${url}`);
      navigate(url);
    } else {
      console.log('🔗 No blane info, navigating to blanes page');
      navigate('/admin/blanes');
    }
  };

  // Handle notification click - redirect based on notification type
  const handleNotificationClick = (notification: Notification, e?: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if (e) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return;
      }
    }

    // Check if notification is for a blane first (prioritize blane over vendor)
    // Blane notifications are about blanes being created, so they should go to blane page
    if (notification.blaneId || notification.blaneName) {
      console.log('🔗 Blane notification clicked:', { blaneId: notification.blaneId, blaneName: notification.blaneName });
      handleBlaneClick(notification.blaneId, notification.blaneName);
      return;
    }

    // Check if notification is for a vendor
    if (notification.vendorId || notification.vendorName) {
      console.log('🔗 Vendor notification clicked:', { vendorId: notification.vendorId, vendorName: notification.vendorName });
      handleVendorClick(notification.vendorId, notification.vendorName);
      return;
    }

    // Default: no navigation if no specific entity is associated
    console.log('🔗 Notification clicked but no vendor or blane info available');
  };

  // Function to parse and render message with clickable vendor names
  const renderMessage = (notification: Notification) => {
    const { message, vendorId, vendorName } = notification;
    
    // Improved vendor name detection - try multiple patterns
    let extractedVendorName: string | undefined = vendorName;
    let vendorMatch: RegExpMatchArray | null = null;
    
    // First, check if we have vendor info from the hook
    if (!extractedVendorName) {
      // Try to parse vendor name from message pattern
      // Pattern 1: "Un nouveau vendeur "vendorName" vient de s'inscrire."
      vendorMatch = message.match(/"([^"]+)"/);
      if (vendorMatch) {
        extractedVendorName = vendorMatch[1];
      } else {
        // Pattern 2: Try to find quoted text that might be a vendor name
        // Look for text in quotes that appears after "vendeur"
        const vendeurMatch = message.match(/vendeur\s+"([^"]+)"/i);
        if (vendeurMatch) {
          extractedVendorName = vendeurMatch[1];
          vendorMatch = vendeurMatch;
        }
      }
    }
    
    // If we have vendor information, make the vendor name clickable
    if (extractedVendorName) {
      // Try to find the vendor name in the message (could be in quotes or as part of the text)
      const vendorNameEscaped = extractedVendorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match with or without quotes, case insensitive
      const regex = new RegExp(`("?${vendorNameEscaped}"?)`, 'gi');
      const parts = message.split(regex);
      
      // If split didn't work well, try the original vendorMatch
      if (parts.length === 1 && vendorMatch) {
        const matchText = vendorMatch[0];
        const parts2 = message.split(matchText);
        
        return (
          <span className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
            {parts2[0]}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVendorClick(vendorId, extractedVendorName);
              }}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer inline"
              title={`View vendor: ${extractedVendorName}`}
            >
              {matchText}
            </button>
            {parts2[1]}
          </span>
        );
      }
      
      return (
        <span className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
          {parts.map((part, index) => {
            // Check if this part matches the vendor name (case-insensitive, with or without quotes)
            const partClean = part.toLowerCase().replace(/"/g, '').trim();
            const vendorNameClean = extractedVendorName.toLowerCase().trim();
            
            if (partClean === vendorNameClean || part.toLowerCase().includes(vendorNameClean)) {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleVendorClick(vendorId, extractedVendorName);
                  }}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer inline"
                  title={`View vendor: ${extractedVendorName}`}
                >
                  {part}
                </button>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </span>
      );
    }
    
    // Default: just render the message as-is
    return (
      <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
        {message}
      </p>
    );
  };

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
            {notifications.map((notification) => {
              // Check if notification is clickable (has vendor or blane info)
              const isClickable = !!(notification.vendorId || notification.vendorName || notification.blaneId || notification.blaneName);
              
              return (
              <li 
                key={notification.id} 
                className={`p-3 border-b ${isClickable ? 'cursor-pointer' : ''} hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={(e) => {
                  // Prevent click on the list item from interfering with button clicks
                  const target = e.target as HTMLElement;
                  if (target.tagName !== 'BUTTON' && !target.closest('button')) {
                    // Navigate if notification is clickable
                    if (isClickable) {
                      handleNotificationClick(notification, e);
                    }
                  }
                }}
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    {renderMessage(notification)}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    {!notification.read && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark read
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotification(notification.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
            })}
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