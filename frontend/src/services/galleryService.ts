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
import { GalleryItem } from '../types';
import { fallbackGallery } from './fallbackData';

const COLLECTION_NAME = 'gallery';
const STORAGE_KEY = 'vatsalya_local_gallery';

// Local persistent cache
export const getLocalFallbackGallery = (): GalleryItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return fallbackGallery;
};

export const setLocalFallbackGallery = (items: GalleryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const galleryService = {
  subscribeToGallery: (callback: (items: GalleryItem[]) => void): (() => void) => {
    let unsubsFirestore: (() => void) | null = null;

    const notify = () => {
      callback(getLocalFallbackGallery());
    };

    // 1. Listen to instant local updates
    window.addEventListener('vatsalya_gallery_updated', notify);
    notify();

    // 2. Connect to Firestore live stream if active
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        unsubsFirestore = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const remoteItems: GalleryItem[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                  _id: docSnap.id,
                  title: data.title || '',
                  image: data.image || '',
                  mediaType: data.mediaType || (data.image?.endsWith('.mp4') || data.image?.includes('video') ? 'video' : 'image'),
                  videoUrl: data.videoUrl || (data.mediaType === 'video' ? data.image : undefined),
                  category: data.category || 'Ashram',
                  description: data.description || '',
                  focalPoint: data.focalPoint || { x: 50, y: 50 },
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
                };
              });

              // Merge local items with remote items to prevent data loss
              const localItems = getLocalFallbackGallery();
              const mergedMap = new Map<string, GalleryItem>();
              remoteItems.forEach((i) => mergedMap.set(i._id, i));
              localItems.forEach((i) => {
                if (!mergedMap.has(i._id)) mergedMap.set(i._id, i);
              });
              const combined = Array.from(mergedMap.values());
              setLocalFallbackGallery(combined);
              callback(combined);
            }
          },
          (err) => {
            console.warn('Firestore gallery snapshot notice, serving local data:', err.message);
          }
        );
      } catch (e) {
        console.warn('Error creating gallery Firestore stream:', e);
      }
    }

    return () => {
      window.removeEventListener('vatsalya_gallery_updated', notify);
      if (unsubsFirestore) unsubsFirestore();
    };
  },

  getGallery: async (): Promise<GalleryItem[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const remote = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              title: data.title || '',
              image: data.image || '',
              mediaType: data.mediaType || 'image',
              videoUrl: data.videoUrl,
              category: data.category || 'Ashram',
              description: data.description || '',
              focalPoint: data.focalPoint || { x: 50, y: 50 },
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
          setLocalFallbackGallery(remote);
          return remote;
        }
      } catch (err) {
        console.warn('Using local persistent gallery store:', err);
      }
    }
    return getLocalFallbackGallery();
  },

  createGalleryItem: async (data: Partial<GalleryItem>): Promise<GalleryItem> => {
    const isVideo = data.mediaType === 'video' || data.image?.includes('video/') || data.image?.endsWith('.mp4');
    const newItem: Partial<GalleryItem> = {
      title: data.title || 'Untitled',
      image: data.image || '',
      mediaType: isVideo ? 'video' : 'image',
      category: data.category || 'Ashram',
      description: data.description || '',
      focalPoint: data.focalPoint || { x: 50, y: 50 }
    };
    if (isVideo && (data.videoUrl || data.image)) {
      newItem.videoUrl = data.videoUrl || data.image;
    }

    // 1. Immediately create & save locally so user sees it in 0ms
    const current = getLocalFallbackGallery();
    const created: GalleryItem = {
      _id: `gal-${Date.now()}`,
      ...newItem,
      createdAt: new Date().toISOString()
    } as GalleryItem;
    const updated = [created, ...current];
    setLocalFallbackGallery(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_gallery_updated'));

    // 2. Sync to Firestore in background
    if (isFirebaseConfigured && db) {
      try {
        const cleanData = cleanFirestoreData({
          ...newItem,
          createdAt: serverTimestamp()
        });
        const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
        created._id = docRef.id;
      } catch (err: any) {
        console.warn('Firestore sync notice (data is safely persisted locally):', err.message);
      }
    }

    return created;
  },

  updateGalleryItem: async (id: string, data: Partial<GalleryItem>): Promise<GalleryItem> => {
    const current = getLocalFallbackGallery();
    const updated = current.map((item) => (item._id === id ? { ...item, ...data } : item));
    setLocalFallbackGallery(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_gallery_updated'));

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updatePayload: any = { ...data };
        delete updatePayload._id;
        await updateDoc(docRef, cleanFirestoreData(updatePayload));
      } catch (err) {
        console.warn('Firestore update notice:', err);
      }
    }

    return { _id: id, ...data } as GalleryItem;
  },

  deleteGalleryItem: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    const current = getLocalFallbackGallery();
    const updated = current.filter((item) => item._id !== id);
    setLocalFallbackGallery(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_gallery_updated'));

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (err) {
        console.warn('Firestore delete notice:', err);
      }
    }
  }
};
