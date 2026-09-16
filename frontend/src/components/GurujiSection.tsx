import React, { useState, useEffect, useRef } from 'react';
import { Quote, ArrowRight, X, Compass, BookOpen, Heart, Sun, FileText } from 'lucide-react';

const PILLARS = [
  { icon: BookOpen, label: 'Vidya', desc: 'Knowledge & Wisdom' },
  { icon: Heart, label: 'Karuna', desc: 'Compassion & Empathy' },
  { icon: Sun, label: 'Karma', desc: 'Righteous Action' },
];

export const GurujiSection: React.FC = () => {
  const [showGurujiModal, setShowGurujiModal] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="guruji" ref={ref} className="relative py-24 bg-white dark:bg-transparent transition-colors duration-300 overflow-hidden">

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ashram-gold/8 dark:bg-amber-600/8 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-ashram-green/5 dark:bg-emerald-900/10 rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-center">

          {/* ── Left: Portrait ── */}
          <div
            className={`lg:col-span-5 relative group/portrait transition-all duration-1000 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
          >
            {/* Decorative soft glow behind image */}
            <div className="absolute -inset-2 sm:-inset-4 rounded-3xl bg-gradient-to-br from-ashram-gold/20 via-ashram-saffron/10 to-transparent dark:from-amber-600/15 dark:via-amber-800/10 dark:to-transparent blur-xl opacity-60 group-hover/portrait:opacity-100 group-hover/portrait:scale-105 transition-all duration-700 pointer-events-none" />

            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white/90 dark:border-white/10 transition-all duration-700 ease-out group-hover/portrait:-translate-y-1.5 group-hover/portrait:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35),0_0_35px_rgba(220,150,70,0.2)]">
              <img
                src="/guruji.jpeg"
                alt="Guruji – Spiritual Mentor & Founder of Vatsalya Vatika"
                className="w-full h-[420px] sm:h-[520px] object-cover object-top transition-transform duration-1000 ease-out group-hover/portrait:scale-105 group-active/portrait:scale-105"
              />
              {/* Subtle ambient light gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover/portrait:opacity-60 transition-opacity duration-700 pointer-events-none" />
              {/* Spiritual golden warmth highlight on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-ashram-gold/10 via-transparent to-amber-400/10 opacity-0 group-hover/portrait:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>

            {/* Floating name badge */}
            <div className="absolute bottom-5 left-5 right-5 z-20 bg-white/90 dark:bg-darkAshram-card/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-ashram-border/40 dark:border-darkAshram-border/40 pointer-events-none transition-transform duration-700 group-hover/portrait:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ashram-saffron to-amber-500 flex items-center justify-center text-white text-lg shrink-0 shadow-sm">
                  🪷
                </div>
                <div>
                  <p className="font-heading font-black text-base text-ashram-green dark:text-darkAshram-gold leading-tight">
                    Reverend Guruji
                  </p>
                  <p className="text-xs text-ashram-saffron dark:text-amber-400 font-semibold uppercase tracking-wider mt-0.5">
                    Spiritual Mentor & Founder
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Content ── */}
          <div
            className={`lg:col-span-7 space-y-7 transition-all duration-1000 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
            style={{ transitionDelay: '150ms' }}
          >
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-ashram-saffron dark:text-amber-400 font-bold mb-4 px-4 py-1.5 rounded-full bg-ashram-saffron/8 dark:bg-amber-900/20 border border-ashram-saffron/20 dark:border-amber-700/30">
                <Compass className="w-3 h-3" /> Spiritual Leadership
              </span>

              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-ashram-green dark:text-darkAshram-gold leading-tight mt-3">
                Guidance, Values<br className="hidden sm:block" /> and Compassion
              </h2>
              <div className="h-1.5 w-20 bg-gradient-to-r from-ashram-saffron to-ashram-gold rounded-full mt-5" />
            </div>

            {/* Quote Block */}
            <div className="relative p-7 rounded-3xl bg-gradient-to-br from-ashram-green/5 to-ashram-gold/5 dark:from-emerald-900/20 dark:to-amber-900/10 border-l-4 border-ashram-saffron dark:border-amber-500 shadow-lg overflow-hidden">
              <Quote className="w-12 h-12 text-ashram-saffron/15 dark:text-amber-400/10 absolute top-4 right-4 rotate-180" />
              <p className="font-heading italic text-lg sm:text-xl text-ashram-green dark:text-darkAshram-gold leading-relaxed mb-3 relative z-10">
                "Education is not only about learning from books, but also about learning how to live."
              </p>
              <p className="text-xs font-bold text-ashram-saffron dark:text-amber-400 uppercase tracking-widest">
                — Guruji
              </p>
            </div>

            {/* Paragraphs */}
            <p className="font-sans text-base text-ashram-charcoal/90 dark:text-darkAshram-text/90 leading-relaxed">
              Under the benevolent spiritual direction of Guruji, Vatsalya Vatika provides a rare blend of modern academic excellence and timeless human virtues. Every morning and evening, students gather to receive wise counsel, meditation practices, and character guidance.
            </p>

            {/* 3 Pillars - Clean Text Layout */}
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {PILLARS.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-3"
                >
                  <span className="w-8 h-8 rounded-lg bg-ashram-saffron/10 dark:bg-amber-400/10 flex items-center justify-center text-ashram-saffron dark:text-amber-400 shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <div className="flex flex-col leading-none">
                    <span className="font-heading font-bold text-sm text-ashram-green dark:text-darkAshram-gold">{label}</span>
                    <span className="text-xs text-ashram-muted dark:text-darkAshram-muted mt-1">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons — Single Horizontal Row on Mobile */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowGurujiModal(true)}
                className="inline-flex items-center justify-center gap-1 sm:gap-2.5 px-2.5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-full bg-gradient-to-r from-ashram-green to-ashram-greenHover hover:from-ashram-greenHover hover:to-ashram-green text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-ashram-green/30 dark:hover:shadow-emerald-800/30 transform hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-center"
              >
                <span>Know More About Guruji</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 hidden min-[360px]:inline" />
              </button>

              {/* PDF Biography Button — Clean & Elegant */}
              <a
                href="/guruji-biography.pdf.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-1.5 sm:gap-3 px-2 sm:px-5 py-2.5 rounded-xl bg-white dark:bg-darkAshram-card border border-ashram-saffron/40 dark:border-amber-500/30 text-ashram-saffron dark:text-amber-400 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md hover:border-ashram-saffron dark:hover:border-amber-400 hover:-translate-y-0.5 active:scale-95 transition-all duration-250 overflow-hidden"
              >
                {/* Icon box */}
                <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-ashram-saffron/10 dark:bg-amber-400/10 group-hover:bg-ashram-saffron/20 dark:group-hover:bg-amber-400/20 transition-colors duration-200 shrink-0">
                  <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:scale-110 transition-transform duration-200" />
                </span>

                {/* Text */}
                <span className="flex flex-col leading-tight text-left">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-semibold text-ashram-muted dark:text-darkAshram-muted">Biography</span>
                  <span className="text-[10px] sm:text-xs font-bold text-ashram-charcoal dark:text-darkAshram-text truncate">Guruji's Life Story</span>
                </span>

                {/* PDF badge */}
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-ashram-saffron/10 dark:bg-amber-400/15 text-ashram-saffron dark:text-amber-400 border border-ashram-saffron/20 dark:border-amber-400/20 group-hover:bg-ashram-saffron group-hover:text-white dark:group-hover:bg-amber-500 dark:group-hover:text-white transition-all duration-200 shrink-0">
                  PDF
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Modal */}
      {showGurujiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white dark:bg-darkAshram-card rounded-3xl shadow-2xl border border-ashram-border dark:border-darkAshram-border max-h-[90vh] overflow-y-auto">
            {/* Modal header gradient */}
            <div className="bg-gradient-to-r from-ashram-green to-ashram-greenHover px-8 py-6 rounded-t-3xl">
              <button
                onClick={() => setShowGurujiModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ashram-saffron/20 border border-ashram-saffron/30 flex items-center justify-center text-2xl">
                  🪷
                </div>
                <div>
                  <h3 className="font-heading font-black text-2xl text-white">Life & Philosophy of Guruji</h3>
                  <p className="text-xs text-white/70 mt-0.5">Spiritual Founder & Mentor of Vatsalya Vatika</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-5 font-sans text-sm sm:text-base text-ashram-charcoal/90 dark:text-darkAshram-text/90 leading-relaxed">
              <p>
                Reverend Guruji, Swami Hariom Das Parivrajak, dedicated his youth to intense spiritual study, meditation, and complete selflessness. Driven by the deep conviction that "Serving Humanity is Serving God" (Nar Sewa is Narayan Sewa), he founded Vatsalya Vatika in 2005 to provide a sanctuary of care, education, and wisdom.
              </p>
              <p>
                As a lifelong pioneer of service, Swami Ji has set an inspiring example of complete dedication, even declaring the donation of his body (Dehdan) post-death to medical science for the benefit of society.
              </p>
              <p className="font-semibold text-ashram-green dark:text-darkAshram-gold">Guruji emphasizes three core pillars for every student:</p>
              <div className="space-y-3">
                {[
                  { emoji: '📖', title: 'Vidya (Wisdom)', desc: 'Education that removes ignorance, lights the mind, and enables independent thinking.' },
                  { emoji: '💚', title: 'Karuna (Compassion)', desc: 'A heart filled with love, empathy, and service for all living beings.' },
                  { emoji: '⚡', title: 'Karma (Right Action)', desc: 'Diligent effort, discipline, and moral values dedicated to the welfare of society.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-2xl bg-ashram-cream dark:bg-darkAshram-surface border border-ashram-border/50 dark:border-darkAshram-border/40">
                    <span className="text-xl shrink-0">{item.emoji}</span>
                    <div>
                      <p className="font-bold text-ashram-green dark:text-darkAshram-gold text-sm">{item.title}</p>
                      <p className="text-xs text-ashram-muted dark:text-darkAshram-muted mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p>
                Guruji personally guides the moral, physical, and emotional wellbeing of the children, hosting interactive dialogues to nurture national and human consciousness.
              </p>
            </div>

            <div className="px-8 pb-8 flex justify-end">
              <button
                onClick={() => setShowGurujiModal(false)}
                className="px-7 py-2.5 rounded-2xl bg-gradient-to-r from-ashram-saffron to-amber-500 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
