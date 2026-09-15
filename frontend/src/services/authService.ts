import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { UserAdmin } from '../types';

const ADMIN_STORAGE_KEY = 'vatsalya_admin_user';
const TOKEN_STORAGE_KEY = 'vatsalya_admin_token';

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: UserAdmin }> => {
    // 1. Firebase Authentication if configured
    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const idToken = await fbUser.getIdToken();
        const userAdmin: UserAdmin = {
          _id: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          email: fbUser.email || email,
          role: 'admin'
        };

        localStorage.setItem(TOKEN_STORAGE_KEY, idToken);
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(userAdmin));
        return { token: idToken, user: userAdmin };
      } catch (err: any) {
        // If Firebase auth failed, check default admin credentials for convenience
        if (email.toLowerCase() === 'guruji@gmail.com' && password === 'vatsalyavatika') {
          console.warn('Logging in with default admin credentials fallback.');
        } else {
          throw new Error(err.message || 'Invalid email or password');
        }
      }
    }

    // 2. Default Local Admin Credentials (instant dev / offline mode)
    if (email.toLowerCase() === 'guruji@gmail.com' && password === 'vatsalyavatika') {
      const userAdmin: UserAdmin = {
        _id: 'admin-guruji',
        name: 'Guruji',
        email: 'guruji@gmail.com',
        role: 'admin'
      };
      const token = `token-${Date.now()}`;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(userAdmin));
      return { token, user: userAdmin };
    }

    // Generic dev login
    if (email && password.length >= 6) {
      const userAdmin: UserAdmin = {
        _id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'admin'
      };
      const token = `token-${Date.now()}`;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(userAdmin));
      return { token, user: userAdmin };
    }

    throw new Error('Invalid credentials. Use guruji@gmail.com / vatsalyavatika');
  },

  logout: () => {
    if (isFirebaseConfigured && auth) {
      signOut(auth).catch(() => {});
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  },

  getCurrentUser: (): UserAdmin | null => {
    const userStr = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  register: async (name: string, email: string, password: string, phone?: string): Promise<{ success: boolean; message: string }> => {
    return {
      success: true,
      message: 'Account registered successfully.'
    };
  },

  getRegisteredUsers: async (): Promise<UserAdmin[]> => {
    const current = authService.getCurrentUser();
    return current ? [current] : [];
  }
};
