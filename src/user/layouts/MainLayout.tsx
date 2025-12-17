import { useState, useEffect, useRef, useMemo } from 'react';
import Footer from '../components/Footer';
import { useHome } from "@/user/lib/hooks/useHome";
import Navbar from '../components/Navbar';
import ScrollToTop from '../components/ScrollToTop';
import MobileNav from '../components/header/MobileNav';
import { useHeaderSearch } from '../lib/hooks/useHeaderSearch';
import { useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { data: response } = useHome();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prevScrollPos = useRef(0);
  const location = useLocation();
  const menuItems = useMemo(() => {
    const items = response?.data?.menu_items || [];

    const sorted = [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const vendorIndex = sorted.findIndex((item) => item.url === '/vendors');
    const vendorItem =
      vendorIndex >= 0
        ? sorted[vendorIndex]
        : {
            id: -101,
            label: 'Commerces partenaires',
            url: '/vendors',
            position: 0,
          };

    const withoutVendor = vendorIndex >= 0 ? sorted.filter((_, idx) => idx !== vendorIndex) : sorted;
    const insertionIndex = Math.min(1, withoutVendor.length);
    const reordered = [
      ...withoutVendor.slice(0, insertionIndex),
      vendorItem,
      ...withoutVendor.slice(insertionIndex),
    ];

    return reordered.map((item, index) => ({
      ...item,
      position: index + 1,
    }));
  }, [response?.data?.menu_items]);
  
  // Use the shared search hook
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCity,
    setSelectedCity
  } = useHeaderSearch();
  
  // Initialize category ID from URL slug when categories are loaded
  useEffect(() => {
    if (response?.data?.categories && response.data.categories.length > 0) {
      const params = new URLSearchParams(location.search);
      const categorySlug = params.get('category');
      
      if (categorySlug) {
        // Find category by slug
        const category = response.data.categories.find(cat => cat.slug === categorySlug);
        if (category) {
          // Update selected category with the found ID
          setSelectedCategory(category.id.toString());
        }
      }
    }
  }, [response?.data?.categories, location.search, setSelectedCategory]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      
      // Close menu when scrolling
      if (Math.abs(prevScrollPos.current - currentScrollPos) > 10 && isMenuOpen) {
        setIsMenuOpen(false);
      }
      
      // Set scrolled state
      setIsScrolled(currentScrollPos > 150);
      
      // Update previous scroll position
      prevScrollPos.current = currentScrollPos;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Static navbar in normal document flow */}
      <Navbar 
        categories={response?.data?.categories || []}
        cities={response?.data?.cities || []}
        menuItems={menuItems}
        isMenuOpen={isMenuOpen}
        onToggleMenu={handleToggleMenu}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
      />
      
      {/* Sticky header that appears on scroll 
      <StickyHeader
        isMenuOpen={isMenuOpen}
        onToggleMenu={handleToggleMenu}
        categories={response?.data?.categories || []}
        cities={response?.data?.cities || []}
        menuItems={response?.data?.menu_items || []}
        isVisible={isScrolled}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
      />*/}
      
      {/* Centralized mobile navigation */}
      <MobileNav
        menuItems={menuItems}
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        isScrolled={isScrolled}
      />
      
      <main className="flex-grow relative z-10">
        {children}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default MainLayout; 