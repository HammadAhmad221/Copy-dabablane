import { Routes, Route } from 'react-router-dom';
import adminRoutes from '../routes';
import ProtectedRoute from '../../components/ProtectedRoute';

const AdminRoutes = () => {
  // Define restricted paths that only admin can access
  const restrictedPaths = [
    'analytics',
    'menu/items',
    '', // Index/dashboard route
    'dashboard', // Also restrict the explicit dashboard route
    'blanes/categories',
    'blanes/subcategories',
    'cities',
    'reservations',
    'orders'
  ];

  return (
    <Routes>
      {adminRoutes.map((route, index) => {
        // Get the path for comparison (empty string for index route)
        const pathForComparison = route.index ? '' : route.path || '';
        
        // Determine if this is a restricted path
        const isRestricted = restrictedPaths.includes(pathForComparison);

        // For restricted paths, only allow admin. For non-restricted paths, allow both admin and user.
        return (
          <Route
            key={index}
            path={route.path}
            index={route.index}
            element={
              isRestricted ? (
                <ProtectedRoute requiredRoles={['admin']}>
                  {route.element}
                </ProtectedRoute>
              ) : (
                route.element
              )
            }
          />
        );
      })}
    </Routes>
  );
};

export default AdminRoutes;