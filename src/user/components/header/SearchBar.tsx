import { Search, MapPin } from 'lucide-react';
import { Input } from '@/user/components/ui/input';
import { Button } from '@/user/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/user/components/ui/select';
import { Category, City } from '@/user/lib/types/home';
import { FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerCatalogueSearch } from '@/user/lib/hooks/useHeaderSearch';

interface SearchBarProps {
  categories: Category[];
  cities: City[];
  isScrolled?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const SearchBar = ({ 
  categories, 
  cities, 
  isScrolled = false,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCity,
  setSelectedCity
}: SearchBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    redirectToCatalogue(value, selectedCity);
  };
  
  // Handle city change
  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    redirectToCatalogue(selectedCategory, value);
  };
  
  // Function to redirect to catalogue with updated filters
  const redirectToCatalogue = (category: string, city: string) => {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Find the category slug by ID
    let categorySlug = undefined;
    if (category !== 'all') {
      const categoryObj = categories.find(cat => cat.id.toString() === category);
      if (categoryObj && categoryObj.slug) {
        categorySlug = categoryObj.slug;
        params.set('category', categoryObj.slug);
      }
    }
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    let cityName = undefined;
    if (city !== 'all') {
      cityName = city;
      params.set('city', city);
    }
    
    // Check if we are already on the catalogue page
    const isCataloguePage = location.pathname === '/catalogue';
    
    if (isCataloguePage) {
      // Trigger the search event FIRST to update the component state
      triggerCatalogueSearch(searchQuery, categorySlug, cityName);
      
      // Then update URL without navigation
      const queryString = params.toString();
      const newUrl = `/catalogue${queryString ? `?${queryString}` : ''}`;
      window.history.replaceState(null, '', newUrl);
    } else {
      // Navigate to the catalogue page with query parameters
      const queryString = params.toString();
      navigate(`/catalogue${queryString ? `?${queryString}` : ''}`);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    redirectToCatalogue(selectedCategory, selectedCity);
  };

  return (
    <div className={`transition-all duration-300 ${
      isScrolled 
        ? 'bg-[#197874]/95 py-2 backdrop-blur-sm' 
        : 'bg-[#197874] py-3'
    } w-full border-b border-[#197874]/20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          {/* Category selector */}
          <div className="relative">
            <Select 
              value={selectedCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger 
                className={`w-full md:w-[200px] bg-white transition-all ${
                  isScrolled ? 'h-9' : 'h-9'
                }`} 
                aria-label="Select Category"
              >
                <SelectValue placeholder="Categories" />
              </SelectTrigger>
              <SelectContent className="w-[200px]" position="popper">
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search input with city selector inside */}
          <div className="flex-1 relative min-w-0">
            <div className="flex w-full">
              <div className="relative flex-1 min-w-0">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-all ${
                  isScrolled ? 'scale-90' : ''
                }`} />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-[120px] rounded-r-none bg-white transition-all ${
                    isScrolled ? 'h-9' : 'h-9'
                  }`}
                />
                {/* City selector overlaid on the right side of input */}
                <div className="absolute right-0 top-0 h-full border-l">
                  <Select 
                    value={selectedCity}
                    onValueChange={handleCityChange}
                  >
                    <SelectTrigger 
                      className={`h-full border-0 bg-transparent focus:ring-0 focus:ring-offset-0 min-w-[120px] transition-all ${
                        isScrolled ? 'text-sm' : ''
                      }`} 
                      aria-label="Select City"
                    >
                      <MapPin className={`transition-all ${isScrolled ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent className="w-[120px]" position="popper" side="bottom" align="end">
                      <SelectItem value="all">Toutes les villes</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search button */}
              <Button 
                type="submit" 
                className={`bg-white hover:bg-white/90 text-[#197874] rounded-l-none shrink-0 transition-all ${
                  isScrolled ? 'h-9 px-3' : 'h-9 px-3'
                }`}
              >
                <Search className={`transition-all ${isScrolled ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchBar;
