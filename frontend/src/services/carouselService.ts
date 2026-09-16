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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured, deleteMediaFromStorage, cleanFirestoreData } from '../lib/firebase';
import { CarouselImage } from '../types';
import { fallbackCarouselImages } from './fallbackData';

const COLLECTION_NAME = 'carousel';
const STORAGE_KEY = 'vatsalya_local_carousel';

const getLocalCarousel = (): CarouselImage[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return fallbackCarouselImages;
};

const setLocalCarousel = (items: CarouselImage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const carouselService = {
  subscribeToCarousel: (callback: (items: CarouselImage[]) => void): (() => void) => {
    let unsubsFirestore: (() => void) | null = null;

    const notify = () => {
      callback(getLocalCarousel());
    };

    window.addEventListener('vatsalya_carousel_updated', notify);
    notify();

    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
        unsubsFirestore = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const items: CarouselImage[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                  _id: docSnap.id,
                  image: data.image || '',
                  title: data.title || '',
                  description: data.description || '',
                  category: data.category || '',
                  date: data.date || '',
                  isActive: data.isActive !== undefined ? data.isActive : true,
                  order: data.order !== undefined ? data.order : 0,
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
                };
              });
              setLocalCarousel(items);
              callback(items);
            }
          },
          (err) => {
            console.warn('Firestore carousel notice, using local data:', err.message);
          }
        );
      } catch (err) {
        console.warn('Error subscribing to carousel:', err);
      }
    }

    return () => {
      window.removeEventListener('vatsalya_carousel_updated', notify);
      if (unsubsFirestore) unsubsFirestore();
    };
  },

  getImages: async (): Promise<CarouselImage[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
        const snapshot = await Promise.race([
          getDocs(q),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
        ]);
        if (!snapshot.empty) {
          const items = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              image: data.image || '',
              title: data.title || '',
              description: data.description || '',
              category: data.category || '',
              date: data.date || '',
              isActive: data.isActive !== undefined ? data.isActive : true,
              order: data.order !== undefined ? data.order : 0,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
          setLocalCarousel(items);
          return items;
        }
      } catch (err) {
        console.warn('Failed to fetch carousel from Firestore (using local):', err);
      }
    }
    return getLocalCarousel();
  },

  addImage: async (data: Partial<CarouselImage>): Promise<CarouselImage> => {
    const current = await carouselService.getImages();
    const newImage = {
      image: data.image || '',
      title: data.title || '',
      description: data.description || '',
      category: data.category || '',
      date: data.date || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: data.order !== undefined ? data.order : current.length
    };

    // 1. Save locally first (instant UI update)
    const created: CarouselImage = {
      _id: `carousel-${Date.now()}`,
      ...newImage,
      createdAt: new Date().toISOString()
    };
    setLocalCarousel([...current, created]);
    window.dispatchEvent(new CustomEvent('vatsalya_carousel_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const cleanData = cleanFirestoreData({
          ...newImage,
          createdAt: serverTimestamp()
        });
        const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
        created._id = docRef.id;
      } catch (err: any) {
        console.warn('Firestore addImage notice:', err.message);
      }
    }

    return created;
  },

  updateImage: async (id: string, data: Partial<CarouselImage>): Promise<CarouselImage> => {
    // 1. Update locally first
    const current = getLocalCarousel();
    const updated = current.map((item) => (item._id === id ? { ...item, ...data } : item));
    setLocalCarousel(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_carousel_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: any = { ...data };
        delete updateData._id;
        await updateDoc(docRef, cleanFirestoreData(updateData));
      } catch (err: any) {
        console.warn('Firestore updateImage notice:', err.message);
      }
    }

    return { _id: id, ...data } as CarouselImage;
  },

  deleteImage: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    // 1. Delete locally first
    const current = getLocalCarousel();
    const updated = current.filter((item) => item._id !== id);
    setLocalCarousel(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_carousel_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (err: any) {
        console.warn('Firestore deleteImage notice:', err.message);
      }
    }
  },

  reorderImages: async (orderedIds: string[]): Promise<CarouselImage[]> => {
    const current = await carouselService.getImages();
    const reordered = orderedIds
      .map((id, index) => {
        const item = current.find((c) => c._id === id);
        return item ? { ...item, order: index } : null;
      })
      .filter(Boolean) as CarouselImage[];

    // 1. Update locally first
    setLocalCarousel(reordered);
    window.dispatchEvent(new CustomEvent('vatsalya_carousel_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        reordered.forEach((item) => {
          const docRef = doc(db, COLLECTION_NAME, item._id);
          batch.update(docRef, { order: item.order });
        });
        await batch.commit();
      } catch (err: any) {
        console.warn('Firestore reorder notice:', err.message);
      }
    }

    return reordered;
  }
};
