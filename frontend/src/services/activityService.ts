import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured, cleanFirestoreData } from '../lib/firebase';
import { ActivityItem } from '../types';

const COLLECTION_NAME = 'activities';
const STORAGE_KEY = 'vatsalya_local_activities';

const getLocalActivities = (): ActivityItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const setLocalActivities = (items: ActivityItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const activityService = {
  subscribeToActivities: (callback: (items: ActivityItem[]) => void): (() => void) => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const items: ActivityItem[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                _id: docSnap.id,
                type: data.type || 'other',
                title: data.title || '',
                description: data.description || '',
                isRead: Boolean(data.isRead),
                metadata: data.metadata || {},
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
              };
            });
            callback(items);
          },
          (err) => {
            console.warn('Firestore activity subscribe error:', err);
            callback(getLocalActivities());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Error subscribing to activities:', err);
      }
    }

    callback(getLocalActivities());
    const handleUpdate = () => callback(getLocalActivities());
    window.addEventListener('vatsalya_activities_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_activities_updated', handleUpdate);
  },

  getActivities: async (): Promise<ActivityItem[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              type: data.type || 'other',
              title: data.title || '',
              description: data.description || '',
              isRead: Boolean(data.isRead),
              metadata: data.metadata || {},
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
        }
      } catch (err) {
        console.warn('Failed to load activities from Firestore:', err);
      }
    }
    return getLocalActivities();
  },

  getUnreadCount: async (): Promise<number> => {
    const list = await activityService.getActivities();
    return list.filter((a) => !a.isRead).length;
  },

  markRead: async (id: string): Promise<ActivityItem> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { isRead: true });
    }

    const current = getLocalActivities();
    const updated = current.map((a) => (a._id === id ? { ...a, isRead: true } : a));
    setLocalActivities(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_activities_updated'));
    return updated.find((a) => a._id === id) || ({ _id: id, isRead: true } as any);
  },

  markAllRead: async (): Promise<void> => {
    const current = getLocalActivities();
    const updated = current.map((a) => ({ ...a, isRead: true }));
    setLocalActivities(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_activities_updated'));
  },

  deleteActivity: async (id: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return;
    }

    const current = getLocalActivities();
    const updated = current.filter((a) => a._id !== id);
    setLocalActivities(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_activities_updated'));
  },

  logActivity: async (
    type: ActivityItem['type'],
    title: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<void> => {
    const newAct = {
      type,
      title,
      description,
      metadata,
      isRead: false
    };

    if (isFirebaseConfigured && db) {
      try {
        const cleanData = cleanFirestoreData({
          ...newAct,
          createdAt: serverTimestamp()
        });
        await addDoc(collection(db, COLLECTION_NAME), cleanData);
      } catch (err) {
        console.warn('Failed to save activity to Firestore:', err);
      }
    }

    const current = getLocalActivities();
    const created: ActivityItem = {
      _id: `act-${Date.now()}`,
      ...newAct,
      createdAt: new Date().toISOString()
    };
    setLocalActivities([created, ...current.slice(0, 499)]);
    window.dispatchEvent(new CustomEvent('vatsalya_activities_updated'));

    // Fire non-blocking email alert to admin
    try {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, description, metadata })
      }).catch(() => {});
    } catch {}
  }
};
