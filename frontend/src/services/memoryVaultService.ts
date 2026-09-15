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
    if (isFirebaseConfigured && db) {
      try {
        const unsubscribe = onSnapshot(
          collection(db, COLLECTION_NAME),
          (snapshot) => {
            if (snapshot.empty) {
              callback(fallbackMemoryVaultCards);
              return;
            }
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
            callback(items);
          },
          (err) => {
            console.warn('Firestore memory vault subscribe error:', err);
            callback(getLocalCards());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Error subscribing to memory vault:', err);
      }
    }

    callback(getLocalCards());
    const handleUpdate = () => callback(getLocalCards());
    window.addEventListener('vatsalya_memory_vault_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_memory_vault_updated', handleUpdate);
  },

  getCards: async (): Promise<MemoryVaultCard[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap, index) => {
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
        }
      } catch (err) {
        console.warn('Failed to load memory vault from Firestore:', err);
      }
    }
    return getLocalCards();
  },

  createCard: async (data: Partial<MemoryVaultCard>): Promise<MemoryVaultCard> => {
    const current = await memoryVaultService.getCards();
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

    if (isFirebaseConfigured && db) {
      const cleanData = cleanFirestoreData({
        ...newCard,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
      return {
        _id: docRef.id,
        ...newCard,
        createdAt: new Date().toISOString()
      } as MemoryVaultCard;
    }

    const created: MemoryVaultCard = {
      _id: `vault-${Date.now()}`,
      ...newCard,
      createdAt: new Date().toISOString()
    } as MemoryVaultCard;
    setLocalCards([...current, created]);
    window.dispatchEvent(new CustomEvent('vatsalya_memory_vault_updated'));
    return created;
  },

  updateCard: async (id: string, data: Partial<MemoryVaultCard>): Promise<MemoryVaultCard> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = { ...data };
      delete updateData._id;
      await updateDoc(docRef, cleanFirestoreData(updateData));
      return { _id: id, ...data } as MemoryVaultCard;
    }

    const current = getLocalCards();
    const updated = current.map((item) => (item._id === id ? { ...item, ...data } : item));
    setLocalCards(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_memory_vault_updated'));
    return { _id: id, ...data } as MemoryVaultCard;
  },

  deleteCard: async (id: string, mediaUrl?: string): Promise<void> => {
    if (mediaUrl) {
      deleteMediaFromStorage(mediaUrl).catch(() => {});
    }

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return;
    }

    const current = getLocalCards();
    const updated = current.filter((item) => item._id !== id);
    setLocalCards(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_memory_vault_updated'));
  }
};
