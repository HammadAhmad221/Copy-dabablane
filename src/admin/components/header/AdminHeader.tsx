import { useState, useEffect } from 'react';
import Logo from '@/assets/images/dabablanelogo.webp';
import { Menu, Bell, Clock, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/admin/components/ui/avatar';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { cn } from "@/lib/utils";
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/admin/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/admin/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/admin/components/ui/tooltip';
import NotificationsPanel from '../notifications/NotificationsPanel';
import ExpirationPanel from '../notifications/ExpirationPanel';
import { useNotifications } from '@/admin/hooks/useNotifications';
import { useExpirationAlerts } from '@/admin/hooks/useExpirationAlerts';
import { authService } from '@/admin/lib/api/services/autho';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  const {
    notifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    deleteAll,
    loadMore,
    hasMore,
    isLoading,
    unreadCount,
    refresh
  } = useNotifications();

  const { hasUnread: hasUnreadAlerts } = useExpirationAlerts();

  const navigate = useNavigate();
  

  const handleProfileClick = () => {
    navigate('/admin/settings');
  };

  const handleDeconnect = () => {
    authService.logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b h-16 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
          <Link to="/"> 
            <img src={Logo} alt="DabaBlane" className="h-12 " />
          </Link>
        </div>

        <div className="flex items-center gap-4">

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[95vw] max-w-[380px] p-0">
              <NotificationsPanel
                notifications={notifications}
                onMarkAllRead={markAllAsRead}
                onMarkAsRead={markAsRead}
                onDeleteNotification={deleteNotification}
                onDeleteAll={deleteAll}
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoading={isLoading}
                onRefresh={refresh}
              />
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/admin.png" alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleProfileClick}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeconnect}
                className="text-red-600"
              >
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;