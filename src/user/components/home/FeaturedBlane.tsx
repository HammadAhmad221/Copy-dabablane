import { Link } from "react-router-dom";
import { Button } from "@/user/components/ui/button";
import { Card } from "@/user/components/ui/card";
import { MapPinned, Calendar } from "lucide-react";
import { Blane } from "@/user/lib/types/blane";
import { getPlaceholderImage } from "@/user/lib/utils/home";
import { getDisplayImages } from "@/user/lib/utils/blane";
import { memo } from 'react';
import SimpleCarousel from '@/user/components/ui/SimpleCarousel';

// Simple date formatter - extracted to avoid inline function creation
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Extract advantages instead of nesting in component
const AdvantagesList = memo(({ advantages }: { advantages: string }) => {
  const items = advantages.split('\n').filter(adv => adv.trim() !== '');
  
  if (items.length === 0) return null;
  
  return (
    <>
      <h4 className="text-lg font-bold mb-2">Avantages :</h4>
      <ul className="list-disc list-inside space-y-1">
        {items.slice(0, 3).map((advantage, index) => (
          <li key={index} className="text-gray-600 line-clamp-2">{advantage}</li>
        ))}
      </ul>
    </>
  );
});

// Info item component reduces nesting
const InfoItem = memo(({ icon, text }: { icon: React.ReactNode, text: React.ReactNode }) => (
  <span className="flex items-center gap-2">
    {icon}
    <span className="text-gray-600">{text}</span>
  </span>
));

interface FeaturedBlaneCardProps {
  blane: Blane;
}

// Extract card component for reusability
const FeaturedBlaneCard = memo(({ blane }: FeaturedBlaneCardProps) => {
  const displayImages = getDisplayImages(blane);
  const processedImages = displayImages.map(img => getPlaceholderImage(img));
  
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-2">
        {/* Image Section - Fixed aspect ratio and full height */}
        <div className="relative h-full min-h-[300px] md:min-h-[450px]">
          <SimpleCarousel 
            images={processedImages}
            altText={blane.name}
            aspectRatio="aspect-auto"
            className="absolute inset-0 w-full h-full"
            onImageClick={() => window.location.href = `/blane/${blane.slug}`}
            priority={true}
            fetchPriority="high"
          />
        </div>
        
        {/* Details Section - Scrollable if content overflows */}
        <div className="p-6 flex flex-col min-h-[300px] md:min-h-[450px]">
          <div className="flex-grow overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{blane.name || 'Sans titre'}</h3>
              <p className="text-gray-600 line-clamp-3">
                {blane.description || 'Aucune description disponible'}
              </p>
              
              {/* Location & Date */}
              {(blane.city || (blane.start_date && blane.expiration_date) || blane.livraison_in_city) && (
                <div className="grid gap-2 text-sm">
                  {blane.city && (
                    <InfoItem 
                      icon={<MapPinned size={18} />} 
                      text={blane.city} 
                    />
                  )}
                  {blane.start_date && blane.expiration_date && (
                    <InfoItem 
                      icon={<Calendar size={18} />} 
                      text={`${formatDate(blane.start_date)} - ${formatDate(blane.expiration_date)}`} 
                    />
                  )}
                  {blane.livraison_in_city !== undefined && blane.livraison_in_city !== 0 && (
                    <InfoItem 
                      icon="🚚" 
                      text="Livraison disponible" 
                    />
                  )}
                </div>
              )}

              {/* Price section */}
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-[#197874]">
                  {blane.price_current || '0'} DH
                </span>
                {blane.price_old && (
                  <span className="text-gray-500 line-through">{blane.price_old} DH</span>
                )}
              </div>

              {/* Advantages section */}
              {blane.advantages && <AdvantagesList advantages={blane.advantages} />}
            </div>
          </div>
          
          {/* Action Button - Always at the bottom */}
          <div className="mt-6 flex justify-end">
            <Button
              asChild
              size="lg"
              className="rounded-lg bg-[#197874] hover:bg-[#125e5c] text-white px-10"
            >
              <Link to={`/blane/${blane.slug}`}>Voir plus</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

interface FeaturedBlaneProps {
  blanes: Blane[];
}

const FeaturedBlane = ({ blanes }: FeaturedBlaneProps) => {
  return (
    <section className="grid gap-6">
      <h2 className="text-2xl font-bold mb-2">Blanes à la une</h2>
      <div className="grid gap-8">
        {blanes.map((blane) => (
          <FeaturedBlaneCard key={blane.id} blane={blane} />
        ))}
      </div>
    </section>
  );
};

export default memo(FeaturedBlane);
  