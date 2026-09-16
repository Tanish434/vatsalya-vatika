import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured, deleteMediaFromStorage, cleanFirestoreData } from '../lib/firebase';
import { MemoryVaultCard } from '../types';
import { fallbackMemoryVaultCards } from './fallbackData';

const COLLECTION_NAME = 'memory_vault';
const STORAGE_KEY = 'vatsalya_local_memory_vault';

const getLocalCards = (): MemoryVaultCard[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return fallbackMemoryVaultCards;
};

const setLocalCards = (items: MemoryVaultCard[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const memoryVaultService = {
  subscribeToCards: (callback: (cards: MemoryVaultCard[]) => void): (() => void) => {
    let unsubsFirestore: (() => void) | null = null;

    const notify = () => {
      callback(getLocalCards());
    };

    window.addEventListener('vatsalya_memory_vault_updated', notify);
    notify();

    if (isFirebaseConfigured && db) {
      try {
        unsubsFirestore = onSnapshot(
          collection(db, COLLECTION_NAME),
          (snapshot) => {
            if (!snapshot.empty) {
              const items: MemoryVaultCard[] = snapshot.docs.map((docSnap, index) => {
                const data = docSnap.data();
                return {
                  _id: docSnap.id,
                  title: data.title || '',
                  image: data.image || '',
                  description: data.description || '',
                  category: data.category || 'Memories',
                  cardNumber: data.cardNumber !== undefined ? data.cardNumber : index + 1,
                  rotation: data.rotation !== undefined ? data.rotation : 0,
                  offsetX: data.offsetX !== undefined ? data.offsetX : 0,
                  offsetY: data.offsetY !== undefined ? data.offsetY : 0,
                  focalPoint: data.focalPoint || { x: 50, y: 50 },
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
                };
              });
              setLocalCards(items);
              callback(items);
            }
          },
          (err) => {
            console.warn('Firestore memory vault notice, using local data:', err.message);
          }
        );
      } catch (err) {
        console.warn('Error subscribing to memory vault:', err);
      }
    }

    return () => {
      window.removeEventListener('vatsalya_memory_vault_updated', notify);
      if (unsubsFirestore) unsubsFirestore();
    };
  },

  getCards: async (): Promise<MemoryVaultCard[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await Promise.race([
          getDocs(collection(db, COLLECTION_NAME)),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
        ]);
        if (!snapshot.empty) {
          const items = snapshot.docs.map((docSnap, index) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              title: data.title || '',
              image: data.image || '',
              description: data.description || '',
              category: data.category || 'Memories',
              cardNumber: data.cardNumber !== undefined ? data.cardNumber : index + 1,
              rotation: data.rotation !== undefined ? data.rotation : 0,
              offsetX: data.offsetX !== undefined ? data.offsetX : 0,
              offsetY: data.offsetY !== undefined ? data.offsetY : 0,
              focalPoint: data.focalPoint || { x: 50, y: 50 },
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
          setLocalCards(items);
          return items;
        }
      } catch (err) {
        console.warn('Failed to load memory vault from Firestore (using local):', err);
      }
    }
    return getLocalCards();
  },

  createCard: async (data: Partial<MemoryVaultCard>): Promise<MemoryVaultCard> => {
    const current = getLocalCards();
    const newCard = {
      title: data.title || 'Memory Card',
      image: data.image || '',
      description: data.description || '',
      category: data.category || 'Memories',
      cardNumber: current.length + 1,
      rotation: Math.floor(Math.random() * 8) - 4,
      offsetX: 0,
      offsetY: 0,
      focalPoint: data.focalPoint || { x: 50, y: 50 }
    };

    // 1. Save locally first (instant UI update)
    const created: MemoryVaultCard = {
      _id: `vault-${Date.now()}`,
      ...newCard,
      createdAt: new Date().toISOString()
    } as MemoryVaultCard;
    setLocalCards([...current, created]);
    window.dispatchEvent(new CustomEvent('vatsalya_memory_vault_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const cleanData = cleanFirestoreData({
          ...newCard,
          createdAt: serverTimestamp()
        });
        const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
        created._id = docRef.id;
      } catch (err: any) {
        console.warn('Firestore createCard notice:', err.message);
      }
    }

    return created;
  },

  updateCard: async (id: string, data: Partial<MemoryVaultCard>): Promise<MemoryVaultCard> => {
    // 1. Update locally first
    const current = getLocalCards();
    const updated = current.map((item) => (item._id === id ? { ...item, ...data } : item));
    setLocalCards(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_memory_vault_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: any = { ...data };
        delete updateData._id;
        await updateDoc(docRef, cleanFirestoreData(updateData));
      } catch (err: any) {
        console.warn('Firestore updateCard notice:', err.message);
      }
    }

    return { _id: id, ...data } as MemoryVaultCard;
  },

  deleteCard: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    // 1. Delete locally first
    const current = getLocalCards();
    const updated = current.filter((item) => item._id !== id);
    setLocalCards(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_memory_vault_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (err: any) {
        console.warn('Firestore deleteCard notice:', err.message);
      }
    }
  }
};
