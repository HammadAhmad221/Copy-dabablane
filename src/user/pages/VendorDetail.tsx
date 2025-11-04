import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, MapPin, Facebook, Instagram, Phone } from 'lucide-react';
import { Blane } from '@/user/lib/types/home';
import Loader from '@/user/components/ui/Loader';
import { getPlaceholderImage } from '@/user/lib/utils/home';

const VENDOR_MEDIA_BASE_URL = 'https://dev.dabablane.com/storage/uploads/vendor_images/';

const buildVendorAssetUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${VENDOR_MEDIA_BASE_URL}${path}`;
};

const sanitizeUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

interface VendorInfo {
  id: number;
  name: string;
  description: string;
  city: string;
  coverImages: string[];
  social: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    phone?: string;
    landline?: string;
  };
}

const VendorDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blanes, setBlanes] = useState<Blane[]>([]);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let isActive = true;
    const fetchVendorData = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // HARDCODED DATA FROM CURL
        const hardcodedVendor = {
          id: 17,
          name: 'John Doe',
          company_name: 'Vendor Co.',
          phone: '+1234567890',
          city: 'New York',
          landline: '+12025550123',
          description: 'A premium dining experience with a focus on local cuisine.',
          address: '123 Main Street, New York, NY 10001',
          logoUrl: '17563555662kA8n4FZE2.png',
          coverPhotoUrl: '17563555662kA8n4FZE2.png',
          facebook: 'http://www.facebook.com',
          tiktok: 'http://www.tiktok.com',
          instagram: 'http://www.instagram.com',
        };

        const hardcodedBlanes = [
          {
            id: 541,
            name: 'Drawing Paper',
            description: 'test',
            price_current: '300.00',
            price_old: null,
            slug: 'drawing-paper',
            rating: '0',
            blane_images: [
              {
                id: 641,
                image_link: 'https://dev.dabablane.com/storage/uploads/blanes_images/1761731045rMOokcI1Y4.jpg',
              },
            ],
          },
          {
            id: 540,
            name: 'Digital order',
            description: 'formation IA',
            price_current: '1000.00',
            price_old: '800.00',
            slug: 'digital-order',
            rating: '0',
            blane_images: [
              {
                id: 639,
                image_link: 'https://dev.dabablane.com/storage/uploads/blanes_images/1761730273sYL1Deja22.jpg',
              },
            ],
          },
          {
            id: 538,
            name: 'test 1',
            description: 'test 1',
            price_current: '500.00',
            price_old: null,
            slug: 'test-1',
            rating: '0',
            blane_images: [
              {
                id: 637,
                image_link: 'https://dev.dabablane.com/storage/uploads/blanes_images/1761650368rC5YIHkOkh.jpg',
              },
            ],
          },
        ] as any[];

        if (isActive) setBlanes(hardcodedBlanes);

        const blaneImages = hardcodedBlanes
          .flatMap((blane) => blane.blane_images?.map((img: any) => img.image_link) || [])
          .filter((image): image is string => Boolean(image))
          .slice(0, 6);

        const coverImage = buildVendorAssetUrl(hardcodedVendor.coverPhotoUrl);
        const imageSet = Array.from(
          new Set([coverImage, ...blaneImages].filter(Boolean)),
        );

        if (!isActive) return;

        setVendorInfo({
          id: hardcodedVendor.id,
          name: hardcodedVendor.company_name,
          description: hardcodedVendor.description,
          city: hardcodedVendor.city,
          coverImages: imageSet.length > 0 ? imageSet : [''],
          social: {
            facebook: sanitizeUrl(hardcodedVendor.facebook),
            instagram: sanitizeUrl(hardcodedVendor.instagram),
            tiktok: sanitizeUrl(hardcodedVendor.tiktok),
            phone: hardcodedVendor.phone ? `tel:${hardcodedVendor.phone}` : undefined,
            landline: hardcodedVendor.landline ? `tel:${hardcodedVendor.landline}` : undefined,
          },
        });
        if (isActive) setCurrentImageIndex(0);

        if (isActive) setLoading(false);
      } catch (err) {
        console.error('Error loading vendor data:', err);
        setError('Erreur lors du chargement des données du vendeur');
        if (isActive) setLoading(false);
      }
    };

    fetchVendorData();
    return () => {
      isActive = false;
    };
  }, [slug]);

  const handlePrevImage = () => {
    if (vendorInfo && vendorInfo.coverImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? vendorInfo.coverImages.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (vendorInfo && vendorInfo.coverImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === vendorInfo.coverImages.length - 1 ? 0 : prev + 1
      );
    }
  };

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
      {/* Hero Banner with Image Carousel */}
      <div className="relative h-[400px] overflow-hidden">
        {/* Background Image */}
        <img
          src={getPlaceholderImage(
            vendorInfo.coverImages[currentImageIndex] || '', 
            1920, 
            400
          )}
          alt={vendorInfo.name}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-black bg-opacity-60" />
        
        {/* Navigation Arrows */}
        {vendorInfo.coverImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <div className="text-center text-white max-w-3xl">
            {/* Description/Tagline */}
            <p className="text-sm md:text-base text-white/90 mb-2">
              {vendorInfo.description}
            </p>
            
            {/* Vendor Name */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {vendorInfo.name}
            </h1>
            
            {/* Social Media Icons */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {vendorInfo.social.facebook && (
                <a
                  href={vendorInfo.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {vendorInfo.social.instagram && (
                <a
                  href={vendorInfo.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {vendorInfo.social.tiktok && (
                <a
                  href={vendorInfo.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all duration-300"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
              {vendorInfo.social.phone && (
                <a
                  href={vendorInfo.social.phone}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all duration-300"
                  aria-label="Phone"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
              {!vendorInfo.social.phone && vendorInfo.social.landline && (
                <a
                  href={vendorInfo.social.landline}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all duration-300"
                  aria-label="Landline"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
            
            {/* Location */}
            <div className="flex items-center justify-center gap-2 text-sm md:text-base">
              <MapPin className="w-5 h-5" />
              <span>{vendorInfo.city}</span>
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

