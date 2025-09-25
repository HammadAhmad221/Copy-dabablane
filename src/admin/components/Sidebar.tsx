import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { adminNavItems } from "../config/navigation";
import { useIsMobile } from "../hooks/use-mobile";
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

// Define the navigation item types based on the actual structure
interface NavChild {
  id: string;
  title: string;
  path: string;
}

interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user } = useAuth();

  // Filter navigation items based on user role
  const filteredNavItems = adminNavItems.filter(item => {
    if (user?.role === 'user') {
      // Remove specific paths for user role
      const restrictedPaths = [
        '/admin', // Tableau de bord
        '/admin/analytics', // Analytiques
        '/admin/menu', // Gestion du menu
        '/admin/users', // Gestion des utilisateurs
        '/admin/blanes/categories', // Catégories
        '/admin/blanes/subcategories', // Sous-catégories
        '/admin/orders-reservations', // Parent path for Réservations & Commandes
        '/admin/reservations', // Réservations
        '/admin/orders', // Commandes
        '/admin/cities' // Paramètres des villes
      ];
      
      // If the main path is restricted, remove the whole item
      if (restrictedPaths.includes(item.path)) {
        return false;
      }

      // If it has children, filter out restricted child paths
      if (item.children) {
        item.children = item.children.filter(child => 
          !restrictedPaths.includes(child.path)
        );
        // If all children were restricted, remove the parent item
        if (item.children.length === 0) {
          return false;
        }
      }
      
      return true;
    }
    return true; // Show all items for admin
  });

  // Only close when navigating, don't auto-close when component mounts
  useEffect(() => {
    const handleLocationChange = () => {
      if (isMobile && isOpen) {
        toggleSidebar();
      }
    };

    return () => {
      // This will only run on navigation/unmount, not on initial render
      handleLocationChange();
    };
  }, [location.pathname]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  };

  const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
    e.preventDefault(); // Always prevent default to handle navigation manually

    if (!isOpen && !isMobile) {
      // Desktop collapsed sidebar behavior
      if (item.children?.length) {
        navigate(item.children[0].path);
      } else {
        navigate(item.path);
      }
    } else if (item.children?.length) {
      // Handle items with children (submenus)
      toggleExpand(item.id);
    } else {
      // Handle items without children (direct navigation)
      navigate(item.path);
      if (isMobile) {
        setTimeout(() => toggleSidebar(), 150); // Close sidebar after navigation
      }
    }
  };

  // If on mobile, render a slide-out sidebar
  if (isMobile) {
    return (
      <aside
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-all duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => toggleSidebar()} // Close on backdrop click
      >
        <div 
          className="fixed left-0 top-0 h-full w-[85%] max-w-[300px] bg-white border-r shadow-lg overflow-y-auto pt-14 pb-6 px-4"
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
        >
          <nav className="h-full overflow-y-auto">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                const isExpanded = expandedItems.includes(item.id);

                return (
                  <li key={item.id}>
                    <div className="relative">
                      <button
                        onClick={(e) => handleItemClick(item as NavItem, e)}
                        className={cn(
                          "flex w-full items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[#197874] text-white"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <span className="flex-1">{item.title}</span>
                        {item.children && (
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform", isExpanded && "transform rotate-180")}
                          />
                        )}
                      </button>

                      {item.children && isExpanded && (
                        <ul className="mt-1 ml-6 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(child.path);
                                  setTimeout(() => toggleSidebar(), 150);
                                }}
                                className={cn(
                                  "flex w-full items-center px-3 py-2 rounded-lg text-sm transition-colors",
                                  location.pathname === child.path
                                    ? "bg-[#197874] text-white"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                              >
                                {child.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    );
  }

  // Default desktop sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r transition-all duration-300 z-40",
        isOpen ? "w-64" : "w-20 md:w-20 hidden md:block",
      )}
    >
      <nav className="h-full py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            const isExpanded = expandedItems.includes(item.id);

            return (
              <li key={item.id}>
                <div className="relative">
                  <Link
                    to={item.path}
                    onClick={(e) => handleItemClick(item as NavItem, e)}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#197874] text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      !isOpen && "justify-center",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isOpen && "mr-3")} />
                    {isOpen && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        {item.children && (
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform", isExpanded && "transform rotate-180")}
                          />
                        )}
                      </>
                    )}
                  </Link>

                  {isOpen && item.children && isExpanded && (
                    <ul className="mt-1 ml-6 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            to={child.path}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
                              location.pathname === child.path
                                ? "bg-[#197874] text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 