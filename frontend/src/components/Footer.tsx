import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Instagram, Facebook, Youtube, MessageCircle, X, ShieldCheck } from 'lucide-react';
import { siteSettingsService } from '../services/siteSettingsService';

export const Footer: React.FC = () => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [whatsappHref, setWhatsappHref] = useState('https://wa.me/qr/T7URUC6LJNLCE1');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    siteSettingsService.getSettings().then((settings) => {
      if (settings?.contactPhone) {
        // Strip everything except digits
        const digits = settings.contactPhone.replace(/\D/g, '');
        if (digits.length >= 10) {
          const message = encodeURIComponent(
            'Hello Vatsalya Vatika, I would like to know more about your Ashram.'
          );
          setWhatsappHref(`https://wa.me/${digits}?text=${message}`);
        }
      }
    }).catch(() => {
      // Keep the fallback QR link if API fails
    });
  }, []);

  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Students', href: '#students' },
    { name: 'Facilities', href: '#facilities' },
    { name: 'Guruji', href: '#guruji' },
    { name: 'Events', href: '#events' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Contribute', href: '#contribute' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate(`/${href}`);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-ashram-green text-white dark:bg-darkAshram-bg pt-8 pb-8 border-t border-ashram-border/20 dark:border-darkAshram-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10 dark:border-darkAshram-border">

          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full border-[1.5px] border-amber-400/80 bg-slate-900 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6),inset_0_0_10px_rgba(251,191,36,0.4)] transition-all duration-300">
                <span className="text-3xl font-bold drop-shadow-[0_0_10px_rgba(251,191,36,1)] leading-none mt-0.5">ॐ</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-3xl text-ashram-goldLight leading-none">
                  Vatsalya Vatika
                </span>
                <span className="text-xs uppercase tracking-widest text-ashram-goldLight font-bold mt-1">
                  Ashram
                </span>
              </div>
            </div>

            <p className="font-sans text-xs text-white/80 dark:text-darkAshram-muted leading-relaxed max-w-sm">
              An educational & charitable Ashram providing holistic development, nutrition, accommodation, healthcare, and spiritual values to 200+ students.
            </p>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a href="https://www.instagram.com/vatikavatsalya?igsi=MTNkY2lwams3cXFoaw==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 hover:bg-ashram-saffron flex items-center justify-center text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://www.facebook.com/share/1DDX9BcbMk/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 hover:bg-ashram-saffron flex items-center justify-center text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://youtu.be/OgxRue7P8hs?si=pozFXRx7tkfbLYY3" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-full bg-white/10 hover:bg-ashram-saffron flex items-center justify-center text-white transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-white/10 hover:bg-ashram-saffron flex items-center justify-center text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-heading font-bold text-base text-ashram-goldLight">
              Quick Links
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-sans text-white/80 dark:text-darkAshram-muted">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleScroll(e, link.href)}
                  className="hover:text-ashram-goldLight transition-colors"
                >
                  • {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Col 3: Support CTA */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-heading font-bold text-base text-ashram-goldLight">
              Support Our Cause
            </h4>
            <p className="font-sans text-xs text-white/80 dark:text-darkAshram-muted leading-relaxed">
              Your small monthly contribution creates an everlasting impact in the lives of our 200+ students.
            </p>
            <a
              href="#contribute"
              onClick={(e) => handleScroll(e, '#contribute')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ashram-saffron hover:bg-ashram-saffronHover text-white font-medium text-xs shadow transition-colors"
            >
              <Heart className="w-3.5 h-3.5 fill-white/20" />
              <span>Contribute Today</span>
            </a>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-white/60 dark:text-darkAshram-muted">
          <p>© Vatsalya Vatika. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-ashram-goldLight transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-ashram-goldLight transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>

      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text rounded-2xl p-6 sm:p-8 shadow-2xl border border-ashram-border dark:border-darkAshram-border">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-ashram-border/50 dark:hover:bg-darkAshram-border"
              aria-label="Close privacy policy"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-ashram-saffron" />
              <h3 className="font-heading font-bold text-2xl text-ashram-green dark:text-darkAshram-gold">
                Privacy Policy
              </h3>
            </div>

            <div className="space-y-3 font-sans text-xs sm:text-sm text-ashram-muted dark:text-darkAshram-muted leading-relaxed">
              <p>
                At Vatsalya Vatika Ashram, we respect your privacy and protect the personal information you share through our website.
              </p>
              <p>
                <strong>Information Collection:</strong> Contact and contribution details may be collected for communication, acknowledgment, donation processing, and official documentation.
              </p>
              <p>
                <strong>Data Protection:</strong> We do not sell or rent your personal information. Necessary information may be shared with trusted service providers for payment or communication services.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-ashram-border dark:border-darkAshram-border flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 rounded-xl bg-ashram-saffron text-white text-xs font-semibold hover:bg-ashram-saffronHover transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
