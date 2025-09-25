import { Link } from 'react-router-dom';
import { Card } from '@/user/components/ui/card';
import { memo } from 'react';
import { BlaneCardProps } from '@/user/lib/types/blane';
import { Calendar, MapPinned, Star } from 'lucide-react';
import {
  getDisplayImages,
  getRemainingDays,
  formatDate,
  calculateDiscountPercentage,
  isBlaneExpired,
  getRoundedRating,
  getStarClass
} from '@/user/lib/utils/blane';
import { getPlaceholderImage } from '@/user/lib/utils/home';
import SimpleCarousel from '@/user/components/ui/SimpleCarousel';
// Extracted Badge component to reduce nesting
const Badge = memo(({ children, className }: { children: React.ReactNode, className: string }) => (
  <span className={`text-white text-xs font-semibold px-3 py-1 rounded-lg ${className}`}>
    {children}
  </span>
));

const BlaneCard = ({ blane, isPriority = false }: BlaneCardProps & { isPriority?: boolean }) => {
  const displayImages = getDisplayImages(blane);
  const remainingDays = getRemainingDays(blane.start_date, blane.expiration_date);
  const formattedStartDate = formatDate(blane.start_date);
  const formattedExpirationDate = formatDate(blane.expiration_date);
  const isExpired = isBlaneExpired(blane.expiration_date);
  const discountPercentage = calculateDiscountPercentage(blane.price_old, blane.price_current);
  const roundedRating = getRoundedRating(blane.rating);

  // Prepare images with placeholder handling
  const processedImages = displayImages.map(img => getPlaceholderImage(img));
  
  // Prepare badges for the carousel
  const badgesElement = (
    <div className="absolute top-2 right-2 flex gap-1 z-10">
      {isExpired && <Badge className="bg-black">Expiré</Badge>}
      {blane.type && <Badge className="bg-[#197874]">{blane.type}</Badge>}
      {discountPercentage > 0 && <Badge className="bg-red-blan ">-{discountPercentage}%</Badge>}
    </div>
  );

  return (
    <Card className="grid grid-rows-[auto_1fr] overflow-hidden hover:scale-[1.01] hover:shadow-md bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <Link to={`/blane/${blane.slug}`} className="contents">
        <SimpleCarousel 
          images={processedImages}
          altText={blane.name}
          badges={badgesElement}
          imgClassName="rounded-t-lg"
          priority={isPriority} 
          fetchPriority={isPriority ? "high" : "auto"}
        />
      </Link>

      <div className="p-4 grid grid-rows-[auto_auto_auto_1fr_auto] gap-2">
        <h3 className="font-medium text-base md:text-lg text-gray-900 line-clamp-2">{blane.name}</h3>
        
        {/* Stars/rating using flexbox */}
        {blane.rating && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={16} className={getStarClass(i, roundedRating)} />
            ))}
            <span className="text-sm text-gray-600 ml-1">({roundedRating.toFixed(1)})</span>
          </div>
        )}
        
        <p className="text-gray-600 text-xs md:text-sm line-clamp-2">{blane.description}</p>
        
        {/* Metadata using stack layout */}
        <div className="grid gap-2 text-gray-700 text-xs self-end">
          {formattedStartDate && formattedExpirationDate && (
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              <span className="truncate">{formattedStartDate} - {formattedExpirationDate} ({remainingDays} jours)</span>
            </span>
          )}
          {blane.city && (
            <span className="flex items-center gap-2">
              <MapPinned size={16} />
              <span className="truncate">{blane.city}</span>
            </span>
          )}
        </div>
        
        {/* Footer with flexbox */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
          <span className="flex flex-col">
            <span className="text-[#197874] text-base md:text-lg font-bold">{blane.price_current?.toFixed(2) || '0.00'} DH</span>
            {blane.price_old > 0 && <span className="text-xs text-gray-400 line-through">{blane.price_old?.toFixed(2)} DH</span>}
          </span>
          
          <Link to={`/blane/${blane.slug}`}>
            <button className="bg-[#197874] text-white px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold hover:bg-[#145a5a] transition-colors">
              {isExpired ? 'Voir plus' : blane.type === 'reservation' ? 'Réserver' : 'Commander'}
            </button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default memo(BlaneCard);
