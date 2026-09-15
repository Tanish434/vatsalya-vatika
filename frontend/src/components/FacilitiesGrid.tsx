import React, { useEffect, useState, useRef } from 'react';
import {
  BookOpen, Home, Utensils, HeartPulse, Laptop,
  Trophy, Palette, Sparkles, Library, UserCheck, LucideIcon
} from 'lucide-react';
import { FacilityItem } from '../types';
import { facilityService } from '../services/facilityService';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Home, Utensils, HeartPulse, Laptop,
  Trophy, Palette, Sparkles, Library, UserCheck
};

// Gradient per icon for luxury feel
const iconGradients: Record<string, string> = {
  BookOpen: 'from-blue-500 to-indigo-600',
  Home: 'from-emerald-500 to-teal-600',
  Utensils: 'from-orange-400 to-amber-500',
  HeartPulse: 'from-rose-500 to-pink-600',
  Laptop: 'from-violet-500 to-purple-600',
  Trophy: 'from-amber-400 to-yellow-500',
  Palette: 'from-fuchsia-500 to-pink-500',
  Sparkles: 'from-ashram-saffron to-amber-500',
  Library: 'from-cyan-500 to-blue-500',
  UserCheck: 'from-green-500 to-emerald-600',
};

const FacilityCard: React.FC<{ fac: FacilityItem; idx: number; visible: boolean }> = ({ fac, idx, visible }) => {
  const IconComponent = iconMap[fac.icon] || Sparkles;
  const grad = iconGradients[fac.icon] || 'from-ashram-saffron to-amber-500';

  return (
    <div
      className={`group relative p-5 rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border/60 dark:border-darkAshram-border/60 shadow-md hover:shadow-2xl dark:hover:shadow-dark-xl overflow-hidden cursor-default transition-all duration-500 hover:-translate-y-2 flex flex-col gap-3 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${(idx % 8) * 60}ms` }}
    >
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500 rounded-2xl pointer-events-none`} />

      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${grad} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`} />

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 shrink-0`}>
        <IconComponent className="w-5.5 h-5.5 text-white" />
      </div>

      <div className="relative z-10">
        <h3 className="font-heading font-bold text-base text-ashram-green dark:text-darkAshram-gold mb-1 group-hover:text-ashram-saffron dark:group-hover:text-amber-400 transition-colors duration-300 leading-snug">
          {fac.title}
        </h3>
        <p className="font-sans text-xs text-ashram-muted dark:text-darkAshram-muted leading-relaxed">
          {fac.description}
        </p>
      </div>
    </div>
  );
};

export const FacilitiesGrid: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const unsub = facilityService.subscribeToFacilities((data) => {
      setFacilities(data);
      setLoading(false);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
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

  return (
    <section
      id="facilities"
      ref={sectionRef}
      className="relative py-20 overflow-hidden bg-gradient-to-b from-white to-ashram-cream dark:from-darkAshram-surface dark:to-darkAshram-bg border-y border-ashram-border dark:border-darkAshram-border transition-colors duration-300"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-ashram-saffron/4 dark:bg-amber-700/6 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-ashram-green/4 dark:bg-emerald-900/8 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className={`text-center max-w-2xl mx-auto mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <span className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-ashram-saffron dark:text-amber-400 font-bold mb-4 px-4 py-1.5 rounded-full bg-ashram-saffron/8 dark:bg-amber-900/20 border border-ashram-saffron/20 dark:border-amber-700/30">
            <Sparkles className="w-3 h-3" /> Comprehensive Infrastructure
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-ashram-green dark:text-darkAshram-gold mt-2 mb-4 leading-tight">
            Everything They Need<br className="hidden sm:block" /> to Grow
          </h2>
          <div className="h-1.5 w-20 bg-gradient-to-r from-ashram-saffron to-ashram-gold rounded-full mx-auto mb-4" />
          <p className="font-sans text-base text-ashram-muted dark:text-darkAshram-muted leading-relaxed">
            Full-spectrum care so every student can focus on learning, character, and wellbeing.
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-5 rounded-2xl bg-ashram-cream/60 dark:bg-darkAshram-card/50 animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {facilities.map((fac, idx) => (
              <FacilityCard key={fac._id || fac.title} fac={fac} idx={idx} visible={visible} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
