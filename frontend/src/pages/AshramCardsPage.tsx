import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Sparkles, X, ChevronLeft, ChevronRight, ArrowLeft, RefreshCw, Archive } from 'lucide-react';
import { memoryVaultService } from '../services/memoryVaultService';
import { MemoryVaultCard } from '../types';
import { ContributeModal } from '../components/ContributeModal';

export const GalleryPagePlaceholder: React.FC = () => null;

const DEFAULT_VAULT_IMAGE =
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80';

/* Fullscreen Luxury Lightbox */
const Lightbox: React.FC<{
  images: MemoryVaultCard[];
  initialIndex: number;
  onClose: () => void;
}> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  // Lock background scroll when open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prev, next, onClose]);

  // Touch swipe support for mobile / iPhone
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;
    if (distance > minSwipeDistance) {
      next();
    } else if (distance < -minSwipeDistance) {
      prev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = images[currentIndex];
  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[200] bg-black/90 dark:bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 select-none overflow-hidden"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background glow / spiritual vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ashram-gold/10 via-black/40 to-black/90" />

      {/* Top Header Bar */}
      <div
        className="w-full max-w-6xl flex items-center justify-between z-50 pt-2 px-2"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <span className="px-4 py-1.5 rounded-full bg-white/10 dark:bg-white/5 border border-white/15 backdrop-blur-md text-white text-xs font-bold tracking-widest shadow-lg">
            {currentIndex + 1} / {images.length}
          </span>
          {current.category && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-ashram-saffron/20 border border-ashram-saffron/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {current.category}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-rose-500/80 border border-white/15 hover:border-transparent text-white transition-all duration-300 backdrop-blur-md hover:rotate-90 hover:scale-105 active:scale-95 shadow-xl group/close"
          aria-label="Close Fullscreen View"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Main Centered Image Frame */}
      <div
        className="relative w-full flex-1 max-w-5xl flex items-center justify-center my-2 sm:my-4 px-2 sm:px-12"
        onClick={e => e.stopPropagation()}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current._id || currentIndex}
            custom={direction}
            initial={{ opacity: 0, scale: 0.94, x: direction * 35 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: -direction * 35 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.7),0_0_50px_rgba(220,150,70,0.15)] border border-white/20 dark:border-white/10 max-h-[68vh] sm:max-h-[75vh] flex items-center justify-center group/cardContainer"
          >
            <img
              src={current.image || DEFAULT_VAULT_IMAGE}
              alt={current.title || 'Ashram Memory'}
              className="w-auto h-auto max-w-full max-h-[68vh] sm:max-h-[75vh] object-contain transition-transform duration-700 ease-out hover:scale-[1.015] active:scale-[0.99]"
            />
            {/* Soft inner vignette */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/20 shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 dark:bg-black/40 hover:bg-ashram-saffron border border-white/20 hover:border-ashram-saffron text-white flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95 backdrop-blur-md group/navBtn"
          aria-label="Previous Memory"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 ml-[-2px] transition-transform group-hover/navBtn:-translate-x-0.5" />
        </button>

        <button
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 dark:bg-black/40 hover:bg-ashram-saffron border border-white/20 hover:border-ashram-saffron text-white flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95 backdrop-blur-md group/navBtn"
          aria-label="Next Memory"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 mr-[-2px] transition-transform group-hover/navBtn:translate-x-0.5" />
        </button>
      </div>

      {/* Floating Caption / Title Card */}
      <div
        className="w-full max-w-xl z-50 pb-2 px-2"
        onClick={e => e.stopPropagation()}
      >
        {(current.title || current.description) && (
          <div className="bg-black/50 dark:bg-black/75 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-3 text-center shadow-2xl mx-auto">
            {current.title && (
              <p className="text-white font-heading font-bold text-base sm:text-lg leading-snug drop-shadow-md">
                {current.title}
              </p>
            )}
            {current.description && (
              <p className="text-white/80 font-sans text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2 drop-shadow">
                {current.description}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* Deterministic rotation/offset seeds for photo-stack effect */
const ROTATIONS = [-6, 4, -3, 7, -5, 3, -7, 5, -4, 6];
const OFFSETS_X = [0, -8, 10, -5, 12, -10, 7, -12, 5, -7];
const OFFSETS_Y = [0, 5, -7, 9, -5, 7, -9, 5, -7, 9];

/* Single Memory Bundle - photo stack + full grid */
const MemoryBundle: React.FC<{
  images: MemoryVaultCard[];
  onPhotoClick: (index: number) => void;
}> = ({ images, onPhotoClick }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Archive className="w-16 h-16 text-ashram-muted/30" />
        <p className="font-heading font-bold text-xl text-ashram-green dark:text-darkAshram-gold">
          No memories yet
        </p>
        <p className="text-sm text-ashram-muted dark:text-darkAshram-muted">
          Photos added by admin will appear here.
        </p>
      </div>
    );
  }

  const STACK_COUNT = Math.min(5, images.length);
  const stackPhotos = images.slice(0, STACK_COUNT);
  const halfStack = Math.floor(STACK_COUNT / 2);

  return (
    <div className="w-full flex flex-col items-center gap-6">

      {/* Photo Stack - overlapping cards */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: 300, width: '100%', maxWidth: 560 }}
      >
        {stackPhotos.map((card, idx) => {
          const rot = ROTATIONS[idx % ROTATIONS.length];
          const ox = OFFSETS_X[idx % OFFSETS_X.length];
          const oy = OFFSETS_Y[idx % OFFSETS_Y.length];
          const isHovered = hoveredIndex === idx;
          const spreadX = (idx - halfStack) * 44;

          return (
            <motion.div
              key={card._id}
              className="absolute cursor-pointer select-none"
              style={{ zIndex: isHovered ? 50 : idx + 1, transformOrigin: 'center bottom' }}
              initial={{ rotate: rot, x: ox + spreadX, y: oy }}
              animate={{
                rotate: isHovered ? 0 : rot,
                x: isHovered ? spreadX + ox * 0.3 : ox + spreadX,
                y: isHovered ? -22 : oy,
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onPhotoClick(idx)}
            >
              <div
                className="relative rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/70 dark:border-white/20"
                style={{ width: 148, height: 200 }}
              >
                <img
                  src={card.image || DEFAULT_VAULT_IMAGE}
                  alt={card.title}
                  loading="lazy"
                  draggable={false}
                  style={{ objectPosition: card.focalPoint ? `${card.focalPoint.x}% ${card.focalPoint.y}%` : 'center' }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute inset-x-0 bottom-0 p-3"
                    >
                      <p className="text-white font-bold text-[11px] leading-tight line-clamp-2 drop-shadow">
                        {card.title}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Count badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-ashram-saffron/10 dark:bg-amber-400/10 border border-ashram-saffron/30 dark:border-amber-400/30 text-ashram-saffron dark:text-amber-400 text-xs font-black uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          {images.length} {images.length === 1 ? 'Memory' : 'Memories'} — click any photo to view fullscreen
        </span>
      </div>
    </div>
  );
};

/* Main Page */
export const AshramCardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [allCards, setAllCards] = useState<MemoryVaultCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const unsub = memoryVaultService.subscribeToCards((cards) => {
      setAllCards(cards);
      setLoading(false);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  return (
    <div className="min-h-screen bg-ashram-cream dark:bg-darkAshram-bg text-ashram-charcoal dark:text-darkAshram-text transition-colors duration-300 flex flex-col overflow-x-hidden">
      <Navbar onOpenContributeModal={() => setIsContributeModalOpen(true)} />
      <div className="pt-16" />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-center justify-center">

        {/* Top nav row */}
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ashram-green dark:text-darkAshram-gold hover:text-ashram-saffron dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Explore</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <span className="inline-flex items-center gap-1 text-[10px] tracking-widest font-sans uppercase font-black text-ashram-saffron dark:text-amber-400 mb-2">
            <Sparkles className="w-3 h-3 animate-pulse" /> Curated Collection
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ashram-green dark:text-darkAshram-gold leading-tight mb-4">
            Ashram Memory Vault
          </h1>
          <p className="text-ashram-charcoal/70 dark:text-darkAshram-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            A curated collection of precious moments from Vatsalya Vatika — all memories in one place.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <RefreshCw className="w-8 h-8 text-ashram-saffron animate-spin" />
            <p className="text-sm text-ashram-muted dark:text-darkAshram-muted font-medium">Loading Memory Vault…</p>
          </div>
        ) : (
          <MemoryBundle images={allCards} onPhotoClick={setLightboxIndex} />
        )}

      </main>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={allCards}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>

      <ContributeModal isOpen={isContributeModalOpen} onClose={() => setIsContributeModalOpen(false)} />
      <Footer />
    </div>
  );
};
