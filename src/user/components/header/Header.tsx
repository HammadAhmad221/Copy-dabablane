import { Link } from 'react-router-dom';
import Logo from '@/assets/images/dabablane.png';
import { Menu } from 'lucide-react';
import { Button } from '@/user/components/ui/button';
import { Category, City, MenuItem } from '@/user/lib/types/home';
import SearchBar from './SearchBar';

interface HeaderProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  categories: Category[];
  cities: City[];
  menuItems: MenuItem[];
  isScrolled?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const Header = ({ 
  isMenuOpen, 
  onToggleMenu, 
  categories, 
  cities, 
  menuItems, 
  isScrolled = false,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCity,
  setSelectedCity
}: HeaderProps) => {
  return (
    <>
      <header className="w-full transition-all duration-300">
        <div className="container mx-auto px-4">
          <div className="flex justify-between md:justify-center items-center py-4">
            <Link to="/" className="inline-block transition-transform hover:scale-105">
              <img 
                src={Logo} 
                alt="DabaBlane" 
                className="h-8 md:h-10 w-auto object-contain"
              />
            </Link>
            <Button 
              onClick={onToggleMenu}
              className="md:hidden text-gray-600 hover:text-[#E66C61] outline-none focus:ring-2 focus:ring-[#E66C61] focus:ring-offset-2 rounded-lg p-2 bg-white focus:bg-white" 
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>
      <SearchBar 
        categories={categories} 
        cities={cities} 
        isScrolled={isScrolled} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
      />
    </>
  );
};

export default Header;
