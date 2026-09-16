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
import { StudentImage } from '../types';
import { fallbackStudentImages } from './fallbackData';

const COLLECTION_NAME = 'student_images';
const STORAGE_KEY = 'vatsalya_local_student_images';

const getLocalStudentImages = (): StudentImage[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return fallbackStudentImages;
};

const setLocalStudentImages = (items: StudentImage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const studentImageService = {
  subscribeToStudentImages: (callback: (items: StudentImage[]) => void): (() => void) => {
    let unsubsFirestore: (() => void) | null = null;

    const notify = () => {
      callback(getLocalStudentImages());
    };

    window.addEventListener('vatsalya_student_images_updated', notify);
    notify();

    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        unsubsFirestore = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const items: StudentImage[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                  _id: docSnap.id,
                  title: data.title || '',
                  image: data.image || '',
                  description: data.description || '',
                  focalPoint: data.focalPoint || { x: 50, y: 50 },
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
                };
              });
              setLocalStudentImages(items);
              callback(items);
            }
          },
          (err) => {
            console.warn('Firestore student images notice, using local data:', err.message);
          }
        );
      } catch (err) {
        console.warn('Error subscribing to student images:', err);
      }
    }

    return () => {
      window.removeEventListener('vatsalya_student_images_updated', notify);
      if (unsubsFirestore) unsubsFirestore();
    };
  },

  getAll: async (): Promise<StudentImage[]> => {
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
              image: data.image || '',
              description: data.description || '',
              focalPoint: data.focalPoint || { x: 50, y: 50 },
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
          setLocalStudentImages(items);
          return items;
        }
      } catch (err) {
        console.warn('Failed to fetch student images from Firestore (using local):', err);
      }
    }
    return getLocalStudentImages();
  },

  create: async (data: { title: string; image: string; description: string; focalPoint?: { x: number; y: number } }): Promise<StudentImage> => {
    const newItem = {
      title: data.title,
      image: data.image,
      description: data.description,
      focalPoint: data.focalPoint || { x: 50, y: 50 }
    };

    // 1. Save locally first (instant UI update)
    const current = getLocalStudentImages();
    const created: StudentImage = {
      _id: `student-${Date.now()}`,
      ...newItem,
      createdAt: new Date().toISOString()
    };
    setLocalStudentImages([created, ...current]);
    window.dispatchEvent(new CustomEvent('vatsalya_student_images_updated'));

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
        console.warn('Firestore student image create notice:', err.message);
      }
    }

    return created;
  },

  update: async (id: string, data: Partial<StudentImage>): Promise<StudentImage> => {
    // 1. Update locally first
    const current = getLocalStudentImages();
    const updated = current.map((item) => (item._id === id ? { ...item, ...data } : item));
    setLocalStudentImages(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_student_images_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: any = { ...data };
        delete updateData._id;
        await updateDoc(docRef, cleanFirestoreData(updateData));
      } catch (err: any) {
        console.warn('Firestore student image update notice:', err.message);
      }
    }

    return { _id: id, ...data } as StudentImage;
  },

  remove: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    // 1. Delete locally first
    const current = getLocalStudentImages();
    const updated = current.filter((item) => item._id !== id);
    setLocalStudentImages(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_student_images_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (err: any) {
        console.warn('Firestore student image delete notice:', err.message);
      }
    }
  }
};
