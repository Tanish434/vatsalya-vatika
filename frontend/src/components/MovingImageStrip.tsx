import React, { useEffect, useState } from 'react';
import { carouselService } from '../services/carouselService';
import { CarouselImage } from '../types';

export const MovingImageStrip: React.FC = () => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = carouselService.subscribeToCarousel((data) => {
      const activeImages = data.filter(img => img.isActive);
      setImages(activeImages);
      setLoading(false);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  if (loading || images.length === 0) {
    return null; // Return nothing if no images or loading
  }

  // Duplicate images to create a seamless infinite loop
  const duplicatedImages = [...images, ...images];

  return (
    <div className="w-full overflow-hidden bg-ashram-cream dark:bg-darkAshram-bg py-6 sm:py-8 border-y border-ashram-border/50 dark:border-darkAshram-border/50 relative">
      <style>
        {`
          @keyframes infiniteScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-infinite-scroll {
            display: flex;
            width: fit-content;
            animation: infiniteScroll 40s linear infinite;
          }
          .animate-infinite-scroll:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-ashram-cream dark:from-darkAshram-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-ashram-cream dark:from-darkAshram-bg to-transparent z-10 pointer-events-none" />

      <div className="animate-infinite-scroll gap-4 sm:gap-6 px-4">
        {duplicatedImages.map((item, idx) => (
          <div
            key={`${item._id}-${idx}`}
            className="relative flex-shrink-0 w-40 sm:w-48 lg:w-56 aspect-[4/3] rounded-xl overflow-hidden shadow-soft cursor-pointer group bg-ashram-green/5 dark:bg-darkAshram-card transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl hover:z-20"
          >
            <img
              src={item.image}
              alt=""
              loading="lazy"
              draggable={false}
              className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
