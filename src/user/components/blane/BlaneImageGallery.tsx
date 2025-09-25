import { getPlaceholderImage } from '@/user/lib/utils/home';
import { Download, Calendar, Clock, Package } from 'lucide-react';

interface BlaneImageGalleryProps {
  images: string[];
  name: string;
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  discountPercentage: number;
  isDigital?: boolean;
  type?: 'ecommerce' | 'reservation';
  typeTime?: 'time' | 'date';
  stock?: number;
}

export const BlaneImageGallery = ({
  images,
  name,
  activeImageIndex,
  setActiveImageIndex,
  discountPercentage,
  isDigital,
  type,
  typeTime,
  stock
}: BlaneImageGalleryProps) => {
  // Determine product type
  const isTimeBasedReservation = type === 'reservation' && typeTime === 'time';
  const isDateBasedReservation = type === 'reservation' && (!typeTime || typeTime === 'date');
  
  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full h-[400px] overflow-hidden bg-gray-100 rounded-lg">
        {/* Discount badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-[#E66C61] text-white px-2 py-1 rounded-md font-medium">
            -{discountPercentage}%
          </div>
        )}
        
        {/* Digital product badge */}
        {isDigital && (
          <div className="absolute top-4 right-4 z-10 bg-blue-500 text-white px-3 py-1 rounded-md font-medium flex items-center">
            <Download size={16} className="mr-1" />
            Numérique
          </div>
        )}
        
        {/* Time-based reservation badge */}
        {isTimeBasedReservation && (
          <div className="absolute top-4 right-4 z-10 bg-amber-500 text-white px-3 py-1 rounded-md font-medium flex items-center">
            <Clock size={16} className="mr-1" />
            Horaire
          </div>
        )}
        
        {/* Date-based reservation badge */}
        {isDateBasedReservation && (
          <div className="absolute top-4 right-4 z-10 bg-green-500 text-white px-3 py-1 rounded-md font-medium flex items-center">
            <Calendar size={16} className="mr-1" />
            Journalier
          </div>
        )}
        
        {/* Physical product badge for ecommerce */}
        {type === 'ecommerce' && !isDigital && (
          <div className="absolute top-4 right-4 z-10 bg-purple-500 text-white px-3 py-1 rounded-md font-medium flex items-center">
            <Package size={16} className="mr-1" />
            Produit
          </div>
        )}
        
        {/* Stock indicator for physical products */}
        {!isDigital && stock !== undefined && stock <= 10 && (
          <div className={`absolute bottom-4 right-4 z-10 px-3 py-1 rounded-md font-medium text-white
            ${stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
          >
            {stock > 0 
              ? `Plus que ${stock} en stock!` 
              : 'Épuisé'}
          </div>
        )}
        
        <img 
          src={getPlaceholderImage(images[activeImageIndex], 800, 600)} 
          alt={name} 
          className="w-full h-full object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex overflow-x-auto gap-3 pb-2">
          {images.map((img, index) => (
            <button 
              key={index}
              onClick={() => setActiveImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                index === activeImageIndex 
                  ? 'border-[#E66C61] shadow-md' 
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img 
                src={getPlaceholderImage(img, 100, 100)} 
                alt={`${name} - image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 