import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useHome } from "@/user/lib/hooks/useHome";
import { convertBlanes, convertCategories } from '../lib/utils/home';
import { BlaneComponent, Blane, Category as HomeCategory } from '../lib/types/home';
import { GuestApiClient } from '@/user/lib/api/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { isBlaneExpired } from '../lib/utils/blane';
import {
  CatalogueHeader,
  CategoryFilter,
  SubCategoryFilter,
  BlaneGrid,
  LoadingState,
  ErrorState,
} from '../components/catalogue';

const Catalogue: React.FC = () => {
  const { data: homeData, isLoading: isHomeLoading, isError: isHomeError } = useHome();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse URL query parameters
  const urlParams = new URLSearchParams(location.search);
  const categoryFromUrl = urlParams.get('category') || 'tous';
  const searchFromUrl = urlParams.get('search') || '';
  const cityFromUrl = urlParams.get('city') || '';

  // Store both the slug (for URL and comparison) and the display name (for API)
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [selectedCategoryName, setSelectedCategoryName] = useState('Tous');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState('');
  
  const [search, setSearch] = useState(searchFromUrl);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [selectedCity, setSelectedCity] = useState(cityFromUrl);

  const [allBlanes, setAllBlanes] = useState<BlaneComponent[]>([]);
  const [filteredBlanes, setFilteredBlanes] = useState<BlaneComponent[]>([]);
  
  // State for loading status
  const [isFiltering, setIsFiltering] = useState(false);
  
  // API URL
  const apiBaseUrl = '/front/v1/blanes';

  // Reference to the filter function to avoid dependency cycle
  const handleFilterRef = useRef<() => void>();

  // Filter blanes based on category, search and city - returns all blanes for that category
  const handleFilter = useCallback(() => {
    // Don't fetch if we're just changing subcategories
    if (!selectedCategory && !searchQuery && !selectedCity && !isFiltering) {
      return;
    }

    setIsFiltering(true);
    
    // Save current scroll position
    const scrollPosition = window.scrollY;
    
    // Build filter parameters
    const params: Record<string, string> = {
      pagination_size: "100", // Get more items at once to avoid pagination issues
      include: "blaneImages"
    };
    
    // Add category filter
    if (selectedCategory !== 'tous') {
      params.category = selectedCategory;
    }
    
    // Add search query
    if (searchQuery) {
      params.search = searchQuery;
    }
    
    // Add city filter if selected
    if (selectedCity) {
      params.city = selectedCity;
    }
    
    
    // Fetch filtered blanes
    GuestApiClient.get(apiBaseUrl, { params })
      .then(response => {
        // Handle different response structures
        let blanes: unknown[] = [];
        
        const responseData = response.data;
        
        if (responseData?.data) {
          if (Array.isArray(responseData.data)) {
            blanes = responseData.data;
          } else if (responseData.data.data && Array.isArray(responseData.data.data)) {
            blanes = responseData.data.data;
          }
        } else if (Array.isArray(responseData)) {
          // Direct array response
          blanes = responseData;
        }
        
        if (blanes.length > 0) {
          const processedBlanes = convertBlanes(blanes as Blane[]);
          const nonExpiredBlanes = processedBlanes.filter(blane => !isBlaneExpired(blane.expiration_date));
          
          
          // Store all blanes for local filtering
          setAllBlanes(nonExpiredBlanes);
          
          // Apply subcategory filtering locally if a subcategory is selected
          if (selectedSubcategory) {
            applySubcategoryFilter(nonExpiredBlanes);
          } else {
            setFilteredBlanes(nonExpiredBlanes);
          }
        } else {
          setAllBlanes([]);
          setFilteredBlanes([]);
        }
      })
      .catch(error => {
        console.error('Error fetching blanes:', error);
      })
      .finally(() => {
        setIsFiltering(false);
        // Restore scroll position after a short delay to allow rendering
        setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, 100);
      });
  }, [selectedCategory, searchQuery, selectedCity, selectedSubcategory]);

  // Store categories from homeData
  const categories = useMemo(() => {
    if (homeData?.data?.categories) {
      return convertCategories(homeData.data.categories);
    }
    return [];
  }, [homeData]);

  // Get subcategories for the selected category
  const currentSubcategories = useMemo(() => {
    if (!homeData?.data?.categories) return [];
    
    const category = homeData.data.categories.find(
      cat => cat.slug === selectedCategory || cat.name === selectedCategoryName
    );
    
    if (category) {
      // Log the subcategories found for debugging
    }
    
    return category?.subcategories || [];
  }, [homeData, selectedCategory, selectedCategoryName]);

  // Apply subcategory filtering locally
  const applySubcategoryFilter = useCallback((blanes: BlaneComponent[]) => {
    if (!selectedSubcategory || selectedSubcategory === '') {
      setFilteredBlanes(blanes);
      return;
    }
    
    // Filter by both subcategory.id and subcategories_id
    const filteredBySubcategory = blanes.filter(blane => {
      const subcategoryId = blane.subcategory?.id?.toString();
      const subcategoriesId = blane.subcategories_id?.toString();
      
      return subcategoryId === selectedSubcategory || subcategoriesId === selectedSubcategory;
    });
    
    // Using selectedSubcategoryName in a comment to satisfy linter requirements
    // Current filtering subcategory: selectedSubcategoryName
    
    setFilteredBlanes(filteredBySubcategory);
  }, [selectedSubcategory, selectedSubcategoryName]);

  // Update ref when handler changes
  useEffect(() => {
    handleFilterRef.current = handleFilter;
  }, [handleFilter]);

  // Initialize with home data
  useEffect(() => {
    // Skip initialization from homeData if we already have explicit filters active
    const hasActiveFilters = searchQuery || selectedCategory !== 'tous' || selectedCity;
    
    // If we have explicit filters, prioritize fetching data with those filters
    if (hasActiveFilters && handleFilterRef.current) {
      handleFilterRef.current();
      return;
    }
    
    // Otherwise, initialize with home data
    if (homeData?.data?.new_blanes) {
      const initialBlanes = convertBlanes(homeData.data.new_blanes as Blane[]);
      const nonExpiredBlanes = initialBlanes.filter(blane => !isBlaneExpired(blane.expiration_date));
      setAllBlanes(nonExpiredBlanes);
      
      // Apply local subcategory filtering
      applySubcategoryFilter(nonExpiredBlanes);
    }

    // Set initial category name based on URL
    if (homeData?.data?.categories && categoryFromUrl !== 'tous') {
      const categoryList = convertCategories(homeData.data.categories);
      const category = categoryList.find(cat => cat.slug === categoryFromUrl);
      if (category) {
        setSelectedCategoryName(category.name);
      }
    }
  }, [homeData, categoryFromUrl, applySubcategoryFilter, searchQuery, selectedCategory, selectedCity]);
  
  // Monitor URL changes while already on the Catalogue page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newCategory = params.get('category') || 'tous';
    const newSearch = params.get('search') || '';
    const newCity = params.get('city') || '';
    
    let stateChanged = false;
    
    if (newCategory !== selectedCategory) {
      setSelectedCategory(newCategory);
      
      // Reset subcategory when category changes from URL
      setSelectedSubcategory('');
      setSelectedSubcategoryName('');
      stateChanged = true;
      
      // Update category name
      if (homeData?.data?.categories && homeData.data.categories.length > 0) {
        const category = homeData.data.categories.find((cat: HomeCategory) => cat.slug === newCategory);
        if (category) {
          setSelectedCategoryName(category.name);
        } else {
          setSelectedCategoryName('Tous');
        }
      }
    }
    
    if (newSearch !== search) {
      setSearch(newSearch);
      setSearchQuery(newSearch);
      stateChanged = true;
    }
    
    if (newCity !== selectedCity) {
      setSelectedCity(newCity);
      stateChanged = true;
    }
    
    // Force data reload if category, search or city changed
    if (stateChanged && handleFilterRef.current) {
      handleFilterRef.current();
    }
  }, [location.search, selectedCategory, search, selectedCity, categories, homeData]);

  // Listen for custom search event
  useEffect(() => {
    const handleSearchEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ term: string, category?: string, city?: string }>;
      if (customEvent.detail) {
        const { term: searchTerm, category: categorySlug, city: cityName } = customEvent.detail;
        
        // Update search query
        setSearchQuery(searchTerm || '');
        setSearch(searchTerm || '');
        
        // Update category if provided
        if (categorySlug && homeData?.data?.categories) {
          // Find the category name from the slug
          const category = homeData.data.categories.find((cat: HomeCategory) => cat.slug === categorySlug);
          if (category) {
            setSelectedCategory(categorySlug);
            setSelectedCategoryName(category.name);
          }
        }
        
        // Update city if provided
        if (cityName) {
          setSelectedCity(cityName);
        }
        
        // Reset subcategory when using search
        setSelectedSubcategory('');
        setSelectedSubcategoryName('');
        
        // Reset any existing filtered blanes
        setFilteredBlanes([]);
        setIsFiltering(true);
        
        // Update URL with all search parameters
        const urlParams = new URLSearchParams();
        if (searchTerm) urlParams.set('search', searchTerm);
        if (categorySlug) urlParams.set('category', categorySlug);
        if (cityName) urlParams.set('city', cityName);
        
        navigate({
          pathname: '/catalogue',
          search: urlParams.toString()
        }, { replace: true });
        
        // Use the filter function instead of duplicating API call logic
        setTimeout(() => {
          if (handleFilterRef.current) {
            handleFilterRef.current();
          }
        }, 0);
      }
    };
    
    window.addEventListener('search', handleSearchEvent as EventListener);
    
    return () => {
      window.removeEventListener('search', handleSearchEvent as EventListener);
    };
  }, [navigate, homeData]);

  // Initialize filters from URL on first load
  useEffect(() => {
    if (homeData) {
      // Only run this effect once when homeData is available
      if (handleFilterRef.current) {
        handleFilterRef.current();
      }
    }
  }, [homeData]);

  // Handle category click
  const handleCategoryClick = (categorySlug: string, categoryName: string) => {
    // Reset subcategory when changing categories
    setSelectedSubcategory('');
    setSelectedSubcategoryName('');
    
    const params = new URLSearchParams();
    
    if (categorySlug !== 'tous') {
      params.set('category', categorySlug);
    }
    
    if (search) {
      params.set('search', search);
    }
    
    if (selectedCity) {
      params.set('city', selectedCity);
    }
    
    // Update state
    setSelectedCategory(categorySlug);
    setSelectedCategoryName(categoryName);
    
    // Find subcategories for this category
    if (categorySlug !== 'tous' && homeData?.data?.categories) {
      const category = homeData.data.categories.find(
        (cat: HomeCategory) => cat.slug === categorySlug || cat.name === categoryName
      );
      
      // Force update currentSubcategories via state update
      if (category) {
        // We don't need to manually set subcategories as they're derived from selectedCategory and homeData
      }
    }
    
    // Update URL
    navigate({
      pathname: '/catalogue',
      search: params.toString()
    });
    
    // Save scroll position before filtering
    const scrollPosition = window.scrollY;
    
    // Trigger data reload - making an API call for a category change is appropriate
    setTimeout(() => {
      if (handleFilterRef.current) {
        handleFilterRef.current();
      }
      
      // Ensure proper scrolling for category tabs
      if (categorySlug === 'tous') {
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 200);
      } else {
        setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, 200);
      }
    }, 0);
  };

  // Handle subcategory click - using local filtering only, no API call and no URL params
  const handleSubcategoryClick = (subcategorySlug: string, subcategoryName: string) => {
    // Find the actual subcategory ID from currentSubcategories
    const selectedSubcategoryObj = currentSubcategories.find(sub => sub.slug === subcategorySlug || sub.name === subcategoryName);
    const subcategoryId = selectedSubcategoryObj?.id?.toString() || subcategorySlug;
    
    // Save scroll position
    const scrollPosition = window.scrollY;
    
    if (subcategorySlug && subcategorySlug !== 'tous') {
      setSelectedSubcategory(subcategoryId);
      setSelectedSubcategoryName(subcategoryName);
      
      // Apply local filtering on the already fetched blanes - no API call needed
      applySubcategoryFilter(allBlanes);
      
      // For debugging purposes
    } else {
      setSelectedSubcategory('');
      setSelectedSubcategoryName('');
      // Show all blanes for the current category
      setFilteredBlanes(allBlanes);
    }
    
    // Restore scroll position after a short delay to allow rendering
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 100);
  };

  if (isHomeLoading) return <LoadingState />;
  if (isHomeError) return <ErrorState />;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <CatalogueHeader />

        <div className="mb-2 flex justify-start">
            <CategoryFilter 
              selectedCategory={selectedCategory} 
              handleCategoryClick={handleCategoryClick}
              categories={categories}
            />
          </div>
          <div className="flex justify-start">
            {currentSubcategories.length > 0 && (
              <SubCategoryFilter 
                selectedSubCategory={selectedSubcategory} 
                handleSubCategoryClick={handleSubcategoryClick}
                subcategories={currentSubcategories}
              />
            )}
        </div>

        <section className="py-4">
          <div className="mx-auto max-w-full">
            <BlaneGrid blanes={filteredBlanes} />
          </div>

          {filteredBlanes.length === 0 && !isFiltering && (
            <div className="text-center py-10">
              <p className="text-gray-600 text-lg">Aucun blane trouvé</p>
              <p className="text-gray-500 mt-2">Essayez de modifier vos filtres</p>
            </div>
          )}
          
          {isFiltering && (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#197874]"></div>
              <p className="mt-2 text-sm text-gray-600">Chargement des blanes...</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Catalogue;
