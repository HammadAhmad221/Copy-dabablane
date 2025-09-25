import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from '../admin/components/ui/Loader';

// Lazy load the admin layout
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));

const AdminApp = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </Suspense>
  );
};

export default AdminApp; 