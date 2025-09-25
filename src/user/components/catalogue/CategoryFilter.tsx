import React, { useEffect, useRef } from 'react';
import { Category } from '@/user/lib/types/category';

interface CategoryFilterProps {
  selectedCategory?: string;
  handleCategoryClick: (categorySlug: string, categoryName: string) => void;
  categories: Category[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory = 'tous',
  handleCategoryClick,
  categories,
}) => {
  const prevSelectedRef = useRef<string>(selectedCategory);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // If selected category changed externally
    if (prevSelectedRef.current !== selectedCategory) {
      prevSelectedRef.current = selectedCategory;
      
      // Scroll the category into view when changed from outside
      scrollCategoryIntoView();
    }
  }, [selectedCategory, categories]);

  // Scroll selected category into view when it changes
  const scrollCategoryIntoView = () => {
    if (containerRef.current && selectedCategory) {
      const activeButton = containerRef.current.querySelector(`[data-category="${selectedCategory}"]`);
      if (activeButton) {
        setTimeout(() => {
          activeButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'center' 
          });
        }, 100);
      }
    }
  };

  // Find category name by slug
  const getCategoryNameBySlug = (slug: string): string => {
    if (slug === 'tous') return 'Tous';
    const category = categories?.find(cat => cat.slug === slug);
    return category?.name || 'Tous';
  };

  return (
    <div 
      ref={containerRef}
      className="flex overflow-x-auto py-4 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="mx-auto whitespace-nowrap">
        <button
          className={`mr-2 px-4 py-2 text-sm rounded-md transition-colors ${
            selectedCategory === 'tous' 
              ? 'bg-[#197874] text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => handleCategoryClick('tous', 'Tous')}
          data-category="tous"
        >
          Tous
        </button>
        {categories?.map((category) => (
          <button
            key={category.slug}
            className={`mr-2 px-4 py-2 text-sm rounded-md transition-colors ${
              selectedCategory === category.slug 
                ? 'bg-[#197874] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleCategoryClick(category.slug, category.name)}
            data-category={category.slug}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}; 