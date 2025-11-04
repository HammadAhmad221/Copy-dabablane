import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { VendorService, VendorListItem, VendorCoverMediaItem } from '@/user/lib/api/services/vendorService';
import Loader from '@/user/components/ui/Loader';
import { getPlaceholderImage } from '@/user/lib/utils/home';

const VENDOR_MEDIA_BASE_URL = 'https://dev.dabablane.com/storage/uploads/vendor_images/';

const buildVendorAssetUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${VENDOR_MEDIA_BASE_URL}${path}`;
};

const resolveCoverImage = (vendor: VendorListItem): string => {
  if (Array.isArray(vendor.cover_media) && vendor.cover_media.length > 0) {
    const firstMedia = vendor.cover_media.find((media) => {
      if (typeof media === 'string') return true;
      return (media as VendorCoverMediaItem)?.media_type !== 'video';
    }) || vendor.cover_media[0];

    if (typeof firstMedia === 'string') {
      return firstMedia.startsWith('http')
        ? firstMedia
        : buildVendorAssetUrl(firstMedia);
    }

    const mediaObject = firstMedia as VendorCoverMediaItem;
    const mediaUrl = mediaObject.media_url || mediaObject.url;
    if (mediaUrl) {
      return mediaUrl.startsWith('http')
        ? mediaUrl
        : buildVendorAssetUrl(mediaUrl);
    }
  }

  if (vendor.logoUrl) {
    return buildVendorAssetUrl(vendor.logoUrl);
  }

  return '';
};

const VendorsPage = () => {
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await VendorService.getAllVendors({
          page: 1,
          paginationSize: 20,
        });

        setVendors(response.data);
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError('Impossible de charger les vendeurs pour le moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg p-6 text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Découvrez nos partenaires
          </h1>
          <p className="text-gray-600 text-lg">
            Explorez les vendeurs de confiance qui proposent des expériences uniques à travers tout le Maroc.
          </p>
        </div>

        {vendors.length === 0 ? (
          <div className="bg-white shadow-sm rounded-xl p-10 text-center text-gray-600">
            Aucun vendeur actif n'est disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vendors.map((vendor) => {
              const imageUrl = resolveCoverImage(vendor);
              const displayName = vendor.company_name || vendor.name || 'Vendeur';
              const displayCity = vendor.city || 'Ville non renseignée';

              return (
                <Link
                  key={vendor.id}
                  to={`/vendor/${vendor.id}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={getPlaceholderImage(imageUrl, 640, 420)}
                      alt={displayName}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-xl font-semibold mb-1">
                        {displayName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        <MapPin className="h-4 w-4" />
                        <span>{displayCity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    {vendor.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {vendor.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {vendor.businessCategory && (
                        <span className="px-3 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-full">
                          {vendor.businessCategory}
                        </span>
                      )}
                      {vendor.subCategory && (
                        <span className="px-3 py-1 text-xs font-medium bg-orange-50 text-orange-600 rounded-full">
                          {vendor.subCategory}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorsPage;

