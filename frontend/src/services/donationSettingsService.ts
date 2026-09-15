import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured, cleanFirestoreData } from '../lib/firebase';

export interface DonationSettings {
  _id?: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branch: string;
  upiId: string;
  qrCodeImage: string;
}

export const defaultDonationSettings: DonationSettings = {
  bankAccountName: 'Vatsalya Vatika Ashram Trust',
  bankAccountNumber: '123456789012',
  ifscCode: 'SBIN0001234',
  bankName: 'State Bank of India',
  branch: 'Sacred Valley Branch',
  upiId: 'vatsalyavatika@sbi',
  qrCodeImage: '/om1.png'
};

const DOC_ID = 'settings';
const COLLECTION_NAME = 'donation_settings';
const STORAGE_KEY = 'vatsalya_local_donation_settings';

const getLocalSettings = (): DonationSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return defaultDonationSettings;
};

const setLocalSettings = (settings: DonationSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
};

export const donationSettingsService = {
  subscribeToDonationSettings: (callback: (settings: DonationSettings) => void): (() => void) => {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            callback({ _id: docSnap.id, ...docSnap.data() } as DonationSettings);
          } else {
            // Initialize default
            setDoc(docRef, defaultDonationSettings).catch(() => {});
            callback(defaultDonationSettings);
          }
        });
        return unsubscribe;
      } catch (err) {
        console.warn('Firestore donation settings subscribe error:', err);
      }
    }

    callback(getLocalSettings());
    const handleUpdate = () => callback(getLocalSettings());
    window.addEventListener('vatsalya_donation_settings_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_donation_settings_updated', handleUpdate);
  },

  getSettings: async (): Promise<DonationSettings> => {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { _id: docSnap.id, ...docSnap.data() } as DonationSettings;
        }
      } catch (err) {
        console.warn('Failed to fetch donation settings from Firestore:', err);
      }
    }
    return getLocalSettings();
  },

  updateSettings: async (settings: Partial<DonationSettings>): Promise<DonationSettings> => {
    const current = await donationSettingsService.getSettings();
    const merged: DonationSettings = { ...current, ...settings };

    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      const cleanData = cleanFirestoreData(merged);
      delete cleanData._id;
      await setDoc(docRef, cleanData, { merge: true });
      return merged;
    }

    setLocalSettings(merged);
    window.dispatchEvent(new CustomEvent('vatsalya_donation_settings_updated'));
    return merged;
  }
};
