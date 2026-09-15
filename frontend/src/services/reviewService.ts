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
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured, cleanFirestoreData } from '../lib/firebase';
import { ReviewItem } from '../types';
import { activityService } from './activityService';
import { fallbackReviews } from './fallbackData';

const COLLECTION_NAME = 'reviews';
const STORAGE_KEY = 'vatsalya_local_reviews';

const getLocalReviews = (): ReviewItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return fallbackReviews;
};

const setLocalReviews = (items: ReviewItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const reviewService = {
  subscribeToPublicReviews: (callback: (items: ReviewItem[]) => void): (() => void) => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('approved', '==', true),
          orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              callback(fallbackReviews.filter((r) => r.approved));
              return;
            }
            const items: ReviewItem[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                _id: docSnap.id,
                name: data.name || '',
                email: data.email || '',
                rating: Number(data.rating) || 5,
                comment: data.comment || '',
                approved: Boolean(data.approved),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
              };
            });
            callback(items);
          },
          (err) => {
            console.warn('Firestore public reviews subscribe error:', err);
            callback(getLocalReviews().filter((r) => r.approved));
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Error subscribing to reviews:', err);
      }
    }

    callback(getLocalReviews().filter((r) => r.approved));
    const handleUpdate = () => callback(getLocalReviews().filter((r) => r.approved));
    window.addEventListener('vatsalya_reviews_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_reviews_updated', handleUpdate);
  },

  subscribeToAllReviews: (callback: (items: ReviewItem[]) => void): (() => void) => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              callback(fallbackReviews);
              return;
            }
            const items: ReviewItem[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                _id: docSnap.id,
                name: data.name || '',
                email: data.email || '',
                rating: Number(data.rating) || 5,
                comment: data.comment || '',
                approved: Boolean(data.approved),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
              };
            });
            callback(items);
          },
          (err) => {
            console.warn('Firestore all reviews subscribe error:', err);
            callback(getLocalReviews());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Error subscribing to all reviews:', err);
      }
    }

    callback(getLocalReviews());
    const handleUpdate = () => callback(getLocalReviews());
    window.addEventListener('vatsalya_reviews_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_reviews_updated', handleUpdate);
  },

  getPublicReviews: async (): Promise<ReviewItem[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), where('approved', '==', true), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              name: data.name || '',
              email: data.email || '',
              rating: Number(data.rating) || 5,
              comment: data.comment || '',
              approved: Boolean(data.approved),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
        }
      } catch (err) {
        console.warn('Failed to load public reviews from Firestore:', err);
      }
    }
    return getLocalReviews().filter((r) => r.approved);
  },

  getAllReviews: async (): Promise<ReviewItem[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              name: data.name || '',
              email: data.email || '',
              rating: Number(data.rating) || 5,
              comment: data.comment || '',
              approved: Boolean(data.approved),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
        }
      } catch (err) {
        console.warn('Failed to load all reviews from Firestore:', err);
      }
    }
    return getLocalReviews();
  },

  submitReview: async (data: { name: string; email?: string; rating: number; comment: string }): Promise<ReviewItem> => {
    const newReview = {
      name: data.name,
      email: data.email || '',
      rating: data.rating,
      comment: data.comment,
      approved: false
    };

    if (isFirebaseConfigured && db) {
      const cleanData = cleanFirestoreData({
        ...newReview,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);

      activityService.logActivity(
        'review',
        '⭐ New Visitor Review',
        `${data.name} submitted a ${data.rating}-star review: "${data.comment.slice(0, 60)}${data.comment.length > 60 ? '...' : ''}"`,
        { name: data.name, rating: data.rating }
      ).catch(() => {});

      return {
        _id: docRef.id,
        ...newReview,
        createdAt: new Date().toISOString()
      } as ReviewItem;
    }

    const current = getLocalReviews();
    const created: ReviewItem = {
      _id: `rev-${Date.now()}`,
      ...newReview,
      createdAt: new Date().toISOString()
    };
    setLocalReviews([created, ...current]);
    window.dispatchEvent(new CustomEvent('vatsalya_reviews_updated'));

    activityService.logActivity(
      'review',
      '⭐ New Visitor Review',
      `${data.name} submitted a ${data.rating}-star review: "${data.comment.slice(0, 60)}${data.comment.length > 60 ? '...' : ''}"`,
      { name: data.name, rating: data.rating }
    ).catch(() => {});
    return created;
  },

  toggleApproval: async (id: string): Promise<ReviewItem> => {
    const all = await reviewService.getAllReviews();
    const target = all.find((r) => r._id === id);
    const newStatus = target ? !target.approved : true;

    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { approved: newStatus });
      return { ...(target || { _id: id }), approved: newStatus } as ReviewItem;
    }

    const current = getLocalReviews();
    const updated = current.map((r) => (r._id === id ? { ...r, approved: newStatus } : r));
    setLocalReviews(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_reviews_updated'));
    return updated.find((r) => r._id === id)!;
  },

  deleteReview: async (id: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return;
    }

    const current = getLocalReviews();
    const updated = current.filter((r) => r._id !== id);
    setLocalReviews(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_reviews_updated'));
  }
};
