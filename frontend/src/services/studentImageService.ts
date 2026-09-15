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
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              callback(fallbackStudentImages);
              return;
            }
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
            callback(items);
          },
          (err) => {
            console.warn('Firestore student images subscribe error:', err);
            callback(getLocalStudentImages());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Error subscribing to student images:', err);
      }
    }

    callback(getLocalStudentImages());
    const handleUpdate = () => callback(getLocalStudentImages());
    window.addEventListener('vatsalya_student_images_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_student_images_updated', handleUpdate);
  },

  getAll: async (): Promise<StudentImage[]> => {
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
              image: data.image || '',
              description: data.description || '',
              focalPoint: data.focalPoint || { x: 50, y: 50 },
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
        }
      } catch (err) {
        console.warn('Failed to fetch student images from Firestore:', err);
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
      } as StudentImage;
    }

    const current = getLocalStudentImages();
    const created: StudentImage = {
      _id: `student-${Date.now()}`,
      ...newItem,
      createdAt: new Date().toISOString()
    };
    setLocalStudentImages([created, ...current]);
    window.dispatchEvent(new CustomEvent('vatsalya_student_images_updated'));
    return created;
  },

  update: async (id: string, data: Partial<StudentImage>): Promise<StudentImage> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = { ...data };
      delete updateData._id;
      await updateDoc(docRef, cleanFirestoreData(updateData));
      return { _id: id, ...data } as StudentImage;
    }

    const current = getLocalStudentImages();
    const updated = current.map((item) => (item._id === id ? { ...item, ...data } : item));
    setLocalStudentImages(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_student_images_updated'));
    return { _id: id, ...data } as StudentImage;
  },

  remove: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return;
    }

    const current = getLocalStudentImages();
    const updated = current.filter((item) => item._id !== id);
    setLocalStudentImages(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_student_images_updated'));
  }
};
