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
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            callback(docSnap.data() as SiteSettingsData);
          } else {
            setDoc(docRef, fallbackSiteSettings).catch(() => {});
            callback(fallbackSiteSettings);
          }
        });
        return unsubscribe;
      } catch (err) {
        console.warn('Firestore site settings subscribe error:', err);
      }
    }

    callback(getLocalSiteSettings());
    const handleUpdate = () => callback(getLocalSiteSettings());
    window.addEventListener('vatsalya_site_settings_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_site_settings_updated', handleUpdate);
  },

  getSettings: async (): Promise<SiteSettingsData> => {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as SiteSettingsData;
        }
      } catch (err) {
        console.warn('Failed to load site settings from Firestore:', err);
      }
    }
    return getLocalSiteSettings();
  },

  updateSettings: async (data: Partial<SiteSettingsData>): Promise<SiteSettingsData> => {
    const current = await siteSettingsService.getSettings();
    const merged: SiteSettingsData = { ...current, ...data };

    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      const cleanData = cleanFirestoreData(merged);
      delete cleanData._id;
      await setDoc(docRef, cleanData, { merge: true });
      return merged;
    }

    setLocalSiteSettings(merged);
    window.dispatchEvent(new CustomEvent('vatsalya_site_settings_updated'));
    return merged;
  }
};
