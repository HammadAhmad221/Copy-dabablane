import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Facebook, Instagram, Pause, Phone, Play, Volume2, VolumeX } from 'lucide-react';
import { Blane } from '@/user/lib/types/home';
import Loader from '@/user/components/ui/Loader';
import { getPlaceholderImage } from '@/user/lib/utils/home';
import { VendorCoverMediaItem, VendorService, VendorDetailData } from '@/user/lib/api/services/vendorService';
import { BlaneService } from '@/user/lib/api/services/blaneService';

const VENDOR_MEDIA_BASE_URL = 'https://dev.dabablane.com/storage/uploads/vendor_images/';

const buildVendorAssetUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${VENDOR_MEDIA_BASE_URL}${path}`;
};

const isVideoUrl = (url: string): boolean => {
  const normalized = url.split('?')[0].toLowerCase();
  return /\.(mp4|mov|webm|ogg)$/.test(normalized);
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
  businessCategory?: string;
  subCategory?: string;
  city: string;
  address?: string;
  district?: string;
  subdistrict?: string;
  logoUrl?: string;
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
  const { name } = useParams<{ name: string }>();
  const location = useLocation();
  const [blanes, setBlanes] = useState<Blane[]>([]);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoMediaUrls, setVideoMediaUrls] = useState<Set<string>>(new Set());
  const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(false);
  const [isHeroVideoMuted, setIsHeroVideoMuted] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const navigationState = (location.state || {}) as {
    autoplayHeroVideo?: boolean;
    heroMediaUrl?: string;
  };
  const [shouldAutoplayHeroVideo, setShouldAutoplayHeroVideo] = useState<boolean>(
    Boolean(navigationState.autoplayHeroVideo),
  );
  const [autoplayHeroMediaUrl, setAutoplayHeroMediaUrl] = useState<string | undefined>(
    navigationState.heroMediaUrl,
  );

  const AUTO_SLIDE_MS = 5000;

  useEffect(() => {
    let isActive = true;
    const fetchVendorData = async () => {
      if (!name) return;

      try {
        setLoading(true);
        setError(null);

        // Convert slugified name back to original format (replace hyphens with spaces)
        const decodedName = name.replace(/-/g, ' ');

        // Fetch vendor details by ID or company name
        const vendorResponse = await VendorService.getVendorByIdOrCompanyName(decodedName);

        if (!vendorResponse.status || !vendorResponse.data) {
          setError('Vendeur non trouvé');
          if (isActive) {
            setVendorInfo(null);
            setBlanes([]);
            setLoading(false);
          }
          return;
        }

        const vendor: VendorDetailData = vendorResponse.data;

        // Fetch blanes for this vendor using company_name
        const blanesResponse = await BlaneService.getBlanesByVendor({
          commerce_name: vendor.company_name,
          paginationSize: 100,
          page: 1,
          include: 'blaneImages,subcategory,category',
        });

        const blanesData = blanesResponse.data ?? [];
        if (isActive) setBlanes(blanesData);

        // Extract blane images for carousel
        const blaneImages = blanesData
          .flatMap((blane: Blane) => blane.blane_images?.map((img) => img.image_link) || [])
          .filter((image): image is string => Boolean(image))
          .slice(0, 6);

        const coverImage = buildVendorAssetUrl(vendor.coverPhotoUrl);

        const rawCoverMedia = Array.isArray(vendor.cover_media) ? vendor.cover_media : [];
        const vendorCoverUrls = rawCoverMedia
          .map((media) => {
            if (typeof media === 'string') {
              return media.startsWith('http') ? media : buildVendorAssetUrl(media);
            }
            const obj = media as VendorCoverMediaItem;
            const mediaUrl = obj.media_url || obj.url;
            if (!mediaUrl) return '';
            return mediaUrl.startsWith('http') ? mediaUrl : buildVendorAssetUrl(mediaUrl);
          })
          .filter(Boolean);

        const videoUrls = new Set(
          rawCoverMedia
            .filter((m) => typeof m !== 'string' && String((m as VendorCoverMediaItem)?.media_type || '').toLowerCase() === 'video')
            .map((m) => {
              const obj = m as VendorCoverMediaItem;
              const mediaUrl = obj.media_url || obj.url;
              if (!mediaUrl) return '';
              return mediaUrl.startsWith('http') ? mediaUrl : buildVendorAssetUrl(mediaUrl);
            })
            .filter(Boolean),
        );

        const mergedMedia: string[] = [];
        const pushUnique = (value: string) => {
          if (!value) return;
          if (mergedMedia.includes(value)) return;
          mergedMedia.push(value);
        };

        vendorCoverUrls.forEach(pushUnique);
        pushUnique(coverImage);
        blaneImages.forEach(pushUnique);

        const imageSet = mergedMedia.length > 0 ? mergedMedia : [''];

        if (!isActive) return;

        setVendorInfo({
          id: vendor.id,
          name: vendor.company_name || vendor.name,
          description: vendor.description || 'Découvrez nos offres exclusives',
          businessCategory: vendor.businessCategory || undefined,
          subCategory: vendor.subCategory || undefined,
          city: vendor.city || 'Ville non renseignée',
          address: vendor.address || undefined,
          district: vendor.district || undefined,
          subdistrict: vendor.subdistrict || undefined,
          logoUrl: buildVendorAssetUrl(vendor.logoUrl),
          coverImages: imageSet.length > 0 ? imageSet : [''],
          social: {
            facebook: sanitizeUrl(vendor.facebook),
            instagram: sanitizeUrl(vendor.instagram),
            tiktok: sanitizeUrl(vendor.tiktok),
            phone: vendor.phone ? `tel:${vendor.phone}` : undefined,
            landline: vendor.landline ? `tel:${vendor.landline}` : undefined,
          },
        });

        setVideoMediaUrls(videoUrls);
        
        if (isActive) {
          setCurrentImageIndex(0);
          setIsHeroVideoPlaying(false);
          setLoading(false);
        }
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
  }, [name]);

  useEffect(() => {
    setShouldAutoplayHeroVideo(Boolean(navigationState.autoplayHeroVideo));
    setAutoplayHeroMediaUrl(navigationState.heroMediaUrl);
  }, [navigationState.autoplayHeroVideo, navigationState.heroMediaUrl, name]);

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

  useEffect(() => {
    setIsHeroVideoPlaying(false);
    if (heroVideoRef.current) {
      heroVideoRef.current.pause();
      heroVideoRef.current.currentTime = 0;
    }
  }, [currentImageIndex]);

  useEffect(() => {
    if (!vendorInfo) return;
    if (!shouldAutoplayHeroVideo) return;
    if (!autoplayHeroMediaUrl) return;

    const index = vendorInfo.coverImages.findIndex((value) => value === autoplayHeroMediaUrl);
    if (index >= 0 && index !== currentImageIndex) {
      setIsHeroVideoMuted(true);
      setCurrentImageIndex(index);
    }
  }, [vendorInfo, shouldAutoplayHeroVideo, autoplayHeroMediaUrl, currentImageIndex]);

  useEffect(() => {
    if (!vendorInfo) return;
    if (!shouldAutoplayHeroVideo) return;

    const currentMedia = vendorInfo.coverImages[currentImageIndex] || '';
    const isCurrentMediaVideo = isVideoUrl(currentMedia) || videoMediaUrls.has(currentMedia);
    if (!isCurrentMediaVideo) return;

    const el = heroVideoRef.current;
    if (!el) return;

    el.muted = true;
    setIsHeroVideoMuted(true);

    const play = async () => {
      try {
        await el.play();
        setIsHeroVideoPlaying(true);
      } catch {
        setIsHeroVideoPlaying(false);
      } finally {
        setShouldAutoplayHeroVideo(false);
      }
    };

    void play();
  }, [vendorInfo, currentImageIndex, shouldAutoplayHeroVideo, videoMediaUrls]);

  useEffect(() => {
    if (!vendorInfo || vendorInfo.coverImages.length <= 1) return;

    const currentMedia = vendorInfo.coverImages[currentImageIndex] || '';
    const isCurrentMediaVideo = isVideoUrl(currentMedia) || videoMediaUrls.has(currentMedia);

    if (isCurrentMediaVideo && isHeroVideoPlaying) return;

    const intervalId = window.setInterval(() => {
      handleNextImage();
    }, AUTO_SLIDE_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [vendorInfo, currentImageIndex, videoMediaUrls, isHeroVideoPlaying]);

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

  const currentMedia = vendorInfo.coverImages[currentImageIndex] || '';
  const isCurrentMediaVideo = isVideoUrl(currentMedia) || videoMediaUrls.has(currentMedia);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner with Image/Video Carousel */}
      <div className="relative h-[320px] sm:h-[380px] md:h-[420px] lg:h-[460px] overflow-hidden">
        {/* Background Image or Video */}
        {isCurrentMediaVideo ? (
          <video
            key={currentImageIndex}
            src={currentMedia}
            ref={(el) => {
              heroVideoRef.current = el;
              if (el) {
                el.autoplay = false;
              }
            }}
            className="w-full h-full object-cover"
            muted={isHeroVideoMuted}
            playsInline
            preload="metadata"
            onPlay={() => {
              setIsHeroVideoPlaying(true);
            }}
            onPause={() => {
              setIsHeroVideoPlaying(false);
            }}
            onEnded={() => {
              const el = heroVideoRef.current;
              if (el) {
                el.pause();
                try {
                  el.currentTime = 0;
                } catch {
                  // Ignore reset errors
                }
              }
              setIsHeroVideoPlaying(false);
              handleNextImage();
            }}
          />
        ) : (
          <img
            src={getPlaceholderImage(currentMedia, 1920, 400)}
            alt={vendorInfo.name}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        )}

        {isCurrentMediaVideo && (
          <>
            <button
              type="button"
              className="absolute top-4 right-16 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full h-11 w-11 flex items-center justify-center transition-all duration-300"
              onClick={() => {
                const el = heroVideoRef.current;
                const nextMuted = !isHeroVideoMuted;
                setIsHeroVideoMuted(nextMuted);
                if (el) {
                  el.muted = nextMuted;
                  if (!nextMuted && el.volume === 0) {
                    el.volume = 1;
                  }
                }
              }}
            >
              {isHeroVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              type="button"
              className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full h-11 w-11 flex items-center justify-center transition-all duration-300"
              onClick={async () => {
                const el = heroVideoRef.current;
                if (!el) return;

                if (isHeroVideoPlaying) {
                  el.pause();
                  el.currentTime = 0;
                  setIsHeroVideoPlaying(false);
                  return;
                }

                try {
                  await el.play();
                  setIsHeroVideoPlaying(true);
                } catch {
                  setIsHeroVideoPlaying(false);
                }
              }}
            >
              {isHeroVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-60" />
        
        {/* Navigation Arrows */}
        {vendorInfo.coverImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-3 sm:left-4 top-[62%] sm:top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-3 sm:right-4 top-[62%] sm:top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-14 sm:px-6">
          <div className="text-center text-white w-full max-w-3xl">
            {/* Vendor Name */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 break-words">
              {vendorInfo.name}
            </h1>

            {(vendorInfo.businessCategory || vendorInfo.subCategory) && (
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                {vendorInfo.businessCategory && (
                  <span className="px-3 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm text-white rounded-full">
                    {vendorInfo.businessCategory}
                  </span>
                )}
                {vendorInfo.subCategory && (
                  <span className="px-3 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm text-white rounded-full">
                    {vendorInfo.subCategory}
                  </span>
                )}
              </div>
            )}
            
            {/* Description/Tagline */}
            <p className="mx-auto max-w-prose text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed text-white/90 mb-5 sm:mb-6 whitespace-normal break-words">
              {vendorInfo.description}
            </p>
            
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
            <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base flex-wrap px-2">
              {(() => {
                const locationParts = [
                  vendorInfo.address,
                  vendorInfo.subdistrict,
                  vendorInfo.district,
                  vendorInfo.city,
                ].filter(Boolean);
                const fullLocation = locationParts.join(', ');
                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(fullLocation)}`;
                
                return (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-2 hover:opacity-80 active:opacity-60 transition-opacity duration-200 touch-action-manipulation"
                    title={`Voir sur Google Maps: ${fullLocation}`}
                  >
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                    <span className="line-clamp-2 sm:line-clamp-1">{fullLocation || vendorInfo.city}</span>
                  </a>
                );
              })()}
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
              const mediaUrl = blane.blane_images?.[0]?.image_link || '';
              const categoryName = (blane as any)?.category?.name as string | undefined;
              const subcategoryName = blane.subcategory?.name;
              
              // Check if media is video
              const isVideo = mediaUrl.toLowerCase().match(/\.(mp4|mov|webm|ogg)$/);

              return (
                <div
                  key={blane.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Image or Video */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {isVideo ? (
                      <video
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    ) : (
                      <img
                        src={getPlaceholderImage(mediaUrl, 400, 300)}
                        alt={blane.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-800 flex-1">
                        {blane.name}
                      </h3>
                    </div>

                    {(categoryName || subcategoryName) && (
                      <p className="text-sm text-gray-500 mb-3">
                        {categoryName || '---'}
                        {subcategoryName ? ` / ${subcategoryName}` : ''}
                      </p>
                    )}

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

