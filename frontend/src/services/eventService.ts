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
    let unsubsFirestore: (() => void) | null = null;

    const notify = () => {
      callback(getLocalFallbackEvents());
    };

    // 1. Immediately provide local data
    window.addEventListener('vatsalya_events_updated', notify);
    notify();

    // 2. Connect to Firestore live stream if active
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        unsubsFirestore = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const remoteItems: EventItem[] = snapshot.docs.map((docSnap) => {
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
              setLocalFallbackEvents(remoteItems);
              callback(remoteItems);
            }
          },
          (err) => {
            console.warn('Firestore events snapshot notice, using local data:', err.message);
          }
        );
      } catch (e) {
        console.warn('Error creating events subscription:', e);
      }
    }

    return () => {
      window.removeEventListener('vatsalya_events_updated', notify);
      if (unsubsFirestore) unsubsFirestore();
    };
  },

  getEvents: async (): Promise<EventItem[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await Promise.race([
          getDocs(q),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
        ]);
        if (!snapshot.empty) {
          const items = snapshot.docs.map((docSnap) => {
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
          setLocalFallbackEvents(items);
          return items;
        }
      } catch (err) {
        console.warn('Failed to fetch events from Firestore (using local):', err);
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

    // 1. Save locally first (instant UI update)
    const current = getLocalFallbackEvents();
    const created: EventItem = {
      _id: `evt-${Date.now()}`,
      ...newEvent,
      createdAt: new Date().toISOString()
    } as EventItem;
    setLocalFallbackEvents([created, ...current]);
    window.dispatchEvent(new CustomEvent('vatsalya_events_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const cleanData = cleanFirestoreData({
          ...newEvent,
          createdAt: serverTimestamp()
        });
        const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
        created._id = docRef.id;
      } catch (err: any) {
        console.warn('Firestore event save notice:', err.message);
      }
    }

    return created;
  },

  updateEvent: async (id: string, data: Partial<EventItem>): Promise<EventItem> => {
    // 1. Update locally first
    const current = getLocalFallbackEvents();
    const updated = current.map((e) => (e._id === id ? { ...e, ...data } : e));
    setLocalFallbackEvents(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_events_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updatePayload: any = { ...data };
        delete updatePayload._id;
        await updateDoc(docRef, cleanFirestoreData(updatePayload));
      } catch (err: any) {
        console.warn('Firestore event update notice:', err.message);
      }
    }

    return { _id: id, ...data } as EventItem;
  },

  deleteEvent: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    // 1. Remove locally first
    const current = getLocalFallbackEvents();
    const updated = current.filter((e) => e._id !== id);
    setLocalFallbackEvents(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_events_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (err: any) {
        console.warn('Firestore event delete notice:', err.message);
      }
    }
  }
};
