import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured, cleanFirestoreData } from '../lib/firebase';
import { SiteSettingsData } from '../types';
import { fallbackSiteSettings } from './fallbackData';

const COLLECTION_NAME = 'site_settings';
const DOC_ID = 'main';
const STORAGE_KEY = 'vatsalya_local_site_settings';

const getLocalSiteSettings = (): SiteSettingsData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return fallbackSiteSettings;
};

const setLocalSiteSettings = (settings: SiteSettingsData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
};

export const siteSettingsService = {
  subscribeToSiteSettings: (callback: (settings: SiteSettingsData) => void): (() => void) => {
    let unsubsFirestore: (() => void) | null = null;

    const notify = () => {
      callback(getLocalSiteSettings());
    };

    window.addEventListener('vatsalya_site_settings_updated', notify);
    notify();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        unsubsFirestore = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as SiteSettingsData;
            setLocalSiteSettings(data);
            callback(data);
          }
        }, (err) => {
          console.warn('Firestore site settings notice, using local data:', err.message);
        });
      } catch (err) {
        console.warn('Firestore site settings subscribe error:', err);
      }
    }

    return () => {
      window.removeEventListener('vatsalya_site_settings_updated', notify);
      if (unsubsFirestore) unsubsFirestore();
    };
  },

  getSettings: async (): Promise<SiteSettingsData> => {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        const docSnap = await Promise.race([
          getDoc(docRef),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettingsData;
          setLocalSiteSettings(data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to load site settings from Firestore (using local):', err);
      }
    }
    return getLocalSiteSettings();
  },

  updateSettings: async (data: Partial<SiteSettingsData>): Promise<SiteSettingsData> => {
    const current = getLocalSiteSettings();
    const merged: SiteSettingsData = { ...current, ...data };

    // 1. Save locally first (instant UI update)
    setLocalSiteSettings(merged);
    window.dispatchEvent(new CustomEvent('vatsalya_site_settings_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        const cleanData = cleanFirestoreData(merged);
        delete cleanData._id;
        await setDoc(docRef, cleanData, { merge: true });
      } catch (err: any) {
        console.warn('Firestore site settings update notice:', err.message);
      }
    }

    return merged;
  }
};
