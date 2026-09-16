import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { GurujiSection } from '../components/GurujiSection';
import { PremiumImageShowcase } from '../components/PremiumImageShowcase';
import { AboutSection } from '../components/AboutSection';
import { ImpactStats } from '../components/ImpactStats';
import { StudentLife } from '../components/StudentLife';
import { FacilitiesGrid } from '../components/FacilitiesGrid';
import { EventsSection } from '../components/EventsSection';
import { GalleryLightbox } from '../components/GalleryLightbox';
import { ContributeModal } from '../components/ContributeModal';
import { ContactSection } from '../components/ContactSection';
import { ReviewsSection } from '../components/ReviewsSection';
import { Footer } from '../components/Footer';

export const HomePage: React.FC = () => {
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ashram-cream dark:bg-darkAshram-bg text-ashram-charcoal dark:text-darkAshram-text transition-colors duration-300">
      <Navbar onOpenContributeModal={() => setIsContributeModalOpen(true)} />
      <main>
        {/* 1. Hero Section */}
        <Hero onOpenContributeModal={() => setIsContributeModalOpen(true)} />

        {/* 2. Guruji Section */}
        <GurujiSection />

        {/* 2.5 Premium Image Showcase — Moments That Inspire */}
        <PremiumImageShowcase />

        {/* 3. Impact Statistics */}
        <ImpactStats />

        {/* 5. Student Life */}
        <StudentLife />

        {/* 6. Facilities Grid */}
        <FacilitiesGrid />

        {/* 7. Events Section */}
        <EventsSection />

        {/* 8. Gallery Lightbox */}
        <GalleryLightbox />

        {/* 9. Visual Contribution Callout */}
        <section id="contribute" className="py-20 bg-gradient-to-br from-ashram-green via-ashram-greenHover to-black text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-ashram-gold/20 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <span className="text-xs uppercase tracking-widest font-semibold text-ashram-goldLight">
              Become a Beacon of Hope
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-ashram-cream leading-tight">
              Your Support Can Make a Difference
            </h2>
            <p className="font-sans text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              Your contribution helps provide education, food, healthcare, learning resources and other essential facilities to 200+ residential students.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setIsContributeModalOpen(true)}
                className="px-9 py-4 rounded-full bg-ashram-saffron hover:bg-ashram-saffronHover text-white font-bold text-base shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Contribute Now
              </button>
            </div>
          </div>
        </section>

        {/* 10. Contact Section */}
        <ContactSection />

        {/* 12. About Section */}
        <AboutSection />

        {/* 13. Reviews & Feedback */}
        <ReviewsSection />
      </main>
      <Footer />

      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
      />
    </div>
  );
};
