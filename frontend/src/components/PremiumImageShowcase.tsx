import React, { useEffect, useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { carouselService } from '../services/carouselService';
import { CarouselImage } from '../types';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export const PremiumImageShowcase: React.FC = () => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<any>(null);

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

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-ashram-cream dark:bg-darkAshram-bg overflow-hidden relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
            <div className="h-4 w-40 bg-ashram-gold/20 animate-pulse mx-auto mb-4 rounded"></div>
            <div className="h-10 w-64 sm:w-96 bg-ashram-green/10 dark:bg-darkAshram-gold/10 animate-pulse mx-auto mb-6 rounded"></div>
         </div>
         <div className="flex justify-center items-center gap-4 px-4 opacity-50">
            <div className="w-[15vw] h-64 bg-black/5 animate-pulse rounded-2xl hidden md:block"></div>
            <div className="w-[30vw] h-80 bg-black/10 animate-pulse rounded-2xl hidden sm:block"></div>
            <div className="w-[80vw] sm:w-[55vw] md:w-[45vw] lg:w-[40vw] xl:w-[35vw] max-w-[600px] aspect-[3/2] bg-black/15 animate-pulse rounded-2xl shadow-xl border border-ashram-border/50"></div>
            <div className="w-[30vw] h-80 bg-black/10 animate-pulse rounded-2xl hidden sm:block"></div>
            <div className="w-[15vw] h-64 bg-black/5 animate-pulse rounded-2xl hidden md:block"></div>
         </div>
      </section>
    );
  }

  if (images.length === 0) {
    return (
      <section className="py-12 sm:py-16 bg-ashram-cream dark:bg-darkAshram-bg overflow-hidden text-center">
         <div className="p-12 rounded-3xl bg-ashram-green/5 dark:bg-darkAshram-surface inline-block border border-ashram-border/50">
            <p className="text-ashram-muted dark:text-darkAshram-muted text-lg font-sans">No gallery moments available yet.</p>
         </div>
      </section>
    );
  }

  return (
    <section className="py-24 sm:py-32 bg-ashram-cream dark:bg-darkAshram-bg overflow-hidden relative">
      
      {/* Background elegant gradient/glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-ashram-gold/30 to-transparent"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] sm:w-3/4 h-[120%] sm:h-3/4 bg-ashram-saffron/5 dark:bg-ashram-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center relative z-10">
        <span className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-ashram-saffron dark:text-darkAshram-gold mb-2 block drop-shadow-sm">
          JOURNEY • WISDOM • BLESSINGS
        </span>
        <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-ashram-green dark:text-ashram-cream mb-4 drop-shadow-sm">
          A Journey of Wisdom & Grace
        </h2>
        <p className="text-base sm:text-lg text-ashram-charcoal/80 dark:text-darkAshram-muted max-w-2xl mx-auto">
          A glimpse into Guruji’s inspiring journey, teachings, blessings and the countless lives touched by his presence.
        </p>
      </div>

      <div className="relative w-full max-w-[1600px] mx-auto group pb-10">
        <style>
          {`
            .premium-swiper .swiper-slide {
              transition: filter 0.8s ease, opacity 0.8s ease;
              filter: brightness(0.7) contrast(0.9);
              opacity: 0.6;
            }
            .premium-swiper .swiper-slide-active {
              filter: brightness(1) contrast(1.05);
              opacity: 1;
              z-index: 10 !important;
            }
            .premium-swiper .swiper-slide-active .card-inner {
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(220, 150, 70, 0.4);
            }
          `}
        </style>

        <Swiper
          modules={[Navigation, Pagination, EffectCoverflow, Autoplay]}
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          loop={true}
          speed={1200} /* Smooth elegant speed */
          slidesPerView={'auto'}
          coverflowEffect={{
            rotate: 0,
            stretch: 60, /* Creates nice spacing between cards */
            depth: 300,  /* Pushes side cards further back */
            modifier: 1,
            slideShadows: true,
            scale: 0.85 /* Progressive scaling */
          }}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          pagination={{
            el: '.showcase-pagination',
            clickable: true,
            bulletActiveClass: 'bg-ashram-saffron scale-150 opacity-100 shadow-[0_0_10px_rgba(220,150,70,0.6)]',
            bulletClass: 'swiper-pagination-bullet bg-ashram-muted dark:bg-darkAshram-muted opacity-40 w-2 h-2 mx-2 transition-all duration-500 rounded-full inline-block cursor-pointer'
          }}
          onBeforeInit={(swiper) => {
            swiperRef.current = swiper;
          }}
          className="premium-swiper w-full !px-4 sm:!px-10"
        >
          {images.map((item) => (
            <SwiperSlide key={item._id} className="w-[80vw] sm:w-[55vw] md:w-[45vw] lg:w-[40vw] xl:w-[35vw] max-w-[600px]">
              <div className="card-inner relative aspect-[3/2] rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 dark:border-white/5 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group/card hover:!scale-[1.02]">
                <img
                  src={item.image}
                  alt={item.title || "Spiritual Gallery Image"}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80';
                  }}
                  className="w-full h-full object-cover transition-all duration-[1500ms] ease-out opacity-90 group-hover/card:opacity-100 group-hover/card:scale-105"
                />

                
                {/* Always-on subtle bottom gradient for better contrast */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60"></div>
                
                {/* Content Overlay - revealed on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-6 sm:p-10 pointer-events-none">
                  {(item.title || item.category || item.description) && (
                    <div className="transform translate-y-8 group-hover/card:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
                      {item.category && (
                        <span className="inline-block text-ashram-saffron dark:text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-3 px-3 py-1 rounded-full border border-ashram-saffron/30 bg-black/40 backdrop-blur-sm">
                          {item.category}
                        </span>
                      )}
                      {item.title && (
                        <h3 className="text-white font-heading font-black text-2xl sm:text-3xl md:text-4xl mb-3 leading-tight drop-shadow-lg">
                          {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <p className="text-white/80 text-sm sm:text-base line-clamp-3 max-w-xl drop-shadow font-sans font-light leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-6 h-0.5 w-16 bg-gradient-to-r from-ashram-saffron to-amber-500 rounded-full shadow-[0_0_10px_rgba(220,150,70,0.5)]"></div>
                    </div>
                  )}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation */}
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          className="flex absolute top-1/2 left-2 sm:left-4 xl:left-8 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-black/40 sm:bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-ashram-saffron hover:border-ashram-saffron transition-all duration-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ashram-saffron/50 group/btn"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ml-[-2px] drop-shadow-md group-hover/btn:drop-shadow-none" />
        </button>
        <button
          onClick={() => swiperRef.current?.slideNext()}
          className="flex absolute top-1/2 right-2 sm:right-4 xl:right-8 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-black/40 sm:bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-ashram-saffron hover:border-ashram-saffron transition-all duration-500 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ashram-saffron/50 group/btn"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-[-2px] drop-shadow-md group-hover/btn:drop-shadow-none" />
        </button>
        
        {/* Pagination Container */}
        <div className="showcase-pagination absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center z-20 h-8"></div>
      </div>
    </section>
  );
};
