import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AdminHeader from '../components/AdminHeader';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../../user/components/ui/Loader';
import { useIsMobile } from '../hooks/use-mobile';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading, authReady } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Set initial sidebar state based on device size
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // Use callback to prevent unnecessary re-renders
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Show loader if auth isn't ready yet
  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AdminHeader onMenuClick={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 mt-16 ${
          isSidebarOpen && !isMobile ? 'ml-64' : isMobile ? 'ml-0' : 'ml-20'
        }`}
      >
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-2 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;        