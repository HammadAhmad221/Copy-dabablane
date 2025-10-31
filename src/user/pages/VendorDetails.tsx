import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { VendorService, Vendor } from '../lib/api/services/vendorService';
import Loader from '@/user/components/ui/Loader';
import NotFound from './NotFound';
import BlaneCard from '../components/BlaneCard';
// Dummy data for testing purposes. This will be removed before production.
const dummyVendor: Vendor = {
  id: 1,
  name: 'Albaik Foods',
  slug: 'test',
  description: 'Restaurant and well being in a fabulous setting',
  image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
  blanes: [
    {
      id: 1,
      name: 'Indian Buffet',
      slug: 'indian-buffet',
      description: 'A delicious Indian buffet',
      price_current: 300,
      price_old: 350,
      type: 'reservation',
      rating: 4.5,
      city: 'Casablanca',
      images: ['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0'],
      expiration_date: '2025-12-31',
      start_date: '2025-01-01',
    },
    {
      id: 2,
      name: 'Horse Riding',
      slug: 'horse-riding',
      description: 'A fun horse riding experience',
      price_current: 180,
      price_old: 200,
      type: 'reservation',
      rating: 4.5,
      city: 'Casablanca',
      images: ['https://images.unsplash.com/photo-1598974357801-92736b1635ba'],
      expiration_date: '2025-12-31',
      start_date: '2025-01-01',
    },
    {
        id: 3,
        name: 'Formula 4+1',
        slug: 'formula-4-1',
        description: 'A great formula for you and your friends',
        price_current: 200,
        price_old: 250,
        type: 'reservation',
        rating: 4.5,
        city: 'Casablanca',
        images: ['https://images.unsplash.com/photo-1552529621-2ef09a066d79'],
        expiration_date: '2025-12-31',
        start_date: '2025-01-01',
      },
  ],
};

const VendorDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!slug) return;

      // Use dummy data for testing when the slug is 'test'
      if (slug === 'test') {
        setVendor(dummyVendor);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await VendorService.getVendorBySlug(slug);
        if (response.success) {
          setVendor(response.data);
        } else {
          setError(response.message || 'Failed to fetch vendor data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (error || !vendor) {
    return <NotFound />;
  }

  return (
    <div className="bg-gray-100">
      <div
        className="relative bg-cover bg-center h-80"
        style={{ backgroundImage: `url(${vendor.image})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold">{vendor.name}</h1>
            <p className="text-lg mt-2">{vendor.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Réservation en ligne</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {vendor.blanes.map((blane) => (
            <BlaneCard key={blane.id} blane={blane} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;
