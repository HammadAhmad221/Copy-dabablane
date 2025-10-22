import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface ExpirationAlert {
  id: string;
  blaneId: number;
  blaneName: string;
  expirationTime: Date;
  read: boolean;
}

export const useExpirationAlerts = () => {
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [renewingBlanes, setRenewingBlanes] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Initial load
    loadAlerts();

    // Set up real-time updates (for development purposes)
    const interval = setInterval(loadAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for development
      setTimeout(() => {
        const mockAlerts: ExpirationAlert[] = [
          {
            id: '1',
            blaneId: 1001,
            blaneName: 'Premium Blane',
            expirationTime: new Date(Date.now() + 86400000), // 1 day from now
            read: false
          },
          {
            id: '2',
            blaneId: 1002,
            blaneName: 'Standard Blane',
            expirationTime: new Date(Date.now() + 259200000), // 3 days from now
            read: true
          }
        ];
        
        setAlerts(mockAlerts);
        setHasMore(false);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      toast.error('Failed to load expiration alerts');
      setIsLoading(false);
    }
  };

  const markAllRead = useCallback(() => {
    setAlerts(prev =>
      prev.map(alert => ({ ...alert, read: true }))
    );
  }, []);

  const renewBlane = useCallback(async (blaneId: number) => {
    // Mock renewal logic
    try {
      setRenewingBlanes(prev => new Set(prev).add(blaneId));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove this alert or update its expiration time
      setAlerts(prev => prev.filter(alert => alert.blaneId !== blaneId));
      toast.success(`Blane ${blaneId} renewed successfully`);
    } catch (error) {
      toast.error(`Failed to renew Blane ${blaneId}`);
    } finally {
      setRenewingBlanes(prev => {
        const updated = new Set(prev);
        updated.delete(blaneId);
        return updated;
      });
    }
  }, []);

  // Check if any alerts are unread
  const hasUnread = alerts.some(alert => !alert.read);

  return {
    alerts,
    markAllRead,
    renewBlane,
    hasUnread,
    isLoading,
    hasMore,
    renewingBlanes,
    loadMore: () => {}, // Implement if pagination is needed
    refresh: loadAlerts
  };
}; 