import React, { useState } from 'react';
import { Heart, X, CheckCircle2, ShieldCheck, QrCode, Building2, Smartphone, Loader2, Phone } from 'lucide-react';
import { contributionService } from '../services/contributionService';
import { donationSettingsService, DonationSettings } from '../services/donationSettingsService';
import toast from 'react-hot-toast';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({ isOpen, onClose }) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('Education');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank' | 'card'>('upi');
  
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  
  const [donationSettings, setDonationSettings] = useState<DonationSettings | null>(null);
  
  React.useEffect(() => {
    if (isOpen) {
      const unsub = donationSettingsService.subscribeToDonationSettings(setDonationSettings);
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [isOpen]);

  // Validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    amount?: string;
  }>({});

  if (!isOpen) return null;

  const handleAmountClick = (amt: number) => {
    setSelectedAmount(amt);
    setCustomAmount('');
    if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
  };

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const validate = (): boolean => {
    const tempErrors: typeof errors = {};
    let isValid = true;

    const trimmedName = name.trim();
    if (!trimmedName) {
      tempErrors.name = 'Full Name is required.';
      isValid = false;
    } else if (trimmedName.length < 2) {
      tempErrors.name = 'Name must be at least 2 characters long.';
      isValid = false;
    } else if (trimmedName.length > 50) {
      tempErrors.name = 'Name cannot exceed 50 characters.';
      isValid = false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      tempErrors.email = 'Email address is required.';
      isValid = false;
    } else if (!/^(?:(?![^@]*\.{2})[a-zA-Z0-9._%+-]+@(?!gmail\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?![.])(?!.*[.]{2})[a-zA-Z0-9.]{6,30}(?<![.])@gmail\.com)$/i.test(trimmedEmail)) {
      tempErrors.email = 'Please enter a valid email. Random or sub-addressed Gmail addresses are not allowed.';
      isValid = false;
    }

    if (phone) {
      const trimmedPhone = phone.trim();
      if (!/^(?:\+?\d{1,3}[- ]?)?\d{10}$/.test(trimmedPhone)) {
        tempErrors.phone = 'Please enter a valid 10-digit mobile number.';
        isValid = false;
      }
    }

    if (finalAmount <= 0) {
      tempErrors.amount = 'Please select or enter a donation amount.';
      isValid = false;
    } else if (finalAmount < 100) {
      tempErrors.amount = 'Minimum contribution amount is ₹100.';
      isValid = false;
    } else if (finalAmount > 10000000) {
      tempErrors.amount = 'Amount cannot exceed ₹1,00,00,000.';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await contributionService.submitContribution({
        name: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : undefined,
        amount: finalAmount,
        purpose,
        paymentRef: `SIM-TXN-${Date.now().toString().slice(-8)}`
      });

      if (res.success) {
        setSuccessData(res.data);
        toast.success(res.message || 'Contribution submitted successfully!');
        setErrors({});
      } else {
        toast.error(res.message || 'Submission failed.');
      }
    } catch (err: any) {
      console.error('Contribution error:', err);
      toast.error(err.response?.data?.message || 'Unable to complete contribution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-darkAshram-card rounded-2xl p-5 sm:p-7 shadow-2xl border border-ashram-border dark:border-darkAshram-border max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={() => {
            setSuccessData(null);
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-ashram-border/50 dark:hover:bg-darkAshram-border text-ashram-charcoal dark:text-darkAshram-text"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          /* Success Screen */
          <div className="text-center py-8 sm:py-10 px-2 sm:px-6 space-y-5 animate-fadeIn">
            {/* Success Check Icon with Warm Subtle Halo */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-darkAshram-gold/10 text-emerald-600 dark:text-darkAshram-gold mx-auto flex items-center justify-center shadow-soft ring-8 ring-emerald-500/5 dark:ring-darkAshram-gold/5">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            {/* Main Thank You Heading */}
            <h3 className="font-heading font-bold text-2xl sm:text-3xl text-ashram-green dark:text-darkAshram-gold tracking-tight">
              Thank You, {successData.name || 'Dear Supporter'}!
            </h3>

            {/* Supporting Celebration Message */}
            <p className="font-sans text-base sm:text-lg text-ashram-charcoal/90 dark:text-ashram-cream/90 max-w-lg mx-auto leading-relaxed">
              Congratulations on your generous contribution of{' '}
              <span className="text-ashram-saffron font-bold">
                ₹{typeof successData.amount === 'number' ? successData.amount.toLocaleString('en-IN') : successData.amount}
              </span>{' '}
              towards <strong className="font-bold text-ashram-green dark:text-darkAshram-gold">{successData.purpose || 'Education'}</strong>.
            </p>

            {/* Secondary Warm Spiritual Message */}
            <p className="font-sans text-sm sm:text-base text-ashram-charcoal/70 dark:text-darkAshram-muted max-w-md mx-auto leading-relaxed pt-1">
              Your kindness and support will help us continue nurturing young minds and creating a brighter future.
            </p>

            {/* Action Button */}
            <div className="pt-6">
              <button
                onClick={() => {
                  setSuccessData(null);
                  onClose();
                }}
                className="px-9 py-3.5 rounded-full bg-ashram-saffron text-white font-semibold text-sm hover:bg-ashram-saffronHover shadow-soft hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          /* Main Form */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ashram-saffron/10 flex items-center justify-center text-ashram-saffron">
                <Heart className="w-5 h-5 fill-ashram-saffron/20" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-2xl text-ashram-green dark:text-darkAshram-gold">
                  Your Support Can Make a Difference
                </h3>
                <p className="text-xs text-ashram-muted dark:text-darkAshram-muted">
                  Empowering 200+ residential students with care, food, & education.
                </p>
              </div>
            </div>

            {/* Contact Before Donating Section */}
            <div className="mb-5 p-3 sm:p-3.5 rounded-xl bg-ashram-cream/80 dark:bg-darkAshram-surface/80 border border-ashram-border/80 dark:border-darkAshram-border/80 text-xs shadow-sm">
              <div className="flex items-center gap-1.5 text-ashram-green dark:text-darkAshram-gold font-bold uppercase tracking-wider text-[11px] mb-2">
                <Phone className="w-3.5 h-3.5 text-ashram-saffron dark:text-darkAshram-gold" />
                <span>Contact Before Donating</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-white/70 dark:bg-darkAshram-card/60 p-2 rounded-lg border border-ashram-border/50 dark:border-darkAshram-border/50">
                  <span className="text-ashram-charcoal dark:text-darkAshram-text font-medium">
                    Swami Hari Om Das Parivrajak <span className="text-[11px] text-ashram-muted dark:text-darkAshram-muted">(Sanchalak)</span>
                  </span>
                  <a
                    href="tel:+919416700220"
                    className="font-bold text-ashram-saffron dark:text-darkAshram-gold hover:underline whitespace-nowrap flex items-center gap-1 ml-auto sm:ml-2"
                  >
                    📞 +91 94167-00220
                  </a>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-white/70 dark:bg-darkAshram-card/60 p-2 rounded-lg border border-ashram-border/50 dark:border-darkAshram-border/50">
                  <span className="text-ashram-charcoal dark:text-darkAshram-text font-medium">
                    Shri Sant Rajendra Singh <span className="text-[11px] text-ashram-muted dark:text-darkAshram-muted">(Koshadhyaksh)</span>
                  </span>
                  <a
                    href="tel:+919416111944"
                    className="font-bold text-ashram-saffron dark:text-darkAshram-gold hover:underline whitespace-nowrap flex items-center gap-1 ml-auto sm:ml-2"
                  >
                    📞 +91 94161-11944
                  </a>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Select Preset Amount */}
              <div>
                <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text uppercase tracking-wider mb-2">
                  Select Contribution Amount
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { amount: 500, label: '₹500', desc: 'Support Learning' },
                    { amount: 1000, label: '₹1,000', desc: 'Support Food' },
                    { amount: 2500, label: '₹2,500', desc: 'Support Education' },
                  ].map((tier) => (
                    <button
                      type="button"
                      key={tier.amount}
                      onClick={() => handleAmountClick(tier.amount)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedAmount === tier.amount && !customAmount
                          ? 'border-ashram-saffron bg-ashram-saffron/10 dark:border-darkAshram-gold dark:bg-darkAshram-gold/20 text-ashram-saffron dark:text-darkAshram-gold font-bold shadow'
                          : 'border-ashram-border dark:border-darkAshram-border hover:bg-ashram-cream dark:hover:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text'
                      }`}
                    >
                      <div className="font-heading text-lg font-bold">{tier.label}</div>
                      <div className="text-[10px] text-ashram-muted dark:text-darkAshram-muted mt-0.5">{tier.desc}</div>
                    </button>
                  ))}

                  {/* Custom Amount Box */}
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Custom ₹"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(0);
                        if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
                      }}
                      className={`w-full h-full min-h-[58px] p-3 rounded-xl border text-sm font-semibold text-center focus:outline-none transition-all ${
                        customAmount
                          ? 'border-ashram-saffron bg-ashram-saffron/10 text-ashram-saffron dark:border-darkAshram-gold dark:text-darkAshram-gold'
                          : 'border-ashram-border dark:border-darkAshram-border bg-transparent dark:text-darkAshram-text'
                      }`}
                    />
                  </div>
                </div>
                {errors.amount && (
                  <p className="text-[11px] text-red-500 font-medium mt-1.5 pl-1">{errors.amount}</p>
                )}
              </div>

              {/* Purpose Selection */}
              <div>
                <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text uppercase tracking-wider mb-2">
                  Contribution Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-sm focus:outline-none focus:border-ashram-saffron"
                >
                  <option value="Education">📚 Education & Learning Material</option>
                  <option value="Food">🍲 Food & Daily Nutrition</option>
                  <option value="Healthcare">🏥 Healthcare & Medical Facilities</option>
                  <option value="Books">📖 Library & Textbooks</option>
                  <option value="General Support">🌱 General Ashram Welfare</option>
                </select>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ashram-muted dark:text-darkAshram-muted mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-transparent text-ashram-charcoal dark:text-darkAshram-text text-sm focus:outline-none focus:border-ashram-saffron ${
                      errors.name ? 'border-red-500 focus:border-red-500' : 'border-ashram-border dark:border-darkAshram-border'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 pl-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ashram-muted dark:text-darkAshram-muted mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-transparent text-ashram-charcoal dark:text-darkAshram-text text-sm focus:outline-none focus:border-ashram-saffron ${
                      errors.email ? 'border-red-500 focus:border-red-500' : 'border-ashram-border dark:border-darkAshram-border'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 pl-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ashram-muted dark:text-darkAshram-muted mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-transparent text-ashram-charcoal dark:text-darkAshram-text text-sm focus:outline-none focus:border-ashram-saffron ${
                      errors.phone ? 'border-red-500 focus:border-red-500' : 'border-ashram-border dark:border-darkAshram-border'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 pl-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Configurable Payment Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text uppercase tracking-wider mb-2">
                  Payment Method (Configured by Ashram Admin)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-ashram-saffron bg-ashram-saffron/10 text-ashram-saffron font-bold'
                        : 'border-ashram-border dark:border-darkAshram-border text-ashram-muted'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> UPI / QR Code
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'bank'
                        ? 'border-ashram-saffron bg-ashram-saffron/10 text-ashram-saffron font-bold'
                        : 'border-ashram-border dark:border-darkAshram-border text-ashram-muted'
                    }`}
                  >
                    <Building2 className="w-4 h-4" /> Bank Transfer
                  </button>

                </div>

                <div className="mt-3 p-3 rounded-xl bg-ashram-cream dark:bg-darkAshram-surface border border-ashram-border/60 dark:border-darkAshram-border/60 text-xs text-ashram-muted dark:text-darkAshram-muted">
                  {paymentMethod === 'upi' && (
                    <div className="space-y-2">
                      <p>📌 <strong>UPI ID:</strong> {donationSettings?.upiId || 'vatsalyavatika@upi'}</p>
                      <button
                        type="button"
                        onClick={() => setShowQR(true)}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-ashram-saffron/15 hover:bg-ashram-saffron/25 border border-ashram-saffron/40 text-ashram-saffron font-bold text-xs transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>📲 Tap to View QR Code</span>
                      </button>
                    </div>
                  )}
                  {paymentMethod === 'bank' && (
                    <p>📌 <strong>Bank Details:</strong> [Bank Name: {donationSettings?.bankName || 'Your Bank Name'} - {donationSettings?.bankAccountName || 'Vatsalya Vatika Trust'} | A/C: {donationSettings?.bankAccountNumber || 'XXXX-XXXX-XXXX'} | IFSC: {donationSettings?.ifscCode || 'XXXX0001234'} | Branch: {donationSettings?.branch || 'Your Branch Name'}]</p>
                  )}
                  {paymentMethod === 'card' && (
                    <p>📌 <strong>Gateway:</strong> Secure Payment Gateway Integration Enabled</p>
                  )}
                </div>
              </div>

              {/* QR Code Lightbox */}
              {showQR && (
                <div
                  className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
                  onClick={() => setShowQR(false)}
                >
                  <div
                    className="relative bg-white dark:bg-darkAshram-card rounded-2xl p-6 shadow-2xl max-w-xs w-full mx-4 animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setShowQR(false)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-ashram-border/60 hover:bg-ashram-border text-ashram-charcoal dark:text-darkAshram-text transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="text-center mb-3">
                      <h4 className="font-heading font-bold text-lg text-ashram-green dark:text-darkAshram-gold">Scan & Donate</h4>
                      <p className="text-xs text-ashram-muted dark:text-darkAshram-muted">Scan with any UPI app to donate</p>
                    </div>
                    <div className="flex justify-center">
                      <div className="p-2 rounded-xl border-4 border-ashram-saffron/60 shadow-lg">
                        <img
                          src={donationSettings?.qrCodeImage || "/donate-qr.jpg"}
                          alt="Donate QR Code"
                          className="w-48 h-48 rounded-lg object-contain"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-xs font-bold text-ashram-saffron">UPI ID: {donationSettings?.upiId || 'vatsalyavatika@upi'}</p>
                      <p className="text-[10px] text-ashram-muted dark:text-darkAshram-muted mt-1">Tap outside to close</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-ashram-saffron hover:bg-ashram-saffronHover text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing Contribution...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 fill-white/20" />
                      <span>Contribute ₹{finalAmount} Now</span>
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
