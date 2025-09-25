import React, { useState, useEffect } from 'react';
import { BlaneService } from '@/user/lib/api/services/blaneService';
import { BlaneGrid } from '@/user/components/catalogue';
import { Loader2 } from 'lucide-react';
import { BlaneComponent } from '@/user/lib/types/home';

// Define a type for the API response
interface ApiBlane {
  id: number | string;
  name: string;
  description?: string;
  images?: string[];
  slug: string;
  price_current: number | string;
  price_old?: number | string;
  rating?: string | number;
  city?: string;
  start_date?: string;
  expiration_date?: string;
  livraison_in_city?: number | string;
  advantages?: string;
  type: string;
  blane_images?: Array<{ image_link: string }>;
  blaneImages?: Array<{ image_link: string }>;
  subcategories_id?: number;
  subcategory?: {
    id: number;
    category_id: number;
    name: string;
    slug?: string;
  };
}

const Reservation: React.FC = () => {
  const [blanes, setBlanes] = useState<BlaneComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlanes = async () => {
      try {
        setLoading(true);
        // Fetch all blanes
        const response = await BlaneService.getAllBlanes({
          include: 'blaneImages',
          pagination_size: 100 // Get a larger set to filter from
        });
        
        if (response.data && Array.isArray(response.data)) {
          // Filter only blanes with type "reservation"
          const reservationBlanes = response.data
            .filter((blane: ApiBlane) => blane.type === 'reservation')
            .map((blane: ApiBlane) => {
              // Convert to BlaneComponent format expected by BlaneGrid
              return {
                id: String(blane.id),
                name: blane.name,
                description: blane.description || '',
                images: blane.images || [],
                slug: blane.slug,
                price_current: Number(blane.price_current) || 0, // Ensure it's a number
                price_old: Number(blane.price_old) || 0,
                rating: String(blane.rating || '0'),
                city: blane.city || '',
                start_date: blane.start_date || '',
                expiration_date: blane.expiration_date || '',
                livraison_in_city: Number(blane.livraison_in_city) || 0,
                advantages: blane.advantages || '',
                type: blane.type,
                blane_images: Array.isArray(blane.blane_images) 
                  ? blane.blane_images 
                  : (Array.isArray(blane.blaneImages) 
                    ? blane.blaneImages.map(img => ({ 
                        image_link: typeof img.image_link === 'string' ? img.image_link : '' 
                      }))
                    : []),
                subcategories_id: blane.subcategories_id,
                subcategory: blane.subcategory
              };
            });
            
          setBlanes(reservationBlanes);
        } else {
          setError('Invalid data format received from API');
        }
      } catch (err) {
        console.error('Error fetching blanes:', err);
        setError('Failed to load reservation services. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlanes();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Réservations</h1>
        <p className="text-gray-600 mt-2">Réservez votre rendez-vous ou service</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center p-4 bg-red-50 text-red-500 rounded-lg">
          {error}
        </div>
      ) : blanes.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No reservation services available at the moment.</p>
        </div>
      ) : (
        <BlaneGrid blanes={blanes} />
      )}
    </div>
  );
};

export default Reservation; 