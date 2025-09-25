import React, { useEffect, useRef } from 'react';
import { Subcategory } from '@/user/lib/types/category';

interface SubCategoryFilterProps {
  selectedSubCategory: string;
  handleSubCategoryClick: (subCategorySlug: string, subCategoryName: string) => void;
  subcategories: Subcategory[];
}

const SubCategoryFilter: React.FC<SubCategoryFilterProps> = ({ 
  selectedSubCategory, 
  handleSubCategoryClick,
  subcategories = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Helper function to check if a subcategory is selected
  const isSelected = (subcategory: Subcategory): boolean => {
    return selectedSubCategory === subcategory.slug || 
           selectedSubCategory === subcategory.id.toString() ||
           selectedSubCategory === subcategory.name;
  };
  
  // Scroll selected subcategory into view when it changes
  useEffect(() => {
    if (containerRef.current && selectedSubCategory) {
      const activeButton = containerRef.current.querySelector(`.selected-subcategory`);
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
  }, [selectedSubCategory, subcategories]);

  return (
    <div 
      ref={containerRef}
      className="overflow-x-auto scrollbar-hide"
    >
      <div className="flex gap-2 whitespace-nowrap pb-2">
        <button 
          key="all"
          className={`px-3 py-1.5 text-sm rounded-md ${!selectedSubCategory ? 'bg-[#f87171] text-white selected-subcategory' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'} transition-colors`}
          onClick={() => handleSubCategoryClick('', 'Tous')}
        >
          Tous
        </button>
        {subcategories.map(subCategory => (
          <button 
            key={subCategory.id}
            className={`px-3 py-1.5 text-sm rounded-md ${isSelected(subCategory) ? 'bg-[#f87171] text-white selected-subcategory' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'} transition-colors`}
            onClick={() => handleSubCategoryClick(subCategory.slug || subCategory.id.toString(), subCategory.name)}
          >
            {subCategory.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubCategoryFilter; 