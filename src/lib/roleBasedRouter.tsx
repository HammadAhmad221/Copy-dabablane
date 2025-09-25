import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Loader from '../components/ui/Loader';
import ProtectedRoute from '../components/ProtectedRoute';
import Unauthorized from '../components/Unauthorized';
import { useAuth } from '../contexts/AuthContext';

// Lazy load the apps
const UserApp = lazy(() => import('../user/routes/UserRoutes.tsx'));
const AdminLogin = lazy(() => import('../admin/pages/security/AdminLogin.tsx'));
const AdminLayout = lazy(() => import('../admin/layouts/AdminLayout.tsx'));
const AdminRoutes = lazy(() => import('../admin/routes/index.tsx'));

/**
 * This is a role-based router that loads different route sets based on the path.
 * It checks authentication and redirects to login if not authenticated.
 */
const RoleBasedRouter = () => {
  const { isAuthenticated, user, isLoading, authReady } = useAuth();
  const location = useLocation();

  // Show global loader while authentication is still being determined
  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  // Get the intended destination from location state when redirected from login
  const from = location.state?.from?.pathname;
  
  // If authenticated and trying to access login page, redirect based on role
  if (isAuthenticated && location.pathname === '/login') {
    // If there's a saved destination, use that, otherwise redirect based on role
    const defaultPath = user?.role === 'admin' ? '/admin' : '/admin/blanes';
    return <Navigate to={from || defaultPath} replace />;
  }

  // If authenticated user with role 'user' tries to access /admin, redirect to /admin/blanes
  if (isAuthenticated && user?.role === 'user' && location.pathname === '/admin') {
    return <Navigate to="/admin/blanes" replace />;
  }

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRoles={['admin', 'user']}>
              <AdminLayout>
                <Suspense fallback={<Loader />}>
                  <AdminRoutes />
                </Suspense>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        {/* User routes - no protection needed */}
        <Route path="/*" element={<UserApp />} />
      </Routes>
    </Suspense>
  );
};

export default RoleBasedRouter; 