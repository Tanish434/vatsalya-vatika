import {
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured, cleanFirestoreData } from '../lib/firebase';
import { ContributionRecord, ApiResponse } from '../types';
import { activityService } from './activityService';

const COLLECTION_NAME = 'contributions';
const STORAGE_KEY = 'vatsalya_local_contributions';

const getLocalContributions = (): ContributionRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const setLocalContributions = (items: ContributionRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const contributionService = {
  subscribeToContributions: (callback: (items: ContributionRecord[]) => void): (() => void) => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const items: ContributionRecord[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                _id: docSnap.id,
                name: data.name || 'Anonymous Donor',
                email: data.email || '',
                phone: data.phone || '',
                amount: Number(data.amount) || 0,
                purpose: data.purpose || 'General Support',
                paymentStatus: data.paymentStatus || 'completed',
                paymentRef: data.paymentRef || '',
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
              };
            });
            callback(items);
          },
          (err) => {
            console.warn('Firestore contributions subscription error:', err);
            callback(getLocalContributions());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Error creating contribution subscription:', err);
      }
    }

    callback(getLocalContributions());
    const handleUpdate = () => callback(getLocalContributions());
    window.addEventListener('vatsalya_contributions_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_contributions_updated', handleUpdate);
  },

  submitContribution: async (data: {
    name: string;
    email: string;
    phone?: string;
    amount: number;
    purpose: any;
    paymentRef?: string;
  }): Promise<ApiResponse<ContributionRecord>> => {
    const newContrib: Partial<ContributionRecord> = {
      name: data.name || 'Kind Donor',
      email: data.email,
      phone: data.phone || '',
      amount: data.amount,
      purpose: data.purpose || 'General Support',
      paymentStatus: 'completed',
      paymentRef: data.paymentRef || `TXN${Date.now()}`
    };

    if (isFirebaseConfigured && db) {
      const cleanData = cleanFirestoreData({
        ...newContrib,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);

      activityService.logActivity(
        'contribution',
        '💰 New Donation Received',
        `${data.name} contributed ₹${data.amount.toLocaleString()} for ${data.purpose || 'General Support'}.`,
        { name: data.name, email: data.email, amount: data.amount, purpose: data.purpose || 'General Support', paymentRef: newContrib.paymentRef }
      ).catch(() => {});

      return {
        success: true,
        message: 'Contribution recorded successfully. Thank you for your support!',
        data: {
          _id: docRef.id,
          ...newContrib,
          createdAt: new Date().toISOString()
        } as ContributionRecord
      };
    }

    const current = getLocalContributions();
    const created: ContributionRecord = {
      _id: `contrib-${Date.now()}`,
      ...newContrib,
      createdAt: new Date().toISOString()
    } as ContributionRecord;
    setLocalContributions([created, ...current]);
    window.dispatchEvent(new CustomEvent('vatsalya_contributions_updated'));

    activityService.logActivity(
      'contribution',
      '💰 New Donation Received',
      `${data.name} contributed ₹${data.amount.toLocaleString()} for ${data.purpose || 'General Support'}.`,
      { name: data.name, email: data.email, amount: data.amount, purpose: data.purpose || 'General Support', paymentRef: newContrib.paymentRef }
    ).catch(() => {});

    return {
      success: true,
      message: 'Contribution recorded successfully. Thank you for your support!',
      data: created
    };
  },

  getContributions: async (): Promise<ContributionRecord[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              name: data.name || 'Anonymous Donor',
              email: data.email || '',
              phone: data.phone || '',
              amount: Number(data.amount) || 0,
              purpose: data.purpose || 'General Support',
              paymentStatus: data.paymentStatus || 'completed',
              paymentRef: data.paymentRef || '',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
        }
      } catch (err) {
        console.warn('Failed to load contributions from Firestore:', err);
      }
    }
    return getLocalContributions();
  },

  deleteContribution: async (id: string): Promise<void> => {
    const current = getLocalContributions();
    const updated = current.filter((c) => c._id !== id);
    setLocalContributions(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_contributions_updated'));

    if (isFirebaseConfigured && db) {
      const firestore = db;
      try {
        await deleteDoc(doc(firestore, COLLECTION_NAME, id));
      } catch (err) {
        console.warn('Firestore delete contribution error:', err);
      }
    }
  },

  clearAllContributions: async (): Promise<void> => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setLocalContributions([]);
    window.dispatchEvent(new CustomEvent('vatsalya_contributions_updated'));

    if (isFirebaseConfigured && db) {
      const firestore = db;
      try {
        const snapshot = await getDocs(collection(firestore, COLLECTION_NAME));
        const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(doc(firestore, COLLECTION_NAME, docSnap.id)));
        await Promise.all(deletePromises);
      } catch (err) {
        console.warn('Failed to clear Firestore contributions:', err);
      }
    }
  }
};
