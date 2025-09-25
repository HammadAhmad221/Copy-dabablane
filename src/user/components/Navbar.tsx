import Header from './header/Header';
import MainNav from './header/MainNav';
import { NavbarProps } from '@/user/lib/types/navbar';

interface ExtendedNavbarProps extends NavbarProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const Navbar = ({ 
  categories, 
  cities, 
  menuItems, 
  className = '', 
  isMenuOpen,
  onToggleMenu,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCity,
  setSelectedCity
}: ExtendedNavbarProps) => {
  return (
    <div>
      <Header 
        isMenuOpen={isMenuOpen} 
        onToggleMenu={onToggleMenu} 
        categories={categories}
        cities={cities}
        menuItems={menuItems}
        isScrolled={false}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
      />
      
      {/* Desktop navigation - only visible on desktop */}
      <div className="hidden md:block bg-white shadow-sm">
        <MainNav menuItems={menuItems} compactMode={false} />
      </div>
    </div>
  );
};

export default Navbar;
