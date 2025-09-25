import { MenuItem } from '@/user/lib/types/home';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/user/components/ui/button';

interface MobileNavProps {
  menuItems: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  isScrolled: boolean;
}

const MobileNav = ({ menuItems, isOpen, onClose, isScrolled }: MobileNavProps) => {
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Sort menu items by position
  const sortedMenuItems = [...menuItems].sort((a, b) => a.position - b.position);

  // Update menu position based on window size and scroll position
  useEffect(() => {
    if (!isOpen) return;
    
    // Calculate the correct position for the menu
    const updateMenuPosition = () => {
      if (!menuRef.current) return;
      
      if (isScrolled) {
        // When sticky header is visible
        menuRef.current.style.position = 'fixed';
        menuRef.current.style.top = '60px'; // Sticky header height
        menuRef.current.style.maxHeight = 'calc(100vh - 60px)';
      } else {
        // When static header is visible
        // Find the search bar at the bottom of the static header
        const searchBar = document.querySelector('.bg-\\[\\#197874\\]') as HTMLElement;
        if (searchBar) {
          const searchBarBottom = searchBar.getBoundingClientRect().bottom;
          menuRef.current.style.position = 'absolute';
          menuRef.current.style.top = `${searchBarBottom}px`;
          menuRef.current.style.maxHeight = `calc(100vh - ${searchBarBottom}px)`;
        } else {
          // Fallback if search bar not found
          menuRef.current.style.position = 'fixed';
          menuRef.current.style.top = '160px';
          menuRef.current.style.maxHeight = 'calc(100vh - 160px)';
        }
      }
    };

    // Run initially and on resize
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isOpen, isScrolled]);

  // Close menu on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Prevent scrolling when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Only add overlay when using sticky header */}
      {isScrolled && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile menu */}
      <div 
        ref={menuRef}
        className="left-0 right-0 z-40 bg-white shadow-lg md:hidden transition-all duration-300 animate-in slide-in-from-right overflow-y-auto"
        style={{ 
          position: isScrolled ? 'fixed' : 'absolute',
          top: isScrolled ? '60px' : '205px' // Default position
        }}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-gray-100 z-10">
          <h2 className="font-semibold text-gray-800">Menu</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        
        <nav>
          <div className="py-2">
            {sortedMenuItems.map((item) => {
              const isActive = location.pathname === item.url;
              
              return (
                <Link
                  key={item.id}
                  to={item.url}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 transition-colors duration-200 ${
                    isActive 
                      ? 'bg-gray-50 text-[#E66C61]' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-base font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                  <ChevronRight className={`h-4 w-4 ${isActive ? 'text-[#E66C61]' : 'text-gray-400'}`} />
                </Link>
              );
            })}
          </div>
          
          <div className="pb-8 px-4 pt-4">
            <Button 
              variant="default" 
              className="w-full bg-[#197874] hover:bg-[#197874]/90 text-white py-2 rounded-md"
              onClick={onClose}
            >
              Fermer
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileNav; 