import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Category } from '@/user/lib/types/home';

export interface UseHeaderSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedCity: string; 
  setSelectedCity: (city: string) => void;
  handleSearch: (categories: Category[]) => void;
  resetSearch: () => void;
}

// Define a custom event for triggering search updates on Catalogue page
export const triggerCatalogueSearch = (searchTerm: string, categorySlug?: string, cityName?: string) => {
  const event = new CustomEvent('search', { 
    detail: { 
      term: searchTerm,
      category: categorySlug,
      city: cityName
    },
    bubbles: true 
  });
  window.dispatchEvent(event);
};

/**
 * Custom hook to manage shared search state between header components
 */
export const useHeaderSearch = (): UseHeaderSearchReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract initial values from URL if present
  const getInitialValueFromUrl = (paramName: string, defaultValue: string): string => {
    const params = new URLSearchParams(location.search);
    return params.get(paramName) || defaultValue;
  };
  
  const [searchQuery, setSearchQuery] = useState(getInitialValueFromUrl('search', ''));
  const [selectedCity, setSelectedCity] = useState(getInitialValueFromUrl('city', 'all'));
  
  // Category needs special handling since we store ID but URL has slug
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Perform search and navigate to catalogue page
  const handleSearch = useCallback((categories: Category[]) => {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Find the category slug by ID
    let categorySlug = undefined;
    if (selectedCategory !== 'all') {
      const category = categories.find(cat => cat.id.toString() === selectedCategory);
      if (category && category.slug) {
        categorySlug = category.slug;
        params.set('category', categorySlug);
      }
    }
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    let cityName = undefined;
    if (selectedCity !== 'all') {
      cityName = selectedCity;
      params.set('city', selectedCity);
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
  }, [searchQuery, selectedCategory, selectedCity, navigate, location.pathname]);

  // Reset all search fields
  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCity('all');
    
    // If on catalogue page, also trigger a reset event
    if (location.pathname === '/catalogue') {
      triggerCatalogueSearch('');
      window.history.replaceState(null, '', '/catalogue');
    }
  }, [location.pathname]);
  
  // Initialize category from URL slug if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categorySlug = params.get('category');
    
    if (categorySlug) {
      // This will be synced with categories in the layout component
      // The category ID will be set when the categories are loaded
      setSelectedCategory('all'); // Temporarily set to 'all', will be updated by parent
    }
  }, [location.search]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCity,
    setSelectedCity,
    handleSearch,
    resetSearch
  };
}; 
