import { Button } from '@/user/components/ui/button';
import { Link } from 'react-router-dom';
import { Banner } from "@/user/lib/types/home";
import { getPlaceholderImage } from "@/user/lib/utils/home";


interface DynamicBannerProps {
  banner: Banner;
}

const DynamicBanner = ({ banner }: DynamicBannerProps) => {
  if (!banner) return null;

  const bannerImage = getPlaceholderImage(banner?.image_link2);
  const isVideo = banner.is_video2 || (typeof banner.image_link2 === "string" && banner.image_link2.endsWith(".mp4"));

  return (
    <section className="relative h-[300px] overflow-hidden">
      <div className="absolute inset-0">
        {isVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            poster={bannerImage}
          >
            <source src={banner.image_link2} type="video/mp4" />
            Votre navigateur ne supporte pas la balise vidéo.
          </video>
        ) : (
          <img
            src={bannerImage}
            alt="Offre spéciale"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
        <div className="max-w-lg text-white">
          <h2 className="text-3xl font-bold mb-4">
            {banner?.title2}
          </h2>
          <p className="text-lg mb-6">
            {banner?.description2}
          </p>
          <Link to={banner?.link2}>
            <Button className="bg-[#197874] hover:bg-[#197874]/90 text-white" size="lg" variant="default">
              {banner?.btname2}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DynamicBanner;


