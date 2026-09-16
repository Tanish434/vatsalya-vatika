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
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              callback(fallbackCarouselImages);
              return;
            }
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
            callback(items);
          },
          (err) => {
            console.warn('Firestore carousel subscribe error:', err);
            callback(getLocalCarousel());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Error subscribing to carousel:', err);
      }
    }

    callback(getLocalCarousel());
    const handleUpdate = () => callback(getLocalCarousel());
    window.addEventListener('vatsalya_carousel_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_carousel_updated', handleUpdate);
  },

  getImages: async (): Promise<CarouselImage[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => {
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
        }
      } catch (err) {
        console.warn('Failed to fetch carousel from Firestore:', err);
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

    if (isFirebaseConfigured && db) {
      const cleanData = cleanFirestoreData({
        ...newImage,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
      return {
        _id: docRef.id,
        ...newImage,
        createdAt: new Date().toISOString()
      } as CarouselImage;
    }

    const created: CarouselImage = {
      _id: `carousel-${Date.now()}`,
      ...newImage,
      createdAt: new Date().toISOString()
    };
    setLocalCarousel([...current, created]);
    window.dispatchEvent(new CustomEvent('vatsalya_carousel_updated'));
    return created;
  },

  updateImage: async (id: string, data: Partial<CarouselImage>): Promise<CarouselImage> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = { ...data };
      delete updateData._id;
      await updateDoc(docRef, cleanFirestoreData(updateData));
      return { _id: id, ...data } as CarouselImage;
    }

    const current = getLocalCarousel();
    const updated = current.map((item) => (item._id === id ? { ...item, ...data } : item));
    setLocalCarousel(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_carousel_updated'));
    return { _id: id, ...data } as CarouselImage;
  },

  deleteImage: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return;
    }

    const current = getLocalCarousel();
    const updated = current.filter((item) => item._id !== id);
    setLocalCarousel(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_carousel_updated'));
  },

  reorderImages: async (orderedIds: string[]): Promise<CarouselImage[]> => {
    const current = await carouselService.getImages();
    const reordered = orderedIds
      .map((id, index) => {
        const item = current.find((c) => c._id === id);
        return item ? { ...item, order: index } : null;
      })
      .filter(Boolean) as CarouselImage[];

    if (isFirebaseConfigured && db) {
      const batch = writeBatch(db);
      reordered.forEach((item) => {
        const docRef = doc(db, COLLECTION_NAME, item._id);
        batch.update(docRef, { order: item.order });
      });
      await batch.commit();
      return reordered;
    }

    setLocalCarousel(reordered);
    window.dispatchEvent(new CustomEvent('vatsalya_carousel_updated'));
    return reordered;
  }
};
