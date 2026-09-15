import React, { useEffect, useState, useRef } from 'react';
import { Star, Send, ChevronLeft, ChevronRight, MessageCircle, Quote, Sparkles, TrendingUp } from 'lucide-react';
import { ReviewItem } from '../types';
import { reviewService } from '../services/reviewService';
import toast from 'react-hot-toast';

// Dynamic premium avatar gradient based on name
const getAvatarGradient = (name: string) => {
  const gradients = [
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-600',
    'from-emerald-400 to-teal-600',
    'from-blue-400 to-indigo-600',
    'from-violet-400 to-purple-600',
    'from-ashram-saffron to-amber-600',
  ];
  const sum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return gradients[sum % gradients.length];
};

// ─── Star Rating Input ────────────────────────────────────────────────────────
const StarInput: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  return (
    <div>
      <div className="flex gap-2 py-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-all duration-150 transform hover:scale-125 active:scale-110"
            aria-label={`Rate ${i} star${i !== 1 ? 's' : ''}`}
          >
            <Star
              className={`w-8 h-8 transition-all duration-150 ${
                (hovered || value) >= i
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  : 'text-gray-200 dark:text-gray-700 hover:text-amber-300'
              }`}
            />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <p className="text-xs text-ashram-saffron dark:text-amber-400 font-bold mt-1 transition-all">
          {labels[hovered || value]}
        </p>
      )}
    </div>
  );
};

