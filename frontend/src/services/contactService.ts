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
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
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
            callback(items);
          },
          (err) => {
            console.warn('Firestore contacts subscription error:', err);
            callback(getLocalContacts());
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Error subscribing to contacts:', err);
      }
    }

    callback(getLocalContacts());
    const handleUpdate = () => callback(getLocalContacts());
    window.addEventListener('vatsalya_contacts_updated', handleUpdate);
    return () => window.removeEventListener('vatsalya_contacts_updated', handleUpdate);
  },

  submitContact: async (data: { name: string; email: string; phone?: string; message: string }): Promise<ApiResponse<ContactMessage>> => {
    const newMsg: Partial<ContactMessage> = {
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      message: data.message,
      status: 'new'
    };

    if (isFirebaseConfigured && db) {
      const cleanData = cleanFirestoreData({
        ...newMsg,
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
      
      activityService.logActivity(
        'contact',
        '📬 New Contact Inquiry',
        `${data.name} sent a message: "${data.message.slice(0, 70)}${data.message.length > 70 ? '...' : ''}"`,
        { name: data.name, email: data.email, phone: data.phone || '' }
      ).catch(() => {});

      return {
        success: true,
        message: 'Thank you! Your message has been sent successfully.',
        data: {
          _id: docRef.id,
          ...newMsg,
          createdAt: new Date().toISOString()
        } as ContactMessage
      };
    }

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
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => {
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
        }
      } catch (err) {
        console.warn('Failed to load contacts from Firestore:', err);
      }
    }
    return getLocalContacts();
  },

  updateStatus: async (id: string, status: 'new' | 'read' | 'replied'): Promise<ContactMessage> => {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { status });
      const current = await contactService.getContacts();
      return current.find((c) => c._id === id) || ({ _id: id, status } as any);
    }

    const current = getLocalContacts();
    const updated = current.map((c) => (c._id === id ? { ...c, status } : c));
    setLocalContacts(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_contacts_updated'));
    return updated.find((c) => c._id === id)!;
  },

  deleteContact: async (id: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return;
    }

    const current = getLocalContacts();
    const updated = current.filter((c) => c._id !== id);
    setLocalContacts(updated);
    window.dispatchEvent(new CustomEvent('vatsalya_contacts_updated'));
  }
};
