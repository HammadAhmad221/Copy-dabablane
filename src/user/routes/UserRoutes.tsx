import React, { lazy, Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.tsx';
import SimpleLayout from '../layouts/SimpleLayout.tsx';
import ScrollToTopOnNavigate from '../components/ScrollToTopOnNavigate.tsx';
import Loader from '../components/Loader.tsx';


// Lazy load all page components
const Home = lazy(() => import('../pages/Home.tsx'));
const Catalogue = lazy(() => import('../pages/Catalogue.tsx'));
const Reservation = lazy(() => import('../pages/Reservation.tsx'));
const Ecommerce = lazy(() => import('../pages/Ecommerce.tsx'));
const BtoB = lazy(() => import('../pages/BtoB.tsx'));
const BlaneDetail = lazy(() => import('../pages/BlaneDetail.tsx'));
const VendorDetail = lazy(() => import('../pages/VendorDetail.tsx'));
const Vendors = lazy(() => import('../pages/Vendors.tsx'));
const PaymentResult = lazy(() => import('../pages/PaymentResult.tsx'));
const About = lazy(() => import('../pages/About.tsx'));
const Contact = lazy(() => import('../pages/Contact.tsx'));
const NotFound = lazy(() => import('../pages/NotFound.tsx'));

const UserRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTopOnNavigate />
      <Routes>
        {/* Vendor Detail route with SimpleLayout */}
        <Route path="/vendors/:name" element={
          <SimpleLayout>
            <Suspense fallback={<Loader />}>
              <VendorDetail />
            </Suspense>
          </SimpleLayout>
        } />
        
        {/* Vendors listing route with SimpleLayout */}
        <Route path="/vendors" element={
          <SimpleLayout>
            <Suspense fallback={<Loader />}>
              <Vendors />
            </Suspense>
          </SimpleLayout>
        } />
        
        {/* All other routes with MainLayout */}
        <Route path="/" element={<MainLayout><Outlet /></MainLayout>}>
          <Route index element={
            <Suspense fallback={<Loader />}>
              <Home />
            </Suspense>
          } />
          <Route path="catalogue" element={
            <Suspense fallback={<Loader />}>
              <Catalogue />
            </Suspense>
          } />
          <Route path="ecommerce" element={
            <Suspense fallback={<Loader />}>
              <Ecommerce />
            </Suspense>
          } />
          <Route path="reservation" element={
            <Suspense fallback={<Loader />}>
              <Reservation />
            </Suspense>
          } />
          <Route path="blane/:slug" element={
            <Suspense fallback={<Loader />}>
              <BlaneDetail />
            </Suspense>
          } />
          <Route path="ecommerce-special" element={
            <Suspense fallback={<Loader />}>
              <BtoB />
            </Suspense>
          } />
          <Route path="summary/:number" element={
            <Suspense fallback={<Loader />}>
              <PaymentResult />
            </Suspense>
          } />
          <Route path="summary/:number/success" element={
            <Suspense fallback={<Loader />}>
              <PaymentResult />
            </Suspense>
          } />
          <Route path="summary/:number/fail" element={
            <Suspense fallback={<Loader />}>
              <PaymentResult />
            </Suspense>
          } />
          <Route path="about" element={
            <Suspense fallback={<Loader />}>
              <About />
            </Suspense>
          } />
          <Route path="contact" element={
            <Suspense fallback={<Loader />}>
              <Contact />
            </Suspense>
          } />
          <Route path="/blane/:slug/:token" element={
            <Suspense fallback={<Loader />}>
              <BlaneDetail />
            </Suspense>
          } />
          <Route path="*" element={
            <Suspense fallback={<Loader />}>
              <NotFound />
            </Suspense>
          } />
        </Route>
      </Routes>
    </>
  );
};

export default UserRoutes; 