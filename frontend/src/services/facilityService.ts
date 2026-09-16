import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured, deleteMediaFromStorage, cleanFirestoreData } from '../lib/firebase';
import { FacilityItem } from '../types';
import { fallbackFacilities } from './fallbackData';

const COLLECTION_NAME = 'facilities';
const STORAGE_KEY = 'vatsalya_local_facilities';

const getLocalFacilities = (): FacilityItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return fallbackFacilities;
};

const setLocalFacilities = (items: FacilityItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const facilityService = {
  subscribeToFacilities: (callback: (items: FacilityItem[]) => void): (() => void) => {
    let unsubsFirestore: (() => void) | null = null;

    const notify = () => {
      callback(getLocalFacilities());
    };

    window.addEventListener('vatsalya_facilities_updated', notify);
    notify();

    if (isFirebaseConfigured && db) {
      try {
        unsubsFirestore = onSnapshot(
          collection(db, COLLECTION_NAME),
          (snapshot) => {
            if (!snapshot.empty) {
              const items: FacilityItem[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                  _id: docSnap.id,
                  title: data.title || '',
                  description: data.description || '',
                  icon: data.icon || 'BookOpen',
                  image: data.image || '',
                  focalPoint: data.focalPoint || { x: 50, y: 50 },
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
                };
              });
              setLocalFacilities(items);
              callback(items);
            }
          },
          (err) => {
            console.warn('Firestore facilities notice, using local data:', err.message);
          }
        );
      } catch (err) {
        console.warn('Error subscribing to facilities:', err);
      }
    }

    return () => {
      window.removeEventListener('vatsalya_facilities_updated', notify);
      if (unsubsFirestore) unsubsFirestore();
    };
  },

  getFacilities: async (): Promise<FacilityItem[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await Promise.race([
          getDocs(collection(db, COLLECTION_NAME)),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
        ]);
        if (!snapshot.empty) {
          const items = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              title: data.title || '',
              description: data.description || '',
              icon: data.icon || 'BookOpen',
              image: data.image || '',
              focalPoint: data.focalPoint || { x: 50, y: 50 },
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
          setLocalFacilities(items);
          return items;
        }
      } catch (err) {
        console.warn('Failed to load facilities from Firestore (using local):', err);
      }
    }
    return getLocalFacilities();
  },

  createFacility: async (data: Partial<FacilityItem>): Promise<FacilityItem> => {
    const newItem = {
      title: data.title || '',
      description: data.description || '',
      icon: data.icon || 'BookOpen',
      image: data.image || '',
      focalPoint: data.focalPoint || { x: 50, y: 50 }
    };

    // 1. Save locally first (instant UI update)
    const current = getLocalFacilities();
    const created: FacilityItem = {
      _id: `facility-${Date.now()}`,
      ...newItem,
      createdAt: new Date().toISOString()
    };
    setLocalFacilities([...current, created]);
    window.dispatchEvent(new CustomEvent('vatsalya_facilities_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const cleanData = cleanFirestoreData({
          ...newItem,
          createdAt: serverTimestamp()
        });
        const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
        created._id = docRef.id;
      } catch (err: any) {
        console.warn('Firestore createFacility notice:', err.message);
      }
    }

    return created;
  },

  updateFacility: async (id: string, data: Partial<FacilityItem>): Promise<FacilityItem> => {
    // 1. Update locally first
    const current = getLocalFacilities();
    const updated = current.map((item) => (item._id === id ? { ...item, ...data } : item));
    setLocalFacilities(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_facilities_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: any = { ...data };
        delete updateData._id;
        await updateDoc(docRef, cleanFirestoreData(updateData));
      } catch (err: any) {
        console.warn('Firestore updateFacility notice:', err.message);
      }
    }

    return { _id: id, ...data } as FacilityItem;
  },

  deleteFacility: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    // 1. Delete locally first
    const current = getLocalFacilities();
    const updated = current.filter((item) => item._id !== id);
    setLocalFacilities(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_facilities_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (err: any) {
        console.warn('Firestore deleteFacility notice:', err.message);
      }
    }
  }
};
