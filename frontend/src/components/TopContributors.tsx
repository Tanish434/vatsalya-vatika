import React, { useEffect, useState, useRef } from 'react';
import { Heart, Trophy, Medal, Star, Award, Sparkles } from 'lucide-react';
import { contributionService } from '../services/contributionService';
import { siteSettingsService } from '../services/siteSettingsService';
import { ContributionRecord } from '../types';

// Animated counter hook
function useCountUp(target: number, duration: number = 1500, active: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, active, duration]);
  return count;
}

const RANK_CONFIG = [
  {
    icon: Trophy,
    color: 'from-amber-400 to-yellow-500',
    iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-white dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-darkAshram-card',
    border: 'border-amber-400/70 dark:border-amber-500/50',
    glow: 'shadow-amber-200/60 dark:shadow-amber-700/30',
    label: '🥇 Top Donor',
    scale: 'scale-[1.07] -translate-y-5 z-10',
    textColor: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-2 ring-amber-400/30 dark:ring-amber-500/20',
  },
  {
    icon: Medal,
    color: 'from-slate-400 to-gray-500',
    iconBg: 'bg-gradient-to-br from-slate-400 to-gray-500',
    bg: 'bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-darkAshram-card',
    border: 'border-slate-400/60 dark:border-slate-600/50',
    glow: 'shadow-slate-200/50 dark:shadow-slate-700/20',
    label: '🥈 2nd Place',
    scale: '',
    textColor: 'text-slate-600 dark:text-slate-400',
    ring: '',
  },
  {
    icon: Award,
    color: 'from-orange-400 to-amber-600',
    iconBg: 'bg-gradient-to-br from-orange-400 to-amber-600',
    bg: 'bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/40 dark:to-darkAshram-card',
    border: 'border-orange-400/60 dark:border-orange-600/50',
    glow: 'shadow-orange-200/50 dark:shadow-orange-700/20',
    label: '🥉 3rd Place',
    scale: '',
    textColor: 'text-orange-600 dark:text-orange-400',
    ring: '',
  },
];

const DonorCard: React.FC<{ donor: ContributionRecord; rank: number; visible: boolean; delay: number }> = ({ donor, rank, visible, delay }) => {
  const cfg = RANK_CONFIG[rank] || {
    icon: Heart,
    iconBg: 'bg-gradient-to-br from-rose-400 to-pink-500',
    bg: 'bg-white dark:bg-darkAshram-card',
    border: 'border-ashram-border dark:border-darkAshram-border',
    glow: '',
    label: '',
    scale: '',
    textColor: 'text-rose-500',
    ring: '',
  };
  const Icon = cfg.icon;
  const animatedAmount = useCountUp(donor.amount, 1200, visible);

  // Privacy: show first name + last initial only
  const displayName = (() => {
    const parts = donor.name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  })();

  return (
    <div
      className={`relative flex flex-col items-center text-center p-6 rounded-2xl border-2 ${cfg.border} ${cfg.bg} ${cfg.ring} shadow-xl ${cfg.glow} ${cfg.scale} transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Shimmer for #1 */}
      {rank === 0 && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/10 via-transparent to-amber-400/5 animate-pulse pointer-events-none" />
      )}

      {/* Rank Badge */}
      {cfg.label && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-md text-ashram-charcoal dark:text-darkAshram-text whitespace-nowrap z-10">
          {cfg.label}
        </span>
      )}

      {/* Icon Circle */}
      <div className={`w-16 h-16 rounded-full ${cfg.iconBg} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>

      {/* Name */}
      <h4 className="font-heading font-bold text-base text-ashram-green dark:text-darkAshram-gold mb-1 line-clamp-1">{displayName}</h4>

      {/* Animated Amount */}
      <p className={`text-2xl font-heading font-black ${cfg.textColor}`}>
        ₹{animatedAmount.toLocaleString()}
      </p>

      {/* Purpose Tag */}
      <span className="mt-2 text-[10px] px-3 py-1 rounded-full bg-white/70 dark:bg-darkAshram-surface/60 text-ashram-muted dark:text-darkAshram-muted border border-ashram-border/50 dark:border-darkAshram-border/50 font-medium">
        {donor.purpose}
      </span>

      {/* Stars for top 3 */}
      {rank < 3 && (
        <div className="flex gap-0.5 mt-3">
          {Array.from({ length: 3 - rank }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
          ))}
        </div>
      )}
    </div>
  );
};

// Skeleton shimmer card for loading state
const SkeletonCard: React.FC<{ tall?: boolean }> = ({ tall }) => (
  <div className={`relative flex flex-col items-center text-center p-6 rounded-2xl border-2 border-ashram-border/40 dark:border-darkAshram-border/30 bg-white/60 dark:bg-darkAshram-card/50 shadow-lg ${tall ? 'scale-[1.05] -translate-y-4' : ''} animate-pulse`}>
    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 mb-4" />
    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
    <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
    <div className="h-4 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
  </div>
);

