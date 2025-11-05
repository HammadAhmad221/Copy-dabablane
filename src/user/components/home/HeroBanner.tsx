import { Link } from "react-router-dom";
import { Button } from "@/user/components/ui/button";
import { Banner } from "@/user/lib/types/home";
import { getPlaceholderImage } from "@/user/lib/utils/home";

interface HeroBannerProps {
  banner: Banner;
}

const HeroBanner = ({ banner }: HeroBannerProps) => {
  if (!banner) return null;

  const bannerImage = getPlaceholderImage(banner?.image_link, 1920, 550);
  const isVideo = banner.is_video1 || (typeof banner.image_link === "string" && banner.image_link.endsWith(".mp4"));

  return (
    <section className="relative h-[550px]">
      {/* Background media */}
      {isVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          poster={bannerImage}
        >
          <source src={banner.image_link} type="video/mp4" />
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      ) : (
        <img
          src={bannerImage}
          alt={banner.title || "Bannière"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          width={1920}
          height={550}
          decoding="async"
          {...{ fetchpriority: "high" }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative max-full sm:w-1/2 justify-center text-center mx-auto px-4 h-full flex items-center">
        <div className="text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {banner?.title || "Bienvenue"}
          </h1>
          <p className="text-lg md:text-xl mb-8">
            {banner?.description || ""}
          </p>
          {banner?.link && banner?.btname1 && (
            <Link to={banner.link}>
              <Button
                size="lg"
                className="bg-[#197874] hover:bg-[#197874]/90 text-white"
              >
                {banner.btname1}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
