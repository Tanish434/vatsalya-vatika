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
import { db, isFirebaseConfigured, cleanFirestoreData } from '../lib/firebase';
import { ContactMessage, ApiResponse } from '../types';
import { activityService } from './activityService';

const COLLECTION_NAME = 'contacts';
const STORAGE_KEY = 'vatsalya_local_contacts';

const getLocalContacts = (): ContactMessage[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const setLocalContacts = (items: ContactMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const contactService = {
  subscribeToContacts: (callback: (items: ContactMessage[]) => void): (() => void) => {
    let unsubsFirestore: (() => void) | null = null;

    const notify = () => {
      callback(getLocalContacts());
    };

    window.addEventListener('vatsalya_contacts_updated', notify);
    notify();

    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        unsubsFirestore = onSnapshot(
          q,
          (snapshot) => {
            const items: ContactMessage[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                _id: docSnap.id,
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                message: data.message || '',
                status: data.status || 'new',
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
              };
            });
            setLocalContacts(items);
            callback(items);
          },
          (err) => {
            console.warn('Firestore contacts notice, using local data:', err.message);
          }
        );
      } catch (err) {
        console.warn('Error creating contacts subscription:', err);
      }
    }

    return () => {
      window.removeEventListener('vatsalya_contacts_updated', notify);
      if (unsubsFirestore) unsubsFirestore();
    };
  },

  submitContact: async (data: { name: string; email: string; phone?: string; message: string }): Promise<ApiResponse<ContactMessage>> => {
    return contactService.submitContactForm(data);
  },

  submitContactForm: async (data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }): Promise<ApiResponse<ContactMessage>> => {
    const newMsg: Partial<ContactMessage> = {
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      message: data.message,
      status: 'new'
    };

    // 1. Save locally first (instant UI update)
    const current = getLocalContacts();
    const created: ContactMessage = {
      _id: `contact-${Date.now()}`,
      ...newMsg,
      createdAt: new Date().toISOString()
    } as ContactMessage;
    setLocalContacts([created, ...current]);
    window.dispatchEvent(new CustomEvent('vatsalya_contacts_updated'));

    activityService.logActivity(
      'contact',
      '📬 New Contact Inquiry',
      `${data.name} sent a message: "${data.message.slice(0, 70)}${data.message.length > 70 ? '...' : ''}"`,
      { name: data.name, email: data.email, phone: data.phone || '' }
    ).catch(() => {});

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const cleanData = cleanFirestoreData({
          ...newMsg,
          createdAt: serverTimestamp()
        });
        const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
        created._id = docRef.id;
      } catch (err: any) {
        console.warn('Firestore contact submit notice:', err.message);
      }
    }

    return {
      success: true,
      message: 'Thank you! Your message has been sent successfully.',
      data: created
    };
  },

  getContacts: async (): Promise<ContactMessage[]> => {
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
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              message: data.message || '',
              status: data.status || 'new',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
            };
          });
          setLocalContacts(items);
          return items;
        }
      } catch (err) {
        console.warn('Failed to load contacts from Firestore (using local):', err);
      }
    }
    return getLocalContacts();
  },

  updateStatus: async (id: string, status: 'new' | 'read' | 'replied'): Promise<ContactMessage> => {
    // 1. Update locally first
    const current = getLocalContacts();
    const updated = current.map((c) => (c._id === id ? { ...c, status } : c));
    setLocalContacts(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_contacts_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { status });
      } catch (err: any) {
        console.warn('Firestore contact status update notice:', err.message);
      }
    }

    return updated.find((c) => c._id === id) || ({ _id: id, status } as any);
  },

  deleteContact: async (id: string): Promise<void> => {
    // 1. Delete locally first
    const current = getLocalContacts();
    const updated = current.filter((c) => c._id !== id);
    setLocalContacts(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_contacts_updated'));

    // 2. Background sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (err: any) {
        console.warn('Firestore contact delete notice:', err.message);
      }
    }
  }
};
