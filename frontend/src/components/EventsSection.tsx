import React, { useEffect, useState, useRef } from 'react';
import { Calendar, MapPin, Tag, ArrowRight, X, Sparkles, Clock } from 'lucide-react';
import { EventItem } from '../types';
import { eventService } from '../services/eventService';

const CATEGORY_COLORS: Record<string, string> = {
  'Educational Events': 'from-blue-500 to-indigo-600',
  'Cultural Programs': 'from-fuchsia-500 to-pink-600',
  'Sports Activities': 'from-emerald-500 to-teal-600',
};

const getCategoryGrad = (cat: string) => CATEGORY_COLORS[cat] || 'from-ashram-saffron to-amber-500';

const EventCard: React.FC<{ evt: EventItem; onClick: () => void; idx: number; visible: boolean }> = ({ evt, onClick, idx, visible }) => {
  const grad = getCategoryGrad(evt.category);
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white dark:bg-darkAshram-card rounded-3xl overflow-hidden border border-ashram-border/60 dark:border-darkAshram-border/60 shadow-lg hover:shadow-2xl dark:hover:shadow-dark-xl cursor-pointer flex flex-col transition-all duration-500 hover:-translate-y-2 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${idx * 100}ms` }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={evt.image}
          alt={evt.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          style={{ objectPosition: evt.focalPoint ? `${evt.focalPoint.x}% ${evt.focalPoint.y}%` : 'top center' }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Category pill */}
        <div className={`absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${grad} text-white text-[10px] font-bold shadow-lg backdrop-blur-sm`}>
          <Tag className="w-2.5 h-2.5" />
          {evt.category}
        </div>

        {/* Date chip floating on image */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 dark:bg-darkAshram-card/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow text-[10px] font-bold text-ashram-green dark:text-darkAshram-gold">
          <Calendar className="w-3 h-3 text-ashram-saffron" />
          {evt.date}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <h3 className="font-heading font-bold text-lg text-ashram-green dark:text-darkAshram-gold group-hover:text-ashram-saffron dark:group-hover:text-amber-400 transition-colors duration-300 line-clamp-2 leading-snug">
          {evt.title}
        </h3>
        <p className="font-sans text-sm text-ashram-muted dark:text-darkAshram-muted line-clamp-2 leading-relaxed flex-1">
          {evt.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-ashram-border/40 dark:border-darkAshram-border/40">
          <span className="flex items-center gap-1.5 text-xs text-ashram-muted dark:text-darkAshram-muted truncate max-w-[65%]">
            <MapPin className="w-3.5 h-3.5 text-ashram-saffron shrink-0" />
            <span className="truncate">{evt.location}</span>
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r ${grad} bg-clip-text text-transparent group-hover:translate-x-1 transition-transform`}>
            Details <ArrowRight className="w-3.5 h-3.5 text-ashram-saffron" />
          </span>
        </div>
      </div>
    </div>
  );
};

export const EventsSection: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const unsubscribe = eventService.subscribeToEvents((data) => {
      setEvents(data);
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

  const categories = ['All', 'Educational Events', 'Cultural Programs', 'Sports Activities'];
  const filteredEvents = filterCategory === 'All' ? events : events.filter(e => e.category === filterCategory);

  return (
    <section
      id="events"
      ref={sectionRef}
      className="relative py-20 overflow-hidden bg-ashram-green/5 dark:bg-transparent border-y border-ashram-border dark:border-darkAshram-border transition-colors duration-300"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-300/6 dark:bg-blue-800/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-fuchsia-300/6 dark:bg-fuchsia-900/8 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-ashram-saffron dark:text-amber-400 font-bold mb-3 px-4 py-1.5 rounded-full bg-ashram-saffron/8 dark:bg-amber-900/20 border border-ashram-saffron/20 dark:border-amber-700/30">
              <Sparkles className="w-3 h-3" /> Ashram Happenings
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-ashram-green dark:text-darkAshram-gold leading-tight">
              Upcoming &amp; Recent Events
            </h2>
            <div className="h-1.5 w-20 bg-gradient-to-r from-ashram-saffron to-ashram-gold rounded-full mt-4" />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                  filterCategory === cat
                    ? 'bg-gradient-to-r from-ashram-saffron to-amber-500 text-white border-transparent shadow-lg shadow-amber-200/40 dark:shadow-amber-900/30 scale-105'
                    : 'bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text border-ashram-border dark:border-darkAshram-border hover:border-ashram-saffron/50 hover:text-ashram-saffron dark:hover:text-amber-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 rounded-3xl bg-white/60 dark:bg-darkAshram-card/50 animate-pulse border border-ashram-border/40 shadow" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-darkAshram-card rounded-3xl border border-dashed border-ashram-border dark:border-darkAshram-border shadow-sm">
            <Clock className="w-10 h-10 text-ashram-muted/30 mx-auto mb-3" />
            <p className="font-sans text-ashram-muted dark:text-darkAshram-muted font-medium">No events in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.slice(0, 6).map((evt, idx) => (
              <EventCard key={evt._id} evt={evt} onClick={() => setSelectedEvent(evt)} idx={idx} visible={visible} />
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white dark:bg-darkAshram-card rounded-3xl shadow-2xl border border-ashram-border dark:border-darkAshram-border max-h-[90vh] overflow-y-auto">
            {/* Modal image */}
            <div className="relative h-52 rounded-t-3xl overflow-hidden">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
                style={{ objectPosition: selectedEvent.focalPoint ? `${selectedEvent.focalPoint.x}% ${selectedEvent.focalPoint.y}%` : 'top center' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryGrad(selectedEvent.category)} text-white text-xs font-bold shadow`}>
                <Tag className="w-3 h-3" />
                {selectedEvent.category}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-ashram-muted dark:text-darkAshram-muted">
                <Calendar className="w-3.5 h-3.5 text-ashram-saffron" />
                {selectedEvent.date}
              </div>

              <h3 className="font-heading font-black text-2xl text-ashram-green dark:text-darkAshram-gold leading-tight">
                {selectedEvent.title}
              </h3>

              <p className="font-sans text-sm text-ashram-charcoal/90 dark:text-darkAshram-text/90 leading-relaxed">
                {selectedEvent.description}
              </p>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-ashram-cream dark:bg-darkAshram-surface border border-ashram-border/50 dark:border-darkAshram-border/40 text-xs text-ashram-muted dark:text-darkAshram-muted">
                <MapPin className="w-4 h-4 text-ashram-saffron shrink-0" />
                <span>Venue: {selectedEvent.location}</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-7 py-2.5 rounded-2xl bg-gradient-to-r from-ashram-green to-ashram-greenHover text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
