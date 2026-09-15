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
  appId: env.VITE_FIREBASE_APP_ID || ''
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

  // 1. Cloudinary Direct Upload (100% Free Forever, No Credit Card Needed)
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
            reject(e);
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error?.message || 'Cloudinary upload failed'));
          } catch {
            reject(new Error('Cloudinary upload failed'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during media upload'));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      xhr.send(formData);
    });
  }

  // 2. Direct Firebase Cloud Storage Upload (If Blaze / Storage bucket is active)
  if (isFirebaseConfigured && storage) {
    try {
      return await new Promise((resolve, reject) => {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${folder}/${Date.now()}_${sanitizedName}`;
        const storageRef = ref(storage, storagePath);

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
            console.warn('Firebase Storage upload notice (falling back):', error.message);
            reject(error);
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
    } catch {
      // Gracefully continue to fallback
    }
  }

  // 2. Local Fallback Mode for immediate development
  if (onProgress) {
    onProgress(30);
    setTimeout(() => onProgress?.(80), 100);
  }

  if (isVideo) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (onProgress) onProgress(100);
        resolve({ url: reader.result as string, mediaType: 'video' });
      };
      reader.readAsDataURL(file);
    });
  }

  // Optimize image via Canvas in fallback mode
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1400;
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (onProgress) onProgress(100);
          resolve({ url: e.target?.result as string, mediaType: 'image' });
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        if (onProgress) onProgress(100);
        resolve({ url: compressed, mediaType: 'image' });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Removes a file from Firebase Storage if it's a storage URL
 */
export const deleteMediaFromStorage = async (fileUrl: string): Promise<void> => {
  if (!isFirebaseConfigured || !storage || (!fileUrl.includes('firebasestorage') && !fileUrl.includes('appspot.com'))) {
    return;
  }
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('Failed to delete media from storage:', err);
  }
};
