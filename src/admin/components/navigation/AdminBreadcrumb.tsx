import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const AdminBreadcrumb = () => {
  const location = useLocation();

  // Créer les éléments du fil d'Ariane en fonction du chemin actuel
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);

    // Mapping des noms d'affichage
    const nameMap: { [key: string]: string } = {
      admin: 'Administrateur',
      users: 'Utilisateurs',
      roles: 'Rôles',
      dashboard: 'Tableau de bord',
      blanes: 'Blanes',
      menu: 'Éléments du menu',
      categories: 'Catégories',
      subcategories: 'Sous-catégories',
      images: 'Images',
      // tags: 'Tags',
      // ratings: 'Avis',
      reservations: 'Réservations',
      orders: 'Commandes',
      // merchants: 'Marchands',
      // offers: 'Offres',
      coupons: 'Coupons',
      settings: 'Paramètres',
      // integrations: 'Intégrations des réseaux sociaux',
      security: 'Sécurité',
      // faqs: 'FAQ',
      // media: 'Fichiers multimédias',
      notifications: 'Notifications',
      analytics: 'Analytiques',
      // feedback: 'Retours',
      // transactions: 'Transactions',
      // shipping: 'Livraison',
    };

    // Mappage spécial des chemins (affichage -> chemin réel)
    const pathMap: { [key: string]: string } = {
      'Éléments du menu': '/admin/menu/items',
      Blanes: '/admin/blanes',
      Catégories: '/admin/blanes/categories',
      'Sous-catégories': '/admin/blanes/subcategories',
      Images: '/admin/blanes/images',
      // Tags: '/admin/blanes/tags',
      // Avis: '/admin/blanes/ratings',
      Réservations: '/admin/reservations',
      Commandes: '/admin/orders',
      // Marchands: '/admin/merchants',
      // Offres: '/admin/offers',
      Coupons: '/admin/coupons',
      Paramètres: '/admin/settings',
      'Intégrations des réseaux sociaux': '/admin/integrations',
      Sécurité: '/admin/security',
      // FAQ: '/admin/faqs',
      // 'Fichiers multimédias': '/admin/media',
      Notifications: '/admin/notifications',
      Analytiques: '/admin/analytics',
      // Retours: '/admin/feedback',
      // Transactions: '/admin/transactions',
      // Livraison: '/admin/shipping',
    };

    return paths
      .map((path, index) => {
        const displayName =
          nameMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
        const isSpecialPath = Object.keys(pathMap).includes(displayName);

        return {
          name: displayName,
          path: isSpecialPath ? pathMap[displayName] : `/${paths.slice(0, index + 1).join('/')}`,
          isLast: index === paths.length - 1,
          shouldShow: !['list', 'items'].includes(path),
        };
      })
      .filter((item) => item.shouldShow);
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.path} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {breadcrumb.isLast ? (
            <span className="font-medium text-foreground">{breadcrumb.name}</span>
          ) : (
            <Link
              to={breadcrumb.path}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default AdminBreadcrumb;