// Empty-state placeholder card (shown when no real donors yet)
const PlaceholderCard: React.FC<{ rank: number; visible: boolean; delay: number }> = ({ rank, visible, delay }) => {
  const cfg = RANK_CONFIG[rank] || { iconBg: 'bg-gradient-to-br from-gray-300 to-gray-400', bg: 'bg-white dark:bg-darkAshram-card', border: 'border-ashram-border dark:border-darkAshram-border', glow: '', label: '', scale: '', ring: '' };
  const Icon = [Trophy, Medal, Award][rank] || Heart;
  return (
    <div
      className={`relative flex flex-col items-center text-center p-6 rounded-2xl border-2 border-dashed ${cfg.border} ${cfg.bg} ${cfg.ring} shadow-lg ${cfg.scale} transition-all duration-700 ease-out opacity-60 ${visible ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {cfg.label && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow text-ashram-muted dark:text-darkAshram-muted whitespace-nowrap z-10">
          {cfg.label}
        </span>
      )}
      <div className={`w-16 h-16 rounded-full ${cfg.iconBg} flex items-center justify-center mb-4 shadow opacity-50`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h4 className="font-heading font-bold text-sm text-ashram-muted dark:text-darkAshram-muted mb-1">Your Name Here</h4>
      <p className="text-lg font-heading font-black text-ashram-muted dark:text-darkAshram-muted/60">₹ ——</p>
      <span className="mt-2 text-[10px] px-3 py-1 rounded-full bg-white/50 dark:bg-darkAshram-surface/40 text-ashram-muted dark:text-darkAshram-muted/60 border border-dashed border-ashram-border/40 font-medium">
        Be the first!
      </span>
    </div>
  );
};

export const TopContributors: React.FC = () => {
  const [contributors, setContributors] = useState<ContributionRecord[]>([]);
  const [showSection, setShowSection] = useState(true); // Default true; will be overridden by settings
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const unsubSettings = siteSettingsService.subscribeToSiteSettings((settings) => {
      if (settings && settings.showDonors === false) {
        setShowSection(false);
      } else {
        setShowSection(true);
      }
    });

    const unsubContrib = contributionService.subscribeToContributions((all) => {
      const top = [...all]
        .filter((c) => c.paymentStatus === 'completed')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);
      setContributors(top);
      setLoading(false);
    });

    return () => {
      if (typeof unsubSettings === 'function') unsubSettings();
      if (typeof unsubContrib === 'function') unsubContrib();
    };
  }, []);

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    if (!showSection) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [showSection, loading]);

  // Admin disabled this section
  if (!showSection) return null;

  const top3 = contributors.slice(0, 3);
  const rest = contributors.slice(3);
  const hasData = contributors.length > 0;

  return (
    <section
      ref={sectionRef}
      className="py-24 relative overflow-hidden bg-gradient-to-b from-ashram-cream via-white to-ashram-cream dark:from-darkAshram-bg dark:via-darkAshram-card/30 dark:to-darkAshram-bg transition-colors duration-300"
    >
      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-300/10 dark:bg-amber-600/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-300/10 dark:bg-rose-600/10 rounded-full blur-3xl translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-ashram-gold/5 dark:bg-amber-800/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-widest uppercase mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Hall of Gratitude
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl text-ashram-green dark:text-darkAshram-gold mb-4">
            Our Generous Donors
          </h2>
          <p className="text-ashram-charcoal/70 dark:text-darkAshram-text/70 text-base max-w-xl mx-auto leading-relaxed">
            {hasData
              ? 'Every contribution, big or small, lights a lamp of hope in a child\'s life. We are profoundly grateful.'
              : 'Be the first to make a difference! Your contribution will be celebrated here.'}
          </p>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 items-end max-w-3xl mx-auto">
            <SkeletonCard />
            <SkeletonCard tall />
            <SkeletonCard />
          </div>
        )}

        {/* Podium — Top 3 or Placeholders */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 items-end max-w-3xl mx-auto">
              {/* 2nd Place */}
              <div className="order-2 sm:order-1">
                {top3[1]
                  ? <DonorCard donor={top3[1]} rank={1} visible={visible} delay={200} />
                  : <PlaceholderCard rank={1} visible={visible} delay={200} />}
              </div>
              {/* 1st Place center */}
              <div className="order-1 sm:order-2">
                {top3[0]
                  ? <DonorCard donor={top3[0]} rank={0} visible={visible} delay={0} />
                  : <PlaceholderCard rank={0} visible={visible} delay={0} />}
              </div>
              {/* 3rd Place */}
              <div className="order-3 sm:order-3">
                {top3[2]
                  ? <DonorCard donor={top3[2]} rank={2} visible={visible} delay={400} />
                  : <PlaceholderCard rank={2} visible={visible} delay={400} />}
              </div>
            </div>

            {/* Rest of donors (4–6) */}
            {rest.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {rest.map((donor, idx) => (
                  <DonorCard key={donor._id} donor={donor} rank={idx + 3} visible={visible} delay={500 + idx * 100} />
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className={`text-center mt-14 transition-all duration-700 delay-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-sm text-ashram-muted dark:text-darkAshram-muted mb-5">
            {hasData ? 'Your name could be here too — every contribution matters.' : 'Make a contribution and be featured in our Hall of Gratitude!'}
          </p>
          <a
            href="#contribute"
            className="inline-flex items-center gap-2.5 px-10 py-3.5 rounded-full bg-gradient-to-r from-ashram-saffron to-amber-500 hover:from-amber-500 hover:to-ashram-saffron text-white font-bold text-sm shadow-xl hover:shadow-amber-300/40 dark:hover:shadow-amber-700/30 transform hover:-translate-y-1 transition-all duration-300"
          >
            <Heart className="w-4 h-4 fill-white" />
            Become a Donor
          </a>
        </div>

      </div>
    </section>
  );
};
