import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/admin/components/ui/dialog';
import { Button } from '@/admin/components/ui/button';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  alt?: string;
}

const isVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
};

const getVideoMimeType = (url: string): string | undefined => {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.mp4') || clean.endsWith('.m4v')) return 'video/mp4';
  if (clean.endsWith('.webm')) return 'video/webm';
  if (clean.endsWith('.ogg')) return 'video/ogg';
  if (clean.endsWith('.mov')) return 'video/quicktime';
  return undefined;
};

const DEFAULT_VIDEO_POSTER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDY0MCAzNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSIzNjAiIGZpbGw9IiMwQjBGMTEiLz48Y2lyY2xlIGN4PSIzMjAiIGN5PSIxODAiIHI9IjU4IiBmaWxsPSIjMTExODI3IiBzdHJva2U9IiM0QjU1NjMiIHN0cm9rZS13aWR0aD0iNCIvPjxwYXRoIGQ9Ik0zMDIgMTQ5VjIxMUwzNTQgMTgwTDMwMiAxNDlaIiBmaWxsPSIjRTVFN0VCIi8+PHRleHQgeD0iMzIwIiB5PSIzMDUiIGZpbGw9IiM5Q0EzQUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VmlkZW8gcHJldmlldyA8L3RleHQ+PC9zdmc+';

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  alt = 'Image'
}) => {
  const [videoDecodeFailed, setVideoDecodeFailed] = React.useState(false);
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentIndex > 0) {
          onIndexChange(currentIndex - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (currentIndex < images.length - 1) {
          onIndexChange(currentIndex + 1);
        }
        break;
    }
  }, [isOpen, onClose, currentIndex, images.length, onIndexChange]);

  // Handle touch/swipe gestures
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const deltaX = startX - moveTouch.clientX;
      const deltaY = startY - moveTouch.clientY;

      // Only handle horizontal swipes if they're more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && currentIndex < images.length - 1) {
          // Swipe left - next image
          onIndexChange(currentIndex + 1);
        } else if (deltaX < 0 && currentIndex > 0) {
          // Swipe right - previous image
          onIndexChange(currentIndex - 1);
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [currentIndex, images.length, onIndexChange]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentImage = images[currentIndex];
  const isCurrentVideo = Boolean(currentImage && isVideoUrl(currentImage));

  useEffect(() => {
    setVideoDecodeFailed(false);
  }, [currentIndex, isCurrentVideo]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white hover:text-white border border-white/40 hover:border-white/60 rounded-full backdrop-blur-sm transition-all duration-200 shadow-xl hover:shadow-2xl"
          >
            <Icon icon="lucide:x" className="h-6 w-6 drop-shadow-lg" />
          </Button>

          {/* Previous button */}
          {images.length > 1 && currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onIndexChange(currentIndex - 1)}
              className="absolute left-4 top-[365px] transform -translate-y-1/2 z-50 bg-black/60 hover:bg-black/80 text-white hover:text-white border border-white/40 hover:border-white/60 rounded-full backdrop-blur-sm transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              <Icon icon="lucide:chevron-left" className="h-8 w-8 drop-shadow-lg" />
            </Button>
          )}

          {/* Next button */}
          {images.length > 1 && currentIndex < images.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onIndexChange(currentIndex + 1)}
              className="absolute right-4 top-[365px] transform -translate-y-1/2 z-50 bg-black/60 hover:bg-black/80 text-white hover:text-white border border-white/40 hover:border-white/60 rounded-full backdrop-blur-sm transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              <Icon icon="lucide:chevron-right" className="h-8 w-8 drop-shadow-lg" />
            </Button>
          )}

          {/* Image */}
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
          >
            <AnimatePresence mode="wait">
              {isCurrentVideo ? (
                <motion.div
                  key={currentIndex}
                  className="max-w-full max-h-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <video
                    className="max-w-full max-h-full object-contain bg-black"
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    poster={DEFAULT_VIDEO_POSTER}
                    crossOrigin="anonymous"
                    src={currentImage}
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      if (v.videoWidth === 0 || v.videoHeight === 0) {
                        setVideoDecodeFailed(true);
                      }
                    }}
                  >
                    <source src={currentImage} type={getVideoMimeType(currentImage)} />
                  </video>
                  {videoDecodeFailed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white p-4 text-center">
                      <div className="text-sm">Video track not supported by this browser</div>
                      <a
                        className="text-xs underline"
                        href={currentImage}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open video in new tab
                      </a>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.img
                  key={currentIndex}
                  src={currentImage}
                  alt={`${alt} ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjEyTDE1IDE1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=';
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm border border-white/30 backdrop-blur-sm shadow-lg">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto p-2 bg-black/30 backdrop-blur-sm rounded-lg">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => onIndexChange(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200 shadow-lg hover:shadow-xl ${
                    index === currentIndex 
                      ? 'border-white shadow-xl ring-2 ring-white/50' 
                      : 'border-white/40 hover:border-white/70'
                  }`}
                >
                  {isVideoUrl(image) ? (
                    <div className="relative w-full h-full">
                      <video
                        className="w-full h-full object-cover bg-black"
                        preload="metadata"
                        muted
                        playsInline
                        poster={DEFAULT_VIDEO_POSTER}
                        crossOrigin="anonymous"
                        src={image}
                      >
                        <source src={image} type={getVideoMimeType(image)} />
                      </video>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Icon icon="lucide:play" className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={image} 
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjEyTDE1IDE1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
