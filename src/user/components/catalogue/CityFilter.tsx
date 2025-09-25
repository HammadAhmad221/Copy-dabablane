import React from 'react';

interface CityFilterProps {
  selectedCity: string;
  handleCityClick: (city: string) => void;
  cities: string[];
}

const CityFilter: React.FC<CityFilterProps> = ({ 
  selectedCity, 
  handleCityClick,
  cities = []
}) => {
  return (
    <div className="mb-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 whitespace-nowrap pb-2">
        <button 
          key="all"
          className={`px-4 py-2 rounded-lg ${selectedCity === 'Toutes' ? 'bg-[#197874] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
          onClick={() => handleCityClick('Toutes')}
        >
          Toutes les villes
        </button>
        
        {cities.map((city, index) => (
          <button 
            key={`city-${index}`}
            className={`px-4 py-2 rounded-lg ${selectedCity === city ? 'bg-[#197874] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
            onClick={() => handleCityClick(city)}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CityFilter; 