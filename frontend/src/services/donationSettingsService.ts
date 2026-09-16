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
    let unsubsFirestore: (() => void) | null = null;

    const notify = () => {
      callback(getLocalSettings());
    };

    window.addEventListener('vatsalya_donation_settings_updated', notify);
    notify();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        unsubsFirestore = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = { _id: docSnap.id, ...docSnap.data() } as DonationSettings;
              setLocalSettings(data);
              callback(data);
            }
          },
          (err) => {
            console.warn('Firestore donation settings notice, using local data:', err.message);
          }
        );
      } catch (err) {
        console.warn('Firestore donation settings subscribe error:', err);
      }
    }

    return () => {
      window.removeEventListener('vatsalya_donation_settings_updated', notify);
      if (unsubsFirestore) unsubsFirestore();
    };
  },

  getSettings: async (): Promise<DonationSettings> => {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        const docSnap = await Promise.race([
          getDoc(docRef),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        if (docSnap.exists()) {
          const data = { _id: docSnap.id, ...docSnap.data() } as DonationSettings;
          setLocalSettings(data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to fetch donation settings from Firestore (using local):', err);
      }
    }
    return getLocalSettings();
  },

  updateSettings: async (settings: Partial<DonationSettings>): Promise<DonationSettings> => {
    const current = getLocalSettings();
    const merged: DonationSettings = { ...current, ...settings };

    // 1. Save locally first (instant UI update)
    setLocalSettings(merged);
    window.dispatchEvent(new CustomEvent('vatsalya_donation_settings_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        const cleanData = cleanFirestoreData(merged);
        delete cleanData._id;
        await setDoc(docRef, cleanData, { merge: true });
      } catch (err: any) {
        console.warn('Firestore update donation settings notice:', err.message);
      }
    }

    return merged;
  }
};
