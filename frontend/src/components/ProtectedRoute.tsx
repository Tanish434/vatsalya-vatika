import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = true }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 1. If not authenticated, prompt login or redirect
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-ashram-cream dark:bg-darkAshram-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <LogIn className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold text-ashram-green dark:text-darkAshram-gold">
              Admin Authentication Required
            </h2>
            <p className="text-sm text-ashram-muted dark:text-darkAshram-muted">
              Please sign in with an authorized administrator account to access this panel.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3 rounded-xl bg-ashram-green text-white dark:bg-darkAshram-gold dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Sign In as Admin
            </button>
            <Link
              to="/"
              className="w-full py-3 rounded-xl border border-ashram-border dark:border-darkAshram-border text-ashram-charcoal dark:text-darkAshram-text font-semibold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Website
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signin"
        />
      </div>
    );
  }

  // 2. If authenticated, but not an admin
  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-ashram-cream dark:bg-darkAshram-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-darkAshram-card border border-rose-200 dark:border-rose-900/40 rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold text-ashram-charcoal dark:text-darkAshram-text">
              Access Restricted
            </h2>
            <p className="text-sm text-ashram-muted dark:text-darkAshram-muted">
              You are signed in as <span className="font-medium text-ashram-charcoal dark:text-white">{user.email}</span>. This account does not have administrator privileges.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                logout();
                setShowAuthModal(true);
              }}
              className="w-full py-3 rounded-xl bg-ashram-green text-white dark:bg-darkAshram-gold dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Switch to Admin Account
            </button>
            <Link
              to="/"
              className="w-full py-3 rounded-xl border border-ashram-border dark:border-darkAshram-border text-ashram-charcoal dark:text-darkAshram-text font-semibold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signin"
        />
      </div>
    );
  }

  return children;
};
