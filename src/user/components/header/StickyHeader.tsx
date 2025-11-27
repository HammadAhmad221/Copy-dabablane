import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '@/assets/images/dabablane.png';
import { Menu, Search, ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@/user/components/ui/button';
import { Category, City, MenuItem } from '@/user/lib/types/home';
import { useState, FormEvent, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/user/components/ui/popover';

interface StickyHeaderProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  categories: Category[];
  cities: City[];
  menuItems: MenuItem[];
  isVisible: boolean; // Controls whether the sticky header is shown or hidden
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const StickyHeader = ({ 
  isMenuOpen, 
  onToggleMenu, 
  categories, 
  cities, 
  menuItems,
  isVisible,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCity,
  setSelectedCity
}: StickyHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Sort menu items by position for consistency
  const sortedMenuItems = [...menuItems].sort((a, b) => a.position - b.position);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // Function to check if a nav link should be highlighted as active
  const isActiveRoute = (url: string) => {
    // Exact match for home page
    if (url === '/' && location.pathname === '/') {
      return true;
    }
    
    // Handle nested routes by checking if the current path starts with the nav item URL
    // But exclude the home page from this rule to avoid it always being active
    if (url !== '/' && location.pathname.startsWith(url)) {
      return true;
    }
    
    return false;
  };
  
  // Sync local state with parent state
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
  };
  
  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    redirectToCatalogue(category, selectedCity, localSearchQuery);
  };
  
  // Handle city change
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    redirectToCatalogue(selectedCategory, city, localSearchQuery);
  };
  
  // Function to redirect to catalogue with updated filters
  const redirectToCatalogue = (category: string, city: string, searchTerm: string) => {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    
    if (category !== 'all' && category !== 'Categories') {
      // Find the category by ID and get its slug
      const category = categories.find(cat => cat.id.toString() === category);
      if (category && category.slug) {
        params.set('category', category.slug);
      }
    }
    
    if (city !== 'all' && city !== 'City') {
      params.set('city', city);
    }
    
    // Navigate to the catalogue page with query parameters
    const queryString = params.toString();
    navigate(`/catalogue${queryString ? `?${queryString}` : ''}`);
  };
  
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Update parent state with local state
    setSearchQuery(localSearchQuery);
    redirectToCatalogue(selectedCategory, selectedCity, localSearchQuery);
    
    // Close search after submission
    setSearchExpanded(false);
  };
  
  // Helper function to get display name for category selector
  const getCategoryDisplayName = () => {
    if (selectedCategory === 'all') return 'Categories';
    
    const category = categories.find(cat => cat.id.toString() === selectedCategory);
    return category ? category.name : 'Categories';
  };
  
  return (
    <div 
      className={`fixed top-0 left-0 right-0 w-full bg-white z-40 transition-all duration-300 ${
        isVisible 
          ? 'transform-none shadow-sm'
          : 'transform -translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="py-2 flex items-center justify-between relative">
          {/* Left side with logo and nav links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="transition-transform hover:scale-105 shrink-0">
              <img 
                src={Logo} 
                alt="DabaBlane" 
                className="h-8 md:h-9 w-auto object-contain" 
                width="100" 
                height="36"
              />
            </Link>
            
            {/* Desktop Nav to the right of logo */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-8 text-gray-600">
                {sortedMenuItems.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    to={item.url}
                    className={`hover:text-[#E66C61] border-b-2 ${
                      isActiveRoute(item.url)
                        ? 'border-[#E66C61] text-[#E66C61]' 
                        : 'border-transparent'
                    } hover:border-[#E66C61] transition-colors duration-200 py-3`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Search and mobile menu buttons on the right */}
          <div className="flex items-center gap-2">
            {searchExpanded ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-white rounded-md border border-gray-200 p-0.5 transition-all duration-300 animate-in fade-in-0 slide-in-from-right-5">
                <div className="hidden sm:flex items-center gap-1">
                  {/* Categories dropdown */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs px-2 py-1 h-7 text-gray-600 hover:text-[#197874] flex items-center gap-1"
                      >
                        {getCategoryDisplayName()}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 max-h-[300px] overflow-auto">
                      <div className="p-1">
                        <button 
                          type="button"
                          onClick={() => handleCategoryChange('all')}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-md"
                        >
                          All Categories
                        </button>
                        {categories.map(category => (
                          <button 
                            type="button"
                            key={category.id}
                            onClick={() => handleCategoryChange(category.id.toString())}
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-md"
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Locations dropdown */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs px-2 py-1 h-7 text-gray-600 hover:text-[#197874] flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3 mr-0.5" />
                        {selectedCity !== 'all' ? selectedCity : 'City'}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[180px] p-0 max-h-[300px] overflow-auto">
                      <div className="p-1">
                        <button 
                          type="button"
                          onClick={() => handleCityChange('all')}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-md"
                        >
                          All Cities
                        </button>
                        {cities.map(city => (
                          <button 
                            type="button"
                            key={city.id} 
                            onClick={() => handleCityChange(city.name)}
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-md"
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="h-8 w-[120px] sm:w-[180px] md:w-[200px] rounded-md border-0 pl-8 pr-2 focus:ring-1 focus:ring-[#197874] text-sm"
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                </div>
                
                <Button
                  type="button"
                  onClick={toggleSearch}
                  variant="ghost"
                  size="sm"
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
                
                <Button
                  type="submit"
                  size="sm"
                  className="p-1 bg-[#197874] text-white hover:bg-[#197874]/90"
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </form>
            ) : (
              <Button
                onClick={toggleSearch}
                className="rounded-full w-8 h-8 p-0 flex items-center justify-center text-gray-600 hover:text-[#E66C61] bg-gray-100 hover:bg-gray-200"
                variant="ghost"
                size="icon"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Button 
              onClick={onToggleMenu}
              className="md:hidden text-gray-600 hover:text-[#E66C61] bg-transparent hover:bg-transparent p-2" 
              variant="ghost"
              size="icon"
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyHeader; 