import React, { useState, useRef, useCallback, useEffect } from 'react';
import BlaneCard from '../BlaneCard';
import { BlaneComponent } from '@/user/lib/types/home';
import { Blane } from '@/user/lib/types/blane';
import { Button } from '@/user/components/ui/button';
import { cn } from '@/user/lib/utils';

interface BlaneGridProps {
  blanes: BlaneComponent[];
  className?: string;
}

const ITEMS_PER_PAGE = 6; // Reduced number of items per page to decrease DOM size

const BlaneGrid: React.FC<BlaneGridProps> = ({ blanes, className }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Calculate total pages
  const totalPages = Math.ceil(blanes.length / ITEMS_PER_PAGE);
  
  // Get current items to display
  const getCurrentItems = useCallback(() => {
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    return blanes.slice(0, indexOfLastItem);
  }, [blanes, currentPage]);
  
  // Handle loading more items
  const loadMore = useCallback(() => {
    if (currentPage < totalPages) {
      setIsLazyLoading(true);
      // Simulate network delay for smoother UX
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsLazyLoading(false);
      }, 300);
    }
  }, [currentPage, totalPages]);
  
  // Reset current page when blanes data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [blanes]);
  
  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLazyLoading && currentPage < totalPages) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMore, isLazyLoading, currentPage, totalPages]);
  
  const visibleBlanes = getCurrentItems();
  const hasMore = currentPage < totalPages;
  
  return (
    <section className="grid gap-8">
      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8",
        className
      )}>
        {visibleBlanes.map((blane) => (
          <BlaneCard key={blane.id} blane={blane as Blane} />
        ))}
      </div>
      
      {/* Loading indicator and sentinel */}
      {hasMore && (
        <div 
          ref={observerTarget} 
          className="flex justify-center"
        >
          {isLazyLoading 
            ? <div className="w-8 h-8 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin" /> 
            : <Button variant="outline" onClick={loadMore} className="px-6">Charger plus</Button>
          }
        </div>
      )}
    </section>
  );
};

export default BlaneGrid;
