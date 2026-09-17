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

const COLLECTION_NAME = 'gallery';
const STORAGE_KEY = 'vatsalya_local_gallery';

// Local cache for fast rendering
export const getLocalFallbackGallery = (): GalleryItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
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
      const cached = getLocalFallbackGallery();
      if (cached.length > 0) {
        callback(cached);
      }
    };

    // 1. If we have cached items from a previous session, show them immediately
    notify();
    window.addEventListener('vatsalya_gallery_updated', notify);

    // 2. Connect to Firestore live stream with chronological ordering (oldest at top, newest at bottom)
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'asc'));
        unsubsFirestore = onSnapshot(
          q,
          (snapshot) => {
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

            // Persist remote items and update callback
            setLocalFallbackGallery(remoteItems);
            callback(remoteItems);
          },
          (err) => {
            console.warn('Firestore gallery snapshot notice, serving cached data:', err.message);
            callback(getLocalFallbackGallery());
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
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
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
      } catch (err) {
        console.warn('Using local persistent gallery store:', err);
      }
    }
    return getLocalFallbackGallery();
  },

  createGalleryItem: async (data: Partial<GalleryItem>): Promise<GalleryItem> => {
    const isVideo = data.mediaType === 'video' || data.image?.includes('video/') || data.image?.endsWith('.mp4');
    const newItem: Partial<GalleryItem> = {
      title: data.title || '',
      image: data.image || '',
      mediaType: isVideo ? 'video' : 'image',
      category: data.category || 'Ashram',
      description: data.description || '',
      focalPoint: data.focalPoint || { x: 50, y: 50 }
    };
    if (isVideo && (data.videoUrl || data.image)) {
      newItem.videoUrl = data.videoUrl || data.image;
    }

    // 1. Immediately create & append to bottom locally so user sees it in 0ms (chronological order)
    const current = getLocalFallbackGallery();
    const created: GalleryItem = {
      _id: `gal-${Date.now()}`,
      ...newItem,
      createdAt: new Date().toISOString()
    } as GalleryItem;
    const updated = [...current, created];
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
