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
    if (isFirebaseConfigured && db) {
      try {
        const unsubscribe = onSnapshot(
          collection(db, COLLECTION_NAME),
          (snapshot) => {
            if (snapshot.empty) {
              callback(fallbackFacilities);
              return;
            }
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
            callback(items);
          },
          (err) => {
            console.warn('Firestore facilities subscribe error:', err);
            callback(getLocalFacilities());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Error subscribing to facilities:', err);
      }
    }

    callback(getLocalFacilities());
    const handleUpdate = () => callback(getLocalFacilities());
    window.addEventListener('vatsalya_facilities_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_facilities_updated', handleUpdate);
  },

  getFacilities: async (): Promise<FacilityItem[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => {
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
        }
      } catch (err) {
        console.warn('Failed to load facilities from Firestore:', err);
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

    if (isFirebaseConfigured && db) {
      const cleanData = cleanFirestoreData({
        ...newItem,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
      return {
        _id: docRef.id,
        ...newItem,
        createdAt: new Date().toISOString()
      } as FacilityItem;
    }

    const current = getLocalFacilities();
    const created: FacilityItem = {
      _id: `facility-${Date.now()}`,
      ...newItem,
      createdAt: new Date().toISOString()
    };
    setLocalFacilities([...current, created]);
    window.dispatchEvent(new CustomEvent('vatsalya_facilities_updated'));
    return created;
  },

  updateFacility: async (id: string, data: Partial<FacilityItem>): Promise<FacilityItem> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = { ...data };
      delete updateData._id;
      await updateDoc(docRef, cleanFirestoreData(updateData));
      return { _id: id, ...data } as FacilityItem;
    }

    const current = getLocalFacilities();
    const updated = current.map((item) => (item._id === id ? { ...item, ...data } : item));
    setLocalFacilities(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_facilities_updated'));
    return { _id: id, ...data } as FacilityItem;
  },

  deleteFacility: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return;
    }

    const current = getLocalFacilities();
    const updated = current.filter((item) => item._id !== id);
    setLocalFacilities(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_facilities_updated'));
  }
};
