import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  !firebaseConfig.apiKey.includes('YOUR_')
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);

    // Enable offline persistence in browser environments
    if (typeof window !== 'undefined') {
      try {
        enableIndexedDbPersistence(db).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Firebase persistence: Multiple tabs open, persistence disabled for secondary tab.');
          } else if (err.code === 'unimplemented') {
            console.warn('Firebase persistence: Browser does not support indexedDB persistence.');
          }
        });
      } catch {
        // Safe catch
      }
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.info('ℹ️ Firebase is running in local fallback mode. Add VITE_FIREBASE_* in frontend/.env to enable direct cloud sync.');
}

export const cleanFirestoreData = <T extends Record<string, any>>(data: T): T => {
  const clean: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
};

export { app, db, storage, auth };

/**
 * Uploads an image or video file directly to Firebase Storage with real-time progress.
 * If Firebase is not configured yet (local dev mode), compresses image via canvas or creates ObjectURL for instant dev preview.
 */
export const uploadMediaWithProgress = async (
  file: File,
  folder: string = 'media',
  onProgress?: (progressPercent: number) => void
): Promise<{ url: string; mediaType: 'image' | 'video' }> => {
  const isVideo = file.type.startsWith('video/');
  const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';

  // 1. Direct Cloudinary Upload (Ultra-fast CDN, zero-latency, no Base64 bloat)
  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (cloudName && uploadPreset) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      xhr.open('POST', url, true);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (onProgress) onProgress(100);
            const isVid = data.resource_type === 'video' || isVideo;
            resolve({
              url: data.secure_url,
              mediaType: isVid ? 'video' : 'image'
            });
          } catch (e) {
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error?.message || `Cloudinary upload failed (HTTP ${xhr.status})`));
          } catch {
            reject(new Error(`Cloudinary upload failed (HTTP ${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during media upload to Cloudinary'));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      xhr.send(formData);
    });
  }

  // 2. Direct Firebase Cloud Storage Upload (if configured)
  const storageInstance = storage;
  if (isFirebaseConfigured && storageInstance) {
    return new Promise((resolve, reject) => {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${folder}/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storageInstance, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          reject(new Error(`Firebase Storage upload failed: ${error.message}`));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve({ url: downloadUrl, mediaType });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  throw new Error('Media upload failed: Please ensure Cloudinary credentials (VITE_CLOUDINARY_CLOUD_NAME & VITE_CLOUDINARY_UPLOAD_PRESET) are configured in your environment.');
};

/**
 * Removes a file from Firebase Storage if it's a storage URL
 */
export const deleteMediaFromStorage = async (fileUrl: string): Promise<void> => {
  const storageInstance = storage;
  if (!isFirebaseConfigured || !storageInstance || (!fileUrl.includes('firebasestorage') && !fileUrl.includes('appspot.com'))) {
    return;
  }
  try {
    const fileRef = ref(storageInstance, fileUrl);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('Failed to delete media from storage:', err);
  }
};
