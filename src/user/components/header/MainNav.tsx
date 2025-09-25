import { Link, useLocation } from 'react-router-dom';
import { MenuItem } from '@/user/lib/types/home';

interface MainNavProps {
  menuItems: MenuItem[];
  onNavLinkClick?: () => void;
  compactMode?: boolean;
}

const MainNav = ({ menuItems, onNavLinkClick, compactMode = false }: MainNavProps) => {
  // Sort menu items by position
  const sortedMenuItems = [...menuItems].sort((a, b) => a.position - b.position);
  const location = useLocation();
  
  // Function to check if a nav link should be highlighted as active
  const isActiveRoute = (url: string) => {
    // Remove trailing slashes for consistent comparison
    const normalizedUrl = url.replace(/\/$/, '');
    const normalizedPath = location.pathname.replace(/\/$/, '');
    
    // Use exact matching only
    return normalizedPath === normalizedUrl;
  };

  return (
    <nav>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <div className="flex justify-center space-x-8 flex-wrap text-gray-600">
            {sortedMenuItems.map((item) => (
              <Link
                key={item.id}
                to={item.url}
                onClick={onNavLinkClick}
                className={`hover:text-[#E66C61] border-b-2 ${
                  isActiveRoute(item.url)
                    ? 'border-[#E66C61] text-[#E66C61]' 
                    : 'border-transparent'
                } hover:border-[#E66C61] transition-colors duration-200 py-4`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
