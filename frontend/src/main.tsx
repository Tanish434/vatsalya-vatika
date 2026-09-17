import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Clean up legacy mock dummy items from localStorage if present
try {
  const legacyKeys = [
    'vatsalya_local_gallery',
    'vatsalya_local_student_images',
    'vatsalya_local_events',
    'vatsalya_local_carousel',
    'vatsalya_local_reviews',
    'vatsalya_local_memoryvault'
  ];
  legacyKeys.forEach((key) => {
    const data = localStorage.getItem(key);
    if (data && (data.includes('gal-1') || data.includes('evt-1') || data.includes('default-1') || data.includes('car-1') || data.includes('mv-seed-1'))) {
      localStorage.removeItem(key);
    }
  });
} catch {}

// Register PWA service worker for Chrome Install / Add to Home Screen support
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
