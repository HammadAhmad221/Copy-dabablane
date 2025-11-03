import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, MapPin } from 'lucide-react';
import { BlaneService } from '@/user/lib/api/services/blaneService';
import { Blane } from '@/user/lib/types/home';
import Loader from '@/user/components/ui/Loader';
import { getPlaceholderImage } from '@/user/lib/utils/home';

interface VendorInfo {
  name: string;
  rating: number;
  hours: string;
  location: string;
  cover_image: string;
}

const VendorDetail = () => {
  const { vendorSlug } = useParams<{ vendorSlug: string }>();
  const [blanes, setBlanes] = useState<Blane[]>([]);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!vendorSlug) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch blanes for this vendor using search parameter
        const response = await BlaneService.getAllBlanes({
          search: vendorSlug.replace(/-/g, ' '),
          pagination_size: 50,
          include: 'blaneImages',
        });

        if (response.data && response.data.length > 0) {
          setBlanes(response.data);

          // Create vendor info from first blane
          // In a real app, you'd fetch this from a vendors API endpoint
          const firstBlane = response.data[0];
          setVendorInfo({
            name: vendorSlug.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            rating: parseFloat(firstBlane.rating) || 4.5,
            hours: 'Ouvert (De 10h00h à 22h00h)',
            location: firstBlane.city || 'Casa Baalabeck',
            cover_image: firstBlane.blane_images?.[0]?.image_link || '',
          });
        } else {
          setError('Aucune offre trouvée pour ce vendeur');
        }
      } catch (err) {
        console.error('Error fetching vendor data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorSlug]);

  if (loading) {
    return <Loader />;
  }

  if (error || !vendorInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Vendeur non trouvé'}
          </h2>
          <Link to="/catalogue" className="text-[#197874] hover:underline">
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={getPlaceholderImage(vendorInfo.cover_image, 1920, 400)}
          alt={vendorInfo.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-3xl px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {vendorInfo.name}
            </h1>
            
            <div className="flex items-center justify-center gap-6 text-sm md:text-base flex-wrap">
              {/* Rating */}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{vendorInfo.rating.toFixed(1)}</span>
              </div>
              
              {/* Hours */}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5" />
                <span>{vendorInfo.hours}</span>
              </div>
              
              {/* Location */}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <MapPin className="w-5 h-5" />
                <span>Chez {vendorInfo.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blanes Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Réservation en ligne
        </h2>

        {blanes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Aucune offre disponible pour le moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blanes.map((blane) => {
              const imageUrl = blane.blane_images?.[0]?.image_link || '';
              const rating = parseFloat(blane.rating) || 0;

              return (
                <div
                  key={blane.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getPlaceholderImage(imageUrl, 400, 300)}
                      alt={blane.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title and Rating */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-800 flex-1">
                        {blane.name}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-gray-700">
                          {rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-[#197874]">
                        {blane.price_current} DH
                      </span>
                      {blane.price_old && blane.price_old > blane.price_current && (
                        <span className="ml-2 text-sm text-gray-400 line-through">
                          {blane.price_old} DH
                        </span>
                      )}
                    </div>

                    {/* View Button */}
                    <Link
                      to={`/blane/${blane.slug}`}
                      className="block w-full bg-[#197874] hover:bg-[#197874]/90 text-white text-center font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                      Voir
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDetail;

