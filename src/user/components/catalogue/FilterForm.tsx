import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/user/components/ui/select';
import { Category, Subcategory } from '@/user/lib/types/category';

interface FilterFormProps {
  searchQuery: string;
  selectedCategory: string;
  selectedSubCategory: string;
  selectedCity: string;
  categories: Category[];
  subcategories: Subcategory[];
  cities: string[];
  isFiltering: boolean;
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (subcategory: string) => void;
  onCityChange: (city: string) => void;
  onFilter: () => void;
  onReset: () => void;
}

const FilterForm: React.FC<FilterFormProps> = ({
  searchQuery,
  selectedCategory,
  selectedSubCategory,
  selectedCity,
  categories,
  subcategories,
  cities,
  isFiltering,
  onSearch,
  onCategoryChange,
  onSubCategoryChange,
  onCityChange,
  onFilter,
  onReset
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Update local query when the parent's searchQuery changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalQuery(newValue);
    
    // If search field is cleared, immediately trigger the search
    if (newValue === '') {
      onSearch(newValue);
      onFilter();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
    onFilter(); // Apply filters immediately
  };

  // Wrapper functions to apply filter after each change
  const handleCategorySelect = (value: string) => {
    onCategoryChange(value);
    // If user selects "Tous", we need to reset the filters
    if (value === "Tous") {
      // Reset subcategory since it depends on category
      onSubCategoryChange("Tous");
    }
    // Small delay to ensure state is updated before filtering
    setTimeout(() => onFilter(), 50);
  };

  const handleSubCategorySelect = (value: string) => {
    onSubCategoryChange(value);
    // No need to call onFilter() here as subcategory filtering is done on the frontend
  };

  const handleCitySelect = (value: string) => {
    onCityChange(value);
    // Always trigger filter after city change
    setTimeout(() => onFilter(), 50);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Filtrer les résultats</h3>
      
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        {/* Search */}
        <div className="space-y-2 w-full">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Rechercher
          </label>
          <div className="flex bg-red-500">
            <input
              id="search"
              type="text"
              placeholder="Rechercher un blane..."
              className="flex-1 rounded-l-md border border-gray-300 focus:ring-2 focus:ring-[#197874] focus:border-transparent px-4 py-2 outline-none "
              value={localQuery}
              onChange={handleSearchChange}
            />
            <button 
              type="submit"
              className="bg-[#197874] text-white px-4 py-2 rounded-r-md hover:bg-[#156561] transition-colors"
              disabled={isFiltering}
            >
              {isFiltering ? 'Chargement...' : 'Rechercher'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Select */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <Select
              value={selectedCategory}
              onValueChange={handleCategorySelect}
              disabled={isFiltering}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tous">Tous</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Subcategory Select */}
          <div>
            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
              Sous-catégorie
            </label>
            <Select 
              value={selectedSubCategory} 
              onValueChange={handleSubCategorySelect}
              disabled={selectedCategory === 'Tous' || subcategories.length === 0 || isFiltering}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une sous-catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tous">Tous</SelectItem>
                {subcategories.map(subcategory => (
                  <SelectItem key={subcategory.id} value={subcategory.slug || subcategory.id.toString()}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* City Select */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <Select 
              value={selectedCity} 
              onValueChange={handleCitySelect}
              disabled={cities.length === 0 || isFiltering}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Toutes">Toutes les villes</SelectItem>
                {cities.map((city, index) => (
                  <SelectItem key={`city-${index}`} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex pt-2">
          <button
            type="button"
            onClick={onReset}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
            disabled={isFiltering}
          >
            {isFiltering ? 'Chargement...' : 'Réinitialiser les filtres'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterForm; 