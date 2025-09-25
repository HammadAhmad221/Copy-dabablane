import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Users = lazy(() => import('./pages/users/Users'));
const Roles = lazy(() => import('./pages/users/Roles'));
const MenuItems = lazy(() => import('./pages/menu/MenuItems'));
const Blanes = lazy(() => import('./pages/blanes/Blanes'));
const Categories = lazy(() => import('./pages/blanes/Categories'));
const SubCategory = lazy(() => import('./pages/blanes/SubCategories'));
const Images = lazy(() => import('./pages/blanes/Images'));
const Tags = lazy(() => import('./pages/blanes/Tags'));
const Ratings = lazy(() => import('./pages/blanes/Ratings'));
const Reservations = lazy(() => import('./pages/reservations-orders/Reservations'));
const Orders = lazy(() => import('./pages/reservations-orders/Orders'));
const Merchants = lazy(() => import('./pages/merchants-management/Merchants'));
const Offers = lazy(() => import('./pages/merchants-management/Offers'));
const Coupons = lazy(() => import('./pages/coupons/Coupons'));
const Settings = lazy(() => import('./pages/general-settings/Settings'));
const SocialMediaIntegrations = lazy(() => import('./pages/integrations/SocialMediaIntegrations'));
const Security = lazy(() => import('./pages/security/Security'));
const Faqs = lazy(() => import('./pages/content-management/Faqs'));
const MediaFiles = lazy(() => import('./pages/content-management/MediaFiles'));
const Notifications = lazy(() => import('./pages/content-management/Notifications'));
const Analytics = lazy(() => import('./pages/analytics-feedback/Analytics'));
const Feedback = lazy(() => import('./pages/analytics-feedback/Feedback'));
const Transactions = lazy(() => import('./pages/payment-shipping/Transactions'));
const Shipping = lazy(() => import('./pages/payment-shipping/Shipping'));
const Tax = lazy(() => import('./pages/payment-shipping/Tax'));
const CreateBlane = lazy(() => import('./pages/blanes/CreateBlane'));
const EditBlane = lazy(() => import('./pages/blanes/EditBlane'));
const DuplicateBlane = lazy(() => import('./pages/blanes/DuplicateBlane'));
const Contact = lazy(() => import('./pages/contact/Contact'));
const Cities = lazy(() => import('./pages/cities/Cities'));
const Customers = lazy(() => import('./pages/users/Customers'));
const DynamiqueBanner = lazy(() => import('./pages/DynamiqueBanner'));
const Vendors = lazy(() => import('./pages/vendors/Vendors'));

const adminRoutes: RouteObject[] = [
  {
    index: true,
    element: <Dashboard />
  },
  {
    path: "dashboard",
    element: <Dashboard />
  },
  {
    path: "users",
    element: <Users />
  },
  {
    path: "roles",
    element: <Roles />
  },
  {
    path: "menu/items",
    element: <MenuItems />
  },
  {
    path: "blanes",
    element: <Blanes />
  },
  {
    path: "blanes/categories",
    element: <Categories />
  },
  {
    path: "blanes/subcategories",
    element: <SubCategory />
  },
  {
    path: 'blanes/create',
    element: <CreateBlane />
  },
  {
    path: 'blanes/edit/:id',
    element: <EditBlane />
  },
  {
    path: 'blanes/duplicate/:id',
    element: <DuplicateBlane />
  },
  {
    path: "blanes/images",
    element: <Images />
  },
  {
    path: "blanes/tags",
    element: <Tags />
  },
  {
    path: "blanes/ratings",
    element: <Ratings />
  },
  {
    path: "contact",
    element: <Contact />
  },
  {
    path: "reservations",
    element: <Reservations />
  },
  {
    path: "orders",
    element: <Orders />
  },
  {
    path: "merchants",
    element: <Merchants />
  },
  {
    path: "merchants/:merchantId/offers",
    element: <Offers />
  },
  {
    path: "offers",
    element: <Offers />
  },
  {
    path: "coupons",
    element: <Coupons />
  },
  {
    path: "settings",
    element: <Settings />
  },
  {
    path: "cities",
    element: <Cities />
  },
  {
    path: "integrations",
    element: <SocialMediaIntegrations />
  },
  {
    path: "security",
    element: <Security />
  },
  {
    path: "faqs",
    element: <Faqs />
  },
  {
    path: "media",
    element: <MediaFiles />
  },
  {
    path: "notifications",
    element: <Notifications />
  },
  {
    path: "analytics",
    element: <Analytics />
  },
  {
    path: "feedback",
    element: <Feedback />
  },
  {
    path: "transactions",
    element: <Transactions />
  },
  {
    path: "shipping",
    element: <Shipping />
  },
  {
    path: "tax",
    element: <Tax />
  },
  {
    path: "customers",
    element: <Customers />
  },
  {
    path: "dynamique-banner",
    element: <DynamiqueBanner />
  },
  {
    path: "vendors",
    element: <Vendors />
  }
];

export default adminRoutes; 