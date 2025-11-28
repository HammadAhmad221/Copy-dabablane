import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
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

// Helper function to create URL-friendly slugs (replace spaces with hyphens)
const slugify = (text: string): string => {
  return text
    .toString()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')             // Trim hyphens from start
    .replace(/-+$/, '');            // Trim hyphens from end
};

const VendorsPage = () => {
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalVendors, setTotalVendors] = useState<number>(0);

  const VENDORS_PER_PAGE = 9;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await VendorService.getAllVendors({
          page: currentPage,
          paginationSize: VENDORS_PER_PAGE,
          search: debouncedSearch,
        });

        setVendors(response.data);
        setTotalVendors(response.meta?.total || response.data.length);
        setTotalPages(response.meta?.last_page || Math.ceil(response.data.length / VENDORS_PER_PAGE));

        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError('Impossible de charger les vendeurs pour le moment.');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchVendors();
  }, [debouncedSearch, currentPage]);

  if (initialLoad && loading) {
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
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Découvrez nos partenaires
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600">
            Explorez les vendeurs de confiance qui proposent des expériences uniques à travers tout le Maroc.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, ville, catégorie..."
              className="w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#197874] focus:border-transparent shadow-sm transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">&times;</span>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="mt-3 text-sm text-gray-600 text-center">
              {loading ? 'Recherche en cours...' : `${totalVendors} vendeur${totalVendors !== 1 ? 's' : ''} trouvé${totalVendors !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: VENDORS_PER_PAGE }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
              >
                {/* Skeleton Image with shimmer */}
                <div className="relative h-56 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />

                {/* Skeleton Content */}
                <div className="p-5 space-y-4">
                  {/* Skeleton Description Lines */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-3/4" />
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/2" />
                  </div>

                  {/* Skeleton Tags */}
                  <div className="flex gap-2">
                    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full w-20" />
                    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="bg-white shadow-sm rounded-xl p-10 text-center text-gray-600">
            {searchTerm 
              ? `Aucun vendeur trouvé pour "${searchTerm}"`
              : 'Aucun vendeur actif n\'est disponible pour le moment.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vendors.map((vendor) => {
              const mediaUrl = resolveCoverImage(vendor);
              const displayName = vendor.company_name || vendor.name || 'Vendeur';
              const displayCity = vendor.city || 'Ville non renseignée';
              
              // Check if media is video
              const isVideo = mediaUrl.toLowerCase().match(/\.(mp4|mov|webm|ogg)$/);

              return (
                <Link
                  key={vendor.id}
                  to={`/${slugify(vendor.company_name || vendor.name || '')}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    {isVideo ? (
                      <video
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        onClick={(e) => {
                          if (e.currentTarget.paused) {
                            e.currentTarget.play();
                          } else {
                            e.currentTarget.pause();
                          }
                        }}
                      />
                    ) : (
                      <img
                        src={getPlaceholderImage(mediaUrl, 640, 420)}
                        alt={displayName}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
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

        {/* Pagination */}
        {!loading && vendors.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1);
                
                const showEllipsis = 
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return <span key={page} className="px-2 text-gray-400">...</span>;
                }

                if (!showPage) {
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#197874] text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </div>
        )}

        {/* Results Summary */}
        {!loading && vendors.length > 0 && (
          <p className="text-center text-sm text-gray-600 mt-6">
            Affichage de {vendors.length} vendeur{vendors.length !== 1 ? 's' : ''} sur {totalVendors}
          </p>
        )}
      </div>
    </div>
  );
};

export default VendorsPage;

