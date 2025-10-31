import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { VendorService, Vendor } from '../lib/api/services/vendorService';
import Loader from '@/user/components/ui/Loader';
import NotFound from './NotFound';
import BlaneCard from '../components/BlaneCard';
import Footer from '../components/Footer';

const VendorDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!slug) return;

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
      <Footer />
    </div>
  );
};

export default VendorDetails;
