import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { UserAdmin } from '../types';

const ADMIN_STORAGE_KEY = 'vatsalya_admin_user';
const TOKEN_STORAGE_KEY = 'vatsalya_admin_token';

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: UserAdmin }> => {
    // 1. Firebase Authentication
    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
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
        const errorCode = err.code || '';
        if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
          throw new Error('Invalid email or password.');
        } else if (errorCode === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again later.');
        }
        throw new Error(err.message || 'Authentication failed. Please check your credentials.');
      }
    }

    // 2. Offline / Local development fallback only when Firebase is not configured
    if (email && password.length >= 6) {
      const userAdmin: UserAdmin = {
        _id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim(),
        role: 'admin'
      };
      const token = `local-token-${Date.now()}`;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(userAdmin));
      return { token, user: userAdmin };
    }

    throw new Error('Please enter a valid email and password.');
  },

  logout: async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch {}
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
    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
        return {
          success: true,
          message: 'Account registered successfully.'
        };
      } catch (err: any) {
        throw new Error(err.message || 'Registration failed.');
      }
    }

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
