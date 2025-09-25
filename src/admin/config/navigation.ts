import {
  LayoutDashboard,
  Users,
  Menu as MenuIcon,
  ShoppingBag,
  Calendar,
  Tag,
  BarChart2,
  Settings,
  Contact,
  TicketSlash,
  MapPin,
  Store
} from 'lucide-react';

export const adminNavItems = [
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    path: '/admin',
    icon: LayoutDashboard,
  },
  {
    id: 'user-management',
    title: 'Gestion des utilisateurs',
    path: '/admin/users',
    icon: Users,
    children: [
      {
        id: 'users',
        title: 'Utilisateurs',
        path: '/admin/users',
      },
      {
        id: 'roles',
        title: 'Rôles',
        path: '/admin/roles',
      },
      {
        id: 'customers',
        title: 'Clients',
        path: '/admin/customers',
      },
    ],
  },
  {
    id: 'menu-management',
    title: 'Gestion du menu',
    path: '/admin/menu',
    icon: MenuIcon,
    children: [
      {
        id: 'menu-items',
        title: 'Éléments du menu',
        path: '/admin/menu/items',
      },
    ],
  },
  {
    id: 'blane-management',
    title: 'Gestion des Blanes',
    path: '/admin/blanes',
    icon: ShoppingBag,
    children: [
      {
        id: 'blanes',
        title: 'Blanes',
        path: '/admin/blanes',
      },
      {
        id: 'categories',
        title: 'Catégories',
        path: '/admin/blanes/categories',
      },
      {
        id: 'subcategories',
        title: 'Sous-catégories',
        path: '/admin/blanes/subcategories',
      },
      {
        id: 'blane-ratings',
        title: 'Avis des Blanes',
        path: '/admin/blanes/ratings',
      },
    ],
  },
  {
    id: 'vendor-management',
    title: 'Gestion des Vendeurs',
    path: '/admin/vendors',
    icon: Store,
    children: [
      {
        id: 'vendors',
        title: 'Vendeurs',
        path: '/admin/vendors',
      },
    ],
  },
  {
    id: 'reservations-orders',
    title: 'Réservations & Commandes',
    path: '/admin/orders-reservations',
    icon: Calendar,
    children: [
      {
        id: 'reservations',
        title: 'Réservations',
        path: '/admin/reservations',
      },
      {
        id: 'orders',
        title: 'Commandes',
        path: '/admin/orders/',
      },
    ],
  },
  {
    id: 'coupons',
    title: 'Coupons',
    path: '/admin/coupons',
    icon: Tag,
  },
  {
    id: 'analytics',
    title: 'Analytiques',
    path: '/admin/analytics',
    icon: BarChart2,
  },
  {
    id: 'contact',
    title: 'Gestion des contacts',
    path: '/admin/contact',
    icon: Contact,
  },
  {
    id: 'dynamique-banner',
    title: 'Bannière dynamique',
    path: '/admin/dynamique-banner',
    icon: TicketSlash,
  },
  {
    id: 'cities',
    title: 'Paramètres des villes',
    path: '/admin/cities',
    icon: MapPin,
  },
  {
    id: 'general-settings',
    title: 'Paramètres généraux',
    path: '/admin/settings',
    icon: Settings,
  },
];