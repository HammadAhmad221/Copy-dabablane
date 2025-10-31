import type React from "react"
import { motion } from "framer-motion"

interface BannerPreviewProps {
  title: string
  description: string
  buttonText?: string
  buttonLink?: string
  imageUrl: string
  type: "hero" | "banner"
  isVideo?: boolean
}

const BannerPreview: React.FC<BannerPreviewProps> = ({
  title,
  description,
  buttonText,
  buttonLink,
  imageUrl,
  type,
  isVideo = false,
}) => {
  const isHero = type === "hero"

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-lg shadow-xl ${isHero ? "h-[400px]" : "h-[150px]"}`}
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
      }}
    >
      {isVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={imageUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="text-center text-white p-6">
          <h2 className={`font-bold mb-2 ${isHero ? "text-4xl" : "text-2xl"}`}>{title}</h2>
          <p className={`mb-4 ${isHero ? "text-lg" : "text-sm"}`}>{description}</p>
          {buttonText && buttonLink && (
            <a
              href={buttonLink}
              className="inline-block bg-[#00897B] hover:bg-[#00796B] text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              {buttonText}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default BannerPreview

