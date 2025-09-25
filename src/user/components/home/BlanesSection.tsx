import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from '@/user/components/ui/carousel';
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { BlanesSectionProps, IndicatorButtonProps } from '@/user/lib/types/blane';
import BlaneCard from '@/user/components/BlaneCard';

const IndicatorButton = memo(({ 
  active, 
  onClick,
  index
}: IndicatorButtonProps) => (
  <button
    type="button"
    aria-label={`Go to slide ${index + 1}`}
    className={`h-2 rounded-full transition-all duration-300 ${
      active 
        ? 'bg-primary w-12'
        : 'bg-gray-300 w-4 hover:bg-gray-400'
    }`}
    onClick={onClick}
  />
));

const BlanesSection = ({ title, blanes = [], linkUrl, className = '', isPriority = false }: BlanesSectionProps & { isPriority?: boolean }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!api) return;

    // Start auto-scrolling
    const startAutoScroll = () => {
      intervalRef.current = window.setInterval(() => {
        api.scrollNext();
      }, 8000); // Change slide every 8 seconds
    };

    // Clear interval when user interacts with carousel
    const clearAutoScroll = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Restart auto-scroll after user interaction
    const restartAutoScroll = () => {
      clearAutoScroll();
      setTimeout(() => {
        startAutoScroll();
      }, 1000);
    };

    startAutoScroll();

    // Setup event listeners to pause on interaction
    api.on("pointerDown", clearAutoScroll);
    api.on("pointerUp", restartAutoScroll);

    // Cleanup on unmount
    return () => {
      clearAutoScroll();
      api.off("pointerDown", clearAutoScroll);
      api.off("pointerUp", restartAutoScroll);
    };
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  if (!blanes || blanes.length === 0) return null;

  return (
    <section className={`py-12 w-full ${className}`}>
      <header className="mb-8 flex justify-start items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
      </header>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
          dragFree: true,
          slidesToScroll: 1
        }}
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent className="-ml-4">
          {blanes.map((blane, index) => (
            <CarouselItem 
              key={blane.id} 
              className="pl-4 basis-[85%] sm:basis-[45%] md:basis-[40%] lg:basis-[32%]"
            >
              <BlaneCard blane={blane} isPriority={isPriority && index === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <nav className="flex justify-center gap-3 mt-6">
        {blanes.map((_, index) => (
          <IndicatorButton
            key={index}
            active={index === current}
            onClick={() => scrollTo(index)}
            index={index}
          />
        ))}
      </nav>
    </section>
  );
};

export default memo(BlanesSection);