import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, Image as ImageIcon, Sparkles } from 'lucide-react';
import { GalleryItem } from '../types';
import { galleryService } from '../services/galleryService';

export const GalleryLightbox: React.FC = () => {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const unsubscribe = galleryService.subscribeToGallery((data) => {
      setGallery(data);
      setLoading(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const categories = ['All', 'Students', 'Events', 'Ashram', 'Activities'];
  const filteredGallery = activeCategory === 'All' ? gallery : gallery.filter(item => item.category === activeCategory);
  const isMoreThanThree = filteredGallery.length > 3;

  const openLightbox = (index: number) => { setLightboxIndex(index); setIsZoomed(false); };
  const closeLightbox = () => { setLightboxIndex(null); setIsZoomed(false); };
  
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev === 0 ? filteredGallery.length - 1 : prev! - 1));
    setIsZoomed(false);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev === filteredGallery.length - 1 ? 0 : prev! + 1));
    setIsZoomed(false);
  };

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative py-20 overflow-hidden bg-gradient-to-b from-white to-ashram-cream dark:from-darkAshram-surface dark:to-darkAshram-bg border-y border-ashram-border dark:border-darkAshram-border transition-colors duration-300"
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-400/5 dark:bg-amber-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-400/5 dark:bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-ashram-saffron dark:text-amber-400 font-bold mb-3 px-4 py-1.5 rounded-full bg-ashram-saffron/8 dark:bg-amber-900/20 border border-ashram-saffron/20 dark:border-amber-700/30">
              <Sparkles className="w-3 h-3" /> Visual Journey
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-ashram-green dark:text-darkAshram-gold leading-tight">
              Ashram Photo Gallery
            </h2>
            <div className="h-1.5 w-20 bg-gradient-to-r from-ashram-saffron to-ashram-gold rounded-full mt-4" />
          </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-ashram-green to-emerald-600 text-white border-transparent shadow-md sm:shadow-lg shadow-emerald-900/20 scale-105'
                  : 'bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text border-ashram-border dark:border-darkAshram-border hover:border-ashram-green/50 hover:text-ashram-green dark:hover:text-emerald-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid — 2 columns on mobile */}
      {loading ? (
        <div className={`grid gap-3 sm:gap-5 ${isMoreThanThree ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {[...Array(isMoreThanThree ? 4 : 3)].map((_, i) => (
            <div key={i} className={`h-36 sm:h-48 rounded-2xl sm:rounded-3xl bg-ashram-cream/80 dark:bg-darkAshram-card/80 animate-pulse border border-ashram-border/50`} />
          ))}
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="text-center py-20 bg-white/60 dark:bg-darkAshram-card/50 rounded-3xl border border-dashed border-ashram-border dark:border-darkAshram-border backdrop-blur-sm">
          <ImageIcon className="w-12 h-12 text-ashram-muted/30 mx-auto mb-4" />
          <p className="font-sans text-ashram-muted dark:text-darkAshram-muted font-medium">No gallery images found in this category.</p>
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-5 ${isMoreThanThree ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3'}`}>
          {filteredGallery.map((item, idx) => (
            <div
              key={item._id}
              onClick={() => openLightbox(idx)}
              className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/50 dark:border-darkAshram-border/50 shadow-md sm:shadow-lg hover:shadow-2xl dark:hover:shadow-dark-xl group cursor-pointer transition-all duration-500 hover:-translate-y-1.5 h-36 sm:h-48 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                style={{ objectPosition: item.focalPoint ? `${item.focalPoint.x}% ${item.focalPoint.y}%` : 'top center' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2.5 sm:p-4 text-white">
                <div className="flex justify-end">
                  <span className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-md shadow-sm">
                    <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </span>
                </div>
                <div>
                  <span className="inline-block text-[8px] sm:text-[10px] uppercase font-bold tracking-wider bg-ashram-saffron px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-white mb-1 sm:mb-2 shadow">
                    {item.category}
                  </span>
                  <h3 className="font-heading font-bold text-xs sm:text-lg leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Controls */}
          <button onClick={closeLightbox} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 backdrop-blur-sm">
            <X className="w-6 h-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }} className="absolute top-6 right-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 backdrop-blur-sm">
            <ZoomIn className={`w-6 h-6 ${isZoomed ? 'text-amber-400' : ''}`} />
          </button>
          
          <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 backdrop-blur-sm">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 backdrop-blur-sm">
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Content */}
          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src={filteredGallery[lightboxIndex].image}
                alt={filteredGallery[lightboxIndex].title}
                className={`max-h-[75vh] w-auto object-contain transition-transform duration-500 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                style={isZoomed && filteredGallery[lightboxIndex].focalPoint ? { transformOrigin: `${filteredGallery[lightboxIndex].focalPoint.x}% ${filteredGallery[lightboxIndex].focalPoint.y}%` } : undefined}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            </div>
            
            <div className="mt-6 text-center text-white max-w-2xl px-4">
              <h3 className="font-heading font-black text-2xl text-white tracking-wide">
                {filteredGallery[lightboxIndex].title}
              </h3>
              {filteredGallery[lightboxIndex].description && (
                <p className="text-base text-white/80 mt-2 font-sans leading-relaxed">
                  {filteredGallery[lightboxIndex].description}
                </p>
              )}
              <div className="flex items-center justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white/90">
                  {filteredGallery[lightboxIndex].category}
                </span>
                <span className="text-xs text-white/50 font-medium">
                  {lightboxIndex + 1} of {filteredGallery.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
