import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch?: () => void;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  onSearch,
  isLoading = false 
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear debounce timer on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalQuery(newValue);
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer to update search after typing stops
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(newValue);
      if (onSearch) {
        onSearch();
      }
    }, 500); // 500ms debounce
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setSearchQuery(localQuery);
      if (onSearch) {
        onSearch();
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {isLoading ? (
          <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
        ) : (
          <Search className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <input
        type="text"
        placeholder="Rechercher un blane..."
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#197874] focus:border-transparent outline-none"
        value={localQuery}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default SearchBar; 