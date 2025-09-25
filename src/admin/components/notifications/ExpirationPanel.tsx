import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExpirationAlert } from '../../hooks/useExpirationAlerts';

interface ExpirationPanelProps {
  alerts: ExpirationAlert[];
  onMarkAllRead: () => void;
  onRenewBlane: (blaneId: number) => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}

const ExpirationPanel: React.FC<ExpirationPanelProps> = ({
  alerts,
  onMarkAllRead,
  onRenewBlane,
  hasMore,
  isLoading
}) => {
  const [renewingBlanes, setRenewingBlanes] = useState<Set<number>>(new Set());

  const handleRenew = async (blaneId: number) => {
    try {
      setRenewingBlanes(prev => new Set(prev).add(blaneId));
      await onRenewBlane(blaneId);
    } finally {
      setRenewingBlanes(prev => {
        const updated = new Set(prev);
        updated.delete(blaneId);
        return updated;
      });
    }
  };

  return (
    <div className="expiration-panel">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-medium">Expiration Alerts</h3>
        <button 
          onClick={onMarkAllRead}
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          Mark all as read
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No expiration alerts
          </div>
        ) : (
          <ul>
            {alerts.map((alert) => (
              <li 
                key={alert.id} 
                className={`p-3 border-b hover:bg-gray-50 ${!alert.read ? 'bg-red-50' : ''}`}
              >
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between">
                    <p className={`text-sm ${!alert.read ? 'font-medium' : ''}`}>
                      Blane {alert.blaneName}
                    </p>
                    <p className="text-xs text-red-600">
                      ID: {alert.blaneId}
                    </p>
                  </div>
                  
                  <p className="text-xs text-red-600">
                    Expires {formatDistanceToNow(alert.expirationTime, { addSuffix: true })}
                  </p>
                  
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => handleRenew(alert.blaneId)}
                      disabled={renewingBlanes.has(alert.blaneId)}
                      className="text-xs bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {renewingBlanes.has(alert.blaneId) ? 'Renewing...' : 'Renew'}
                    </button>
                    <a 
                      href={`/admin/blanes/${alert.blaneId}`} 
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Details
                    </a>
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

export default ExpirationPanel;