// ─── Static Star Display ──────────────────────────────────────────────────────
const StarDisplay: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-4 h-4' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`${size} ${
          i <= rating
            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.4)]'
            : 'text-gray-200 dark:text-gray-700'
        }`}
      />
    ))}
  </div>
);

// ─── Review Card ──────────────────────────────────────────────────────────────
const ReviewCard: React.FC<{ review: ReviewItem }> = ({ review }) => {
  const initials = review.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const dateStr = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const avatarGrad = getAvatarGradient(review.name);

  return (
    <div className="flex-shrink-0 w-80 sm:w-96 bg-white/80 dark:bg-darkAshram-card/80 backdrop-blur-md border border-ashram-border/60 dark:border-darkAshram-border/50 rounded-3xl p-7 shadow-lg mx-3 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-dark-xl hover:border-ashram-saffron/40 dark:hover:border-amber-600/40">
      {/* Decorative Quote Icon */}
      <Quote className="absolute right-5 top-5 w-14 h-14 text-ashram-saffron/8 dark:text-amber-400/5 pointer-events-none rotate-180" />

      <div className="relative z-10 flex flex-col gap-3 h-full justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <StarDisplay rating={review.rating} size="w-4 h-4" />
            <span className="text-xs font-bold text-amber-500 dark:text-amber-400">{review.rating}.0</span>
          </div>
          <p className="text-sm text-ashram-charcoal/90 dark:text-darkAshram-text/90 leading-relaxed font-sans italic line-clamp-5">
            "{review.comment}"
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-ashram-border/40 dark:border-darkAshram-border/30">
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-sm font-black shadow-md shrink-0`}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-ashram-green dark:text-darkAshram-gold leading-tight">{review.name}</p>
            {dateStr && <p className="text-[10px] text-ashram-muted dark:text-darkAshram-muted mt-0.5">{dateStr}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main ReviewsSection ──────────────────────────────────────────────────────
export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', rating: 0, comment: '' });
  const [formError, setFormError] = useState('');
  const [visible, setVisible] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const unsub = reviewService.subscribeToPublicReviews((data) => {
      setReviews(data);
      setLoading(false);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (reviews.length <= 1) return;
    autoScrollRef.current = setInterval(() => {
      if (scrollRef.current) {
        const el = scrollRef.current;
        const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 24 : 400;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 4500);
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [reviews]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 24 : 400;
      el.scrollBy({ left: dir === 'right' ? cardWidth : -cardWidth, behavior: 'smooth' });
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Please enter your name.'); return; }
    if (form.rating === 0) { setFormError('Please select a star rating.'); return; }
    if (form.comment.trim().length < 10) { setFormError('Comment must be at least 10 characters.'); return; }
    setSubmitting(true);
    try {
      const newReview = await reviewService.submitReview({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        rating: form.rating,
        comment: form.comment.trim(),
      });
      setReviews(prev => [newReview, ...prev]);
      setSubmitted(true);
      toast.success('Thank you for your review! 🙏');
      setTimeout(() => {
        setSubmitted(false);
        setForm({ name: '', email: '', rating: 0, comment: '' });
      }, 3000);
    } catch {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className="pt-14 pb-6 relative overflow-hidden bg-gradient-to-b from-ashram-cream to-white dark:from-darkAshram-bg dark:to-darkAshram-surface border-t border-ashram-border dark:border-darkAshram-border transition-colors duration-300"
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-ashram-saffron/6 dark:bg-amber-700/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-ashram-green/5 dark:bg-emerald-900/8 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className={`mb-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-ashram-saffron dark:text-amber-400 font-bold mb-3 px-4 py-1.5 rounded-full bg-ashram-saffron/8 dark:bg-amber-900/20 border border-ashram-saffron/20 dark:border-amber-700/30">
                <Sparkles className="w-3 h-3" /> Community Voices
              </span>
              <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-ashram-green dark:text-darkAshram-gold leading-tight">
                Reviews &amp; Feedback
              </h2>
              <div className="h-1.5 w-24 bg-gradient-to-r from-ashram-saffron to-ashram-gold rounded-full mt-4" />
            </div>

            {/* Average Rating Badge */}
            {avgRating && (
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-md shrink-0">
                <div className="text-center">
                  <p className="font-heading font-black text-4xl text-amber-500 leading-none">{avgRating}</p>
                  <p className="text-[10px] text-ashram-muted dark:text-darkAshram-muted uppercase tracking-wider font-semibold mt-0.5">out of 5</p>
                </div>
                <div className="border-l border-ashram-border dark:border-darkAshram-border pl-4">
                  <StarDisplay rating={Math.round(Number(avgRating))} size="w-4 h-4" />
                  <p className="text-xs text-ashram-muted dark:text-darkAshram-muted mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-ashram-green dark:text-emerald-400" />
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

          {/* Left: Reviews Carousel (span 2) */}
          <div className={`lg:col-span-2 space-y-5 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{ transitionDelay: '150ms' }}>
            <h3 className="font-heading font-bold text-xl text-ashram-green dark:text-darkAshram-gold flex items-center gap-2 px-1">
              <MessageCircle className="w-5 h-5 text-ashram-saffron" />
              What People Say
            </h3>

            {loading ? (
              <div className="flex gap-6 overflow-hidden">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-80 h-56 rounded-3xl bg-white/60 dark:bg-darkAshram-card/60 animate-pulse border border-ashram-border/50 shadow-md" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 rounded-3xl bg-white/60 dark:bg-darkAshram-card/50 border border-dashed border-ashram-border dark:border-darkAshram-border mx-1 shadow-sm">
                <MessageCircle className="w-10 h-10 text-ashram-muted/30 mx-auto mb-3" />
                <p className="text-ashram-muted dark:text-darkAshram-muted text-sm font-semibold">Be the first to share your experience!</p>
                <p className="text-ashram-muted/60 dark:text-darkAshram-muted/50 text-xs mt-1">Your review will appear here after submission.</p>
              </div>
            ) : (
              <div className="relative group">
                {/* Left arrow */}
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2.5 rounded-full bg-white dark:bg-darkAshram-card shadow-lg border border-ashram-border dark:border-darkAshram-border opacity-0 group-hover:opacity-100 transition-all hover:bg-ashram-cream dark:hover:bg-darkAshram-surface hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5 text-ashram-charcoal dark:text-darkAshram-text" />
                </button>

                {/* Scrollable track */}
                <div
                  ref={scrollRef}
                  className="flex overflow-x-auto gap-0 pb-4 -mx-3 px-3"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
                </div>

                {/* Right arrow */}
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2.5 rounded-full bg-white dark:bg-darkAshram-card shadow-lg border border-ashram-border dark:border-darkAshram-border opacity-0 group-hover:opacity-100 transition-all hover:bg-ashram-cream dark:hover:bg-darkAshram-surface hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5 text-ashram-charcoal dark:text-darkAshram-text" />
                </button>
              </div>
            )}

            {/* Scroll hint dots — visible only when there are reviews */}
            {!loading && reviews.length > 1 && (
              <p className="text-xs text-ashram-muted/60 dark:text-darkAshram-muted/50 text-center mt-2">
                ← Scroll or use arrows to see more reviews →
              </p>
            )}
          </div>

          {/* Right: Review Form */}
          <div
            className={`relative w-full rounded-3xl overflow-hidden shadow-xl border border-ashram-border dark:border-darkAshram-border transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
            style={{ transitionDelay: '250ms' }}
          >
            {/* Gradient Header Bar */}
            <div className="bg-gradient-to-r from-ashram-saffron to-amber-500 px-6 py-5">
              <h3 className="font-heading font-extrabold text-xl text-white leading-tight">Share Your Experience</h3>
              <p className="text-xs text-white/80 mt-0.5 leading-relaxed">Help us improve and inspire others.</p>
            </div>

            <div className="bg-white dark:bg-darkAshram-card p-5">
              {submitted ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3 animate-bounce">🙏</div>
                  <p className="font-heading font-black text-xl text-ashram-green dark:text-darkAshram-gold">Thank You!</p>
                  <p className="text-sm text-ashram-muted dark:text-darkAshram-muted mt-1.5 leading-relaxed">
                    Your review has been submitted and is now live.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 text-sm">

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ashram-green/80 dark:text-darkAshram-gold/80 mb-1.5">Your Name *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full p-3 rounded-2xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream/50 dark:bg-darkAshram-surface text-sm focus:outline-none focus:border-ashram-saffron focus:ring-2 focus:ring-ashram-saffron/30 transition-all text-ashram-charcoal dark:text-darkAshram-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ashram-green/80 dark:text-darkAshram-gold/80 mb-1.5">Email <span className="font-normal normal-case text-ashram-muted">(optional)</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full p-3 rounded-2xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream/50 dark:bg-darkAshram-surface text-sm focus:outline-none focus:border-ashram-saffron focus:ring-2 focus:ring-ashram-saffron/30 transition-all text-ashram-charcoal dark:text-darkAshram-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ashram-green/80 dark:text-darkAshram-gold/80 mb-2">Your Rating *</label>
                    <StarInput value={form.rating} onChange={v => setForm({ ...form, rating: v })} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ashram-green/80 dark:text-darkAshram-gold/80 mb-1.5">Review / Comment *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.comment}
                      onChange={e => setForm({ ...form, comment: e.target.value })}
                      placeholder="Share your experience... (min. 10 characters)"
                      className="w-full p-3 rounded-2xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream/50 dark:bg-darkAshram-surface text-sm focus:outline-none focus:border-ashram-saffron focus:ring-2 focus:ring-ashram-saffron/30 resize-none transition-all text-ashram-charcoal dark:text-darkAshram-text"
                    />
                    <p className="text-[10px] text-ashram-muted dark:text-darkAshram-muted mt-1 text-right font-medium">{form.comment.length} chars</p>
                  </div>

                  {formError && (
                    <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-2xl border border-red-200 dark:border-red-900/50 font-medium">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-ashram-saffron to-amber-500 hover:from-amber-500 hover:to-ashram-saffron text-white text-sm font-bold shadow-lg hover:shadow-amber-400/20 disabled:opacity-60 transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {submitting
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                      : <><Send className="w-3.5 h-3.5" />Submit Review</>
                    }
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
