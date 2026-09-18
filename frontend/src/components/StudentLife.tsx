import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Sprout, ArrowRight, X, Heart } from 'lucide-react';
import { studentImageService } from '../services/studentImageService';
import { StudentImage } from '../types';

export const StudentLife: React.FC = () => {
  const [showStudentLifeModal, setShowStudentLifeModal] = useState(false);
  const [students, setStudents] = useState<StudentImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = studentImageService.subscribeToStudentImages((items) => {
      setStudents(items || []);
      setLoading(false);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  return (
    <section id="students" className="py-20 bg-white dark:bg-transparent transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-sans uppercase tracking-widest text-ashram-saffron dark:text-darkAshram-gold font-semibold">
            Nurturing Young Minds
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-ashram-green dark:text-darkAshram-gold mt-1 mb-4">
            Our Students
          </h2>
          <p className="font-sans text-ashram-charcoal/80 dark:text-darkAshram-text/80 text-lg sm:text-xl">
            We provide a holistic environment where every child's potential is recognized, 
            nurtured, and celebrated across all dimensions of life.
          </p>
        </div>

        {/* Dynamic Grid / Skeleton Loader */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-ashram-cream dark:bg-darkAshram-card rounded-[2rem] overflow-hidden border border-ashram-border/50 animate-pulse flex flex-col h-80"
              >
                <div className="aspect-[4/3] bg-black/5 dark:bg-white/5" />
                <div className="p-4 space-y-3 flex-grow">
                  <div className="h-5 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
                  <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
                  <div className="h-3 w-full bg-black/10 dark:bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {students.map((item, index) => {
              return (
                <div 
                  key={item._id || index}
                  className="group relative bg-ashram-cream dark:bg-darkAshram-card rounded-[2rem] overflow-hidden border border-ashram-border dark:border-darkAshram-border shadow-soft hover:shadow-glow transition-all duration-300 flex flex-col h-full"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <div className="absolute inset-0 bg-ashram-green/20 dark:bg-black/40 group-hover:bg-transparent transition-colors z-10 duration-500" />
                    <img 
                      src={item.image} 
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      style={{ objectPosition: item.focalPoint ? `${item.focalPoint.x}% ${item.focalPoint.y}%` : 'top center' }}
                    />
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-heading font-bold text-base text-ashram-green dark:text-darkAshram-gold mb-0.5">
                      {item.title}
                    </h3>
                    <p className="font-sans text-xs text-ashram-charcoal dark:text-darkAshram-text/80 leading-relaxed mb-3 flex-grow">
                      {item.description}
                    </p>
                    <button 
                      onClick={() => setShowStudentLifeModal(true)}
                      className="inline-flex items-center gap-1.5 font-sans font-bold text-sm text-ashram-saffron dark:text-darkAshram-gold hover:text-ashram-green transition-colors mt-auto"
                    >
                      Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: BookOpen, title: 'Academic Excellence', desc: 'Holistic curriculum encompassing sciences, languages, mathematics, and moral education for 200+ students.' },
              { icon: Trophy, title: 'Sports & Discipline', desc: 'Daily yoga, physical conditioning, athletics, and cultural arts fostering brotherhood and physical vigor.' },
              { icon: Sprout, title: 'Character & Values', desc: 'Deep-rooted spiritual grounding, community service, and ethical values preparing youth for leadership.' }
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="bg-ashram-cream dark:bg-darkAshram-card p-6 sm:p-8 rounded-[2rem] border border-ashram-border dark:border-darkAshram-border shadow-soft flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-ashram-saffron/10 text-ashram-saffron dark:text-darkAshram-gold flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-ashram-green dark:text-darkAshram-gold mb-2">
                    {pillar.title}
                  </h3>
                  <p className="font-sans text-sm text-ashram-charcoal/80 dark:text-darkAshram-text/80 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Details */}
      {showStudentLifeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text rounded-3xl shadow-2xl border border-ashram-border dark:border-darkAshram-border relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowStudentLifeModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-ashram-charcoal dark:text-darkAshram-text" />
            </button>
            <div className="p-8 sm:p-12">
              <h3 className="font-heading font-bold text-3xl text-ashram-green dark:text-darkAshram-gold mb-6 text-center">
                A Day at Vatsalya Vatika
              </h3>
              <div className="space-y-6 font-sans text-lg text-ashram-charcoal/80 dark:text-darkAshram-text/80 leading-relaxed">
                <p>
                  Life at Vatsalya Vatika is designed to provide a balanced, enriching, and loving environment. Our daily routine ensures that every child receives proper education, physical activity, and moral guidance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-ashram-cream dark:bg-darkAshram-surface p-6 rounded-2xl border border-ashram-border dark:border-darkAshram-border">
                    <h4 className="font-heading font-bold text-xl text-ashram-saffron dark:text-darkAshram-gold mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" /> Morning Routine
                    </h4>
                    <ul className="space-y-2 text-base">
                      <li>• 5:30 AM - Wake up & Yoga</li>
                      <li>• 7:00 AM - Nutritious Breakfast</li>
                      <li>• 8:00 AM - School / Academics</li>
                      <li>• 1:00 PM - Lunch & Rest</li>
                    </ul>
                  </div>
                  <div className="bg-ashram-cream dark:bg-darkAshram-surface p-6 rounded-2xl border border-ashram-border dark:border-darkAshram-border">
                    <h4 className="font-heading font-bold text-xl text-ashram-saffron dark:text-darkAshram-gold mb-3 flex items-center gap-2">
                      <Trophy className="w-5 h-5" /> Evening Routine
                    </h4>
                    <ul className="space-y-2 text-base">
                      <li>• 4:00 PM - Sports & Recreation</li>
                      <li>• 6:00 PM - Evening Prayers</li>
                      <li>• 7:00 PM - Homework & Study</li>
                      <li>• 8:30 PM - Dinner & Sleep</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
