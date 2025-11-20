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
  Store,
  Percent,
  DollarSign,
  FileText,
} from "lucide-react";

export const adminNavItems = [
  {
    id: "dashboard",
    title: "Tableau de bord",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    id: "user-management",
    title: "Gestion des utilisateurs",
    path: "/admin/users",
    icon: Users,
    children: [
      {
        id: "users",
        title: "Utilisateurs",
        path: "/admin/users",
      },
      {
        id: "roles",
        title: "Rôles",
        path: "/admin/roles",
      },
      {
        id: "customers",
        title: "Clients",
        path: "/admin/customers",
      },
    ],
  },
  {
    id: "menu-management",
    title: "Gestion du menu",
    path: "/admin/menu",
    icon: MenuIcon,
    children: [
      {
        id: "menu-items",
        title: "Éléments du menu",
        path: "/admin/menu/items",
      },
    ],
  },
  {
    id: "blane-management",
    title: "Gestion des Blanes",
    path: "/admin/blanes",
    icon: ShoppingBag,
    children: [
      {
        id: "blanes",
        title: "Blanes",
        path: "/admin/blanes",
      },
      {
        id: "categories",
        title: "Catégories",
        path: "/admin/blanes/categories",
      },
      {
        id: "subcategories",
        title: "Sous-catégories",
        path: "/admin/blanes/subcategories",
      },
      {
        id: "blane-ratings",
        title: "Avis des Blanes",
        path: "/admin/blanes/ratings",
      },
    ],
  },
  {
    id: "vendor-management",
    title: "Gestion des Vendeurs",
    path: "/admin/vendors",
    icon: Store,
    children: [
      {
        id: "vendors",
        title: "Vendeurs",
        path: "/admin/vendors",
      },
      {
        id: "vendor-dashboard",
        title: "Tableau de bord du vendeur",
        path: "/admin/vendors/dashboard",
      },
      {
        id: "commission-charts",
        title: "Commission Charts",
        path: "/admin/vendors/commission-charts",
      },
      {
        id: "subscription-management",
        title: "Subscription Management",
        path: "/admin/vendors/subscription-management",
      },
      {
        id: "invoice-config",
        title: "Configuration Facture",
        path: "/admin/vendors/invoice-config",
      },
      {
        id: "promo-code-management",
        title: "Promo Code Management",
        path: "/admin/vendors/promo-code-management",
      },
      {
        id: "vendor-planes",
        title: "Vendor Plans",
        path: "/admin/vendors/planes",
      },
      {
        id: "vendor-reservation-orders",
        title: "Réservations & Commandes",
        path: "/admin/vendors/reservation-orders",
      },
    ],
  },
  {
    id: "reservations-orders",
    title: "Réservations & Commandes",
    path: "/admin/orders-reservations",
    icon: Calendar,
    children: [
      {
        id: "reservations",
        title: "Réservations",
        path: "/admin/reservations",
      },
      {
        id: "orders",
        title: "Commandes",
        path: "/admin/orders/",
      },
      // {
      //   id: 'invoice-config',
      //   title: 'Configuration Facture',
      //   path: '/admin/reservations-orders/invoice-config',
      // },
    ],
  },
  {
    id: "coupons",
    title: "Coupons",
    path: "/admin/coupons",
    icon: Tag,
  },
  {
    id: "commission-management",
    title: "Gestion des commissions",
    path: "/admin/commission",
    icon: Percent,
    children: [
      {
        id: "commissions",
        title: "Taux de commission",
        path: "/admin/commission",
      },
      {
        id: "vendor-commission",
        title: "Vendor Commission",
        path: "/admin/commission/vendor-commission",
      },
      {
        id: "commission-settings",
        title: "Paramètres",
        path: "/admin/commission/settings",
      },
    ],
  },
  {
    id: "vendor-payments",
    title: "Paiements des vendeurs",
    path: "/admin/vendor-payments",
    icon: DollarSign,
    children: [
      {
        id: "payments-list",
        title: "Liste des paiements",
        path: "/admin/vendor-payments",
      },
      {
        id: "payment-report",
        title: "Rapport de transfert",
        path: "/admin/vendor-payments/report",
      },
      {
        id: "manual-transfer",
        title: "Transfert manuel",
        path: "/admin/vendor-payments/manual-transfer",
      },
      {
        id: "payment-history",
        title: "Historique",
        path: "/admin/vendor-payments/history",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytiques",
    path: "/admin/analytics",
    icon: BarChart2,
  },
  {
    id: "contact",
    title: "Gestion des contacts",
    path: "/admin/contact",
    icon: Contact,
  },
  {
    id: "dynamique-banner",
    title: "Bannière dynamique",
    path: "/admin/dynamique-banner",
    icon: TicketSlash,
    children: [
      {
        id: "desktop-banner",
        title: "Bannière de bureau",
        path: "/admin/dynamique-banner",
      },
      {
        id: "mobile-banner",
        title: "Bannière mobile",
        path: "/admin/mobile-banner",
      },
    ],
  },
  {
    id: "cities",
    title: "Paramètres des villes",
    path: "/admin/cities",
    icon: MapPin,
  },
  {
    id: "terms-and-condition",
    title: "Termes et conditions",
    path: "/admin/terms-and-condition",
    icon: FileText,
  },
  {
    id: "general-settings",
    title: "Paramètres généraux",
    path: "/admin/settings",
    icon: Settings,
  },
];
