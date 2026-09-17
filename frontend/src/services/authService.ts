import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { UserAdmin } from '../types';

const ADMIN_STORAGE_KEY = 'vatsalya_admin_user';
const TOKEN_STORAGE_KEY = 'vatsalya_admin_token';

const getAdminEmails = (): string[] => {
  const envEmails = (import.meta as any).env?.VITE_ADMIN_EMAILS || '';
  const defaults = ['monuvatika@gmail.com', 'admin@vatsalyavatika.com', 'admin@ashram.com'];
  const list = [...defaults, ...envEmails.split(',')]
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(list));
};

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: UserAdmin }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Firebase Authentication
    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;
        const idToken = await fbUser.getIdToken();

        // Determine user role: strictly authorized admin emails only
        const role: 'admin' | 'user' = getAdminEmails().includes(cleanEmail) ? 'admin' : 'user';

        const userAdmin: UserAdmin = {
          _id: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          email: fbUser.email || cleanEmail,
          role
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
    if (cleanEmail && password.length >= 6) {
      const role: 'admin' | 'user' = getAdminEmails().includes(cleanEmail) ? 'admin' : 'user';
      const userAdmin: UserAdmin = {
        _id: `user-${Date.now()}`,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role
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
      const user = JSON.parse(userStr);
      if (user && user.role === 'admin') {
        const cleanEmail = (user.email || '').trim().toLowerCase();
        if (!getAdminEmails().includes(cleanEmail)) {
          // Demote forged or stale admin status in storage immediately
          user.role = 'user';
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
        }
      }
      return user;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  isAdmin: (): boolean => {
    const current = authService.getCurrentUser();
    return !!(current && current.role === 'admin' && getAdminEmails().includes((current.email || '').trim().toLowerCase()));
  },

  register: async (name: string, email: string, password: string, phone?: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const role: 'admin' | 'user' = getAdminEmails().includes(cleanEmail) ? 'admin' : 'user';

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }

        // Persist user role and details in Firestore users collection
        if (db) {
          try {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              name: name.trim(),
              email: cleanEmail,
              phone: phone ? phone.trim() : '',
              role,
              createdAt: serverTimestamp()
            }, { merge: true });
          } catch {}
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
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          return snap.docs.map(d => {
            const data = d.data();
            const email = (data.email || '').trim().toLowerCase();
            return {
              _id: d.id,
              name: data.name || email.split('@')[0] || 'User',
              email,
              role: getAdminEmails().includes(email) ? 'admin' : 'user',
              phone: data.phone || ''
            };
          });
        }
      } catch (err) {
        console.warn('Failed to fetch registered users from Firestore:', err);
      }
    }
    const current = authService.getCurrentUser();
    return current ? [current] : [];
  }
};
