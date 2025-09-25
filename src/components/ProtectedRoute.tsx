import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from './ui/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, user, isLoading, authReady } = useAuth();
  const location = useLocation();

  // Show loader while authentication status is still being determined
  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && user?.role && !requiredRoles.includes(user.role)) {
    // Redirect to unauthorized page if role doesn't match any of the required roles
    return <Navigate to="/unauthorized" replace />;
  }

  // Authentication successful and role matches, render children
  return <>{children}</>;
};

export default ProtectedRoute; 