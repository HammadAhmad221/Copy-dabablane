import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from '@/user/components/ui/carousel';
import { Category, CategoriesSectionProps } from '@/user/lib/types/category';
import { getPlaceholderImage } from '@/user/lib/utils/home';

// Memoized category item component
const CategoryItem = React.memo(({ 
  category, 
  onClick 
}: { 
  category: Category; 
  onClick: (slug: string, name: string) => void;
}) => {
  // Ensure we have a valid category
  if (!category) {
    return null;
  }

  const categoryImage = getPlaceholderImage(category?.image_link, 400, 240);
  const categoryName = category?.name || 'Sans nom';
  const categorySlug = category?.slug || '';

  return (
    <div 
      className="block relative group overflow-hidden rounded-lg cursor-pointer"
      onClick={() => onClick(categorySlug, categoryName)}
    >
      <div className="relative aspect-[5/3]">
        <img
          src={categoryImage}
          alt={categoryName}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <span className="text-white text-lg font-semibold text-center">
            {categoryName.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
});

CategoryItem.displayName = 'CategoryItem';

const CategoriesSection = ({ categories = [] }: CategoriesSectionProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const handleCategoryChange = useCallback((slug: string, name: string) => {
    if (!slug) return;
    
    // Store both slug and name in localStorage
    localStorage.setItem('selectedCategory', slug);
    localStorage.setItem('selectedCategoryName', name);
    
    const searchParams = new URLSearchParams();
    searchParams.set('category', slug);
    navigate({
      pathname: '/catalogue',
      search: searchParams.toString()
    });
  }, [navigate]);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    if (!api) return;
    api.scrollTo(index);
  }, [api]);

  const carouselOptions = useMemo(() => ({
    align: 'start' as const,
    loop: true,
    containScroll: 'trimSnaps' as const,
    dragFree: true,
    slidesToScroll: 1
  }), []);

  // Filter out any invalid categories
  const validCategories = categories?.filter(category => 
    category && 
    typeof category.slug !== 'undefined' && 
    typeof category.name !== 'undefined'
  ) || [];

  if (!validCategories.length) {
    return null;
  }

  return (
    <section className="py-12 w-full">
      <header className="mb-8">
        <h2 className="text-2xl font-bold">Catégories</h2>
      </header>
      
      <Carousel
        opts={carouselOptions}
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent className="-ml-4">
          {validCategories.map((category: Category) => (
            <CarouselItem 
              key={category.id} 
              className="pl-4 basis-[85%] sm:basis-[45%] md:basis-[35%] lg:basis-[25%]"
            >
              <CategoryItem 
                category={category} 
                onClick={handleCategoryChange}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Carousel Indicators */}
      <nav className="flex justify-center gap-3 mt-6">
        {validCategories.map((_: Category, index: number) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current 
                ? 'bg-primary w-12'
                : 'bg-gray-300 w-4 hover:bg-gray-400'
            }`}
            onClick={() => scrollTo(index)}
          />
        ))}
      </nav>
    </section>
  );
};

export default CategoriesSection;
  