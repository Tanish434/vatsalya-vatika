import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured, deleteMediaFromStorage, cleanFirestoreData } from '../lib/firebase';
import { EventItem } from '../types';
import { fallbackEvents } from './fallbackData';

const COLLECTION_NAME = 'events';
const STORAGE_KEY = 'vatsalya_local_events';

const getLocalFallbackEvents = (): EventItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return fallbackEvents;
};

const setLocalFallbackEvents = (items: EventItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
};

export const eventService = {
  subscribeToEvents: (callback: (items: EventItem[]) => void): (() => void) => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              callback(fallbackEvents);
              return;
            }
            const items: EventItem[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                _id: docSnap.id,
                title: data.title || '',
                description: data.description || '',
                image: data.image || '',
                date: data.date || '',
                category: data.category || 'Educational Events',
                location: data.location || 'Ashram Campus',
                focalPoint: data.focalPoint || { x: 50, y: 50 },
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
              };
            });
            callback(items);
          },
          (err) => {
            console.warn('Firestore events snapshot error:', err);
            callback(getLocalFallbackEvents());
          }
        );
        return unsubscribe;
      } catch (e) {
        console.warn('Error creating events subscription:', e);
      }
    }

    callback(getLocalFallbackEvents());
    const handleLocalUpdate = () => callback(getLocalFallbackEvents());
    window.addEventListener('vatsalya_events_updated', handleLocalUpdate);
    return () => window.removeEventListener('vatsalya_events_updated', handleLocalUpdate);
  },

  getEvents: async (): Promise<EventItem[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              title: data.title || '',
              description: data.description || '',
              image: data.image || '',
              date: data.date || '',
              category: data.category || 'Educational Events',
              location: data.location || 'Ashram Campus',
              focalPoint: data.focalPoint || { x: 50, y: 50 },
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
        }
      } catch (err) {
        console.warn('Failed to fetch events from Firestore:', err);
      }
    }
    return getLocalFallbackEvents();
  },

  createEvent: async (data: Partial<EventItem>): Promise<EventItem> => {
    const newEvent: Partial<EventItem> = {
      title: data.title || '',
      description: data.description || '',
      image: data.image || '',
      date: data.date || '',
      category: data.category || 'Educational Events',
      location: data.location || 'Ashram Campus',
      focalPoint: data.focalPoint || { x: 50, y: 50 }
    };

    if (isFirebaseConfigured && db) {
      const cleanData = cleanFirestoreData({
        ...newEvent,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
      return {
        _id: docRef.id,
        ...newEvent,
        createdAt: new Date().toISOString()
      } as EventItem;
    }

    const current = getLocalFallbackEvents();
    const created: EventItem = {
      _id: `evt-${Date.now()}`,
      ...newEvent,
      createdAt: new Date().toISOString()
    } as EventItem;
    setLocalFallbackEvents([created, ...current]);
    window.dispatchEvent(new CustomEvent('vatsalya_events_updated'));
    return created;
  },

  updateEvent: async (id: string, data: Partial<EventItem>): Promise<EventItem> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updatePayload: any = { ...data };
      delete updatePayload._id;
      await updateDoc(docRef, cleanFirestoreData(updatePayload));
      return { _id: id, ...data } as EventItem;
    }

    const current = getLocalFallbackEvents();
    const updated = current.map((e) => (e._id === id ? { ...e, ...data } : e));
    setLocalFallbackEvents(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_events_updated'));
    return { _id: id, ...data } as EventItem;
  },

  deleteEvent: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return;
    }

    const current = getLocalFallbackEvents();
    const updated = current.filter((e) => e._id !== id);
    setLocalFallbackEvents(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_events_updated'));
  }
};
