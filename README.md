# Vatsalya Vatika Ashram — Modern Real-Time Web Application & Admin Platform

A peaceful, spiritual, modern, and user-friendly web application created for **Vatsalya Vatika Ashram**, an educational and charitable refuge where 200+ students receive education, accommodation, food, healthcare, clothing, guidance, sports, activities, and essential life values.

---

## 🌟 Tech Stack

### Frontend & Application Architecture
- **Framework**: React.js 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (custom Ashram Cream, Saffron, Emerald Green, Soft Gold & Charcoal Dark palette)
- **Animations**: Framer Motion & custom CSS radial clip-path theme transitions
- **Routing**: React Router DOM v6
- **Icons & Alerts**: Lucide React, React Hot Toast
- **PWA & Offline**: Service Worker, Web Manifest, custom glowing Om app icon

### Real-Time Cloud Infrastructure & Services
- **Database**: Google Firebase Cloud Firestore (instant real-time live synchronization with `onSnapshot` listeners)
- **Authentication**: Firebase Authentication (secure email/password auth with Firebase ID tokens)
- **Media CDN & Storage**: Cloudinary (direct unsigned image & video uploads with real-time progress tracking)
- **Admin Alerts & Serverless**: Vercel Serverless Function (`/api/notify`) with Gmail SMTP integration
- **Deployment**: Vercel Edge Global CDN (zero-cold-start static SPA distribution)

---

## 📁 Project Architecture

```text
vatsalya-vatika/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Responsive UI components (Navbar, Hero, Impact, Facilities, Guruji, Lightbox, etc.)
│   │   ├── context/          # ThemeContext (with clip transition) & AuthContext
│   │   ├── lib/              # Firebase & Cloudinary configuration (firebase.ts)
│   │   ├── pages/            # Public pages & Protected Admin Dashboard
│   │   ├── services/         # Real-time Firestore services (events, gallery, contact, contributions, auth, etc.)
│   │   ├── types/            # TypeScript Interface definitions
│   │   ├── App.tsx           # App Router & Notifications
│   │   └── index.css         # Tailwind base styles & theme transition overlays
│   ├── public/               # Static assets, PWA manifests, icons
│   ├── index.html
│   └── package.json
│
├── api/
│   └── notify.ts             # Vercel Serverless endpoint for instant Gmail notifications
│
├── vercel.json               # Vercel deployment and routing configuration
├── README.md
└── package.json              # Root script runner
```

---

## 🚀 Quick Start Guide

### 1. Installation

From the project root:

```bash
# Install frontend dependencies
cd frontend && npm install
```

---

### 2. Environment Configuration

Create or update `frontend/.env`:

```env
# Firebase Cloud Sync (Free Spark Plan)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# 100% Free Image & Video CDN (Cloudinary)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

For email notifications on Vercel (`.env` in root or Vercel Environment Variables):

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_TO=admin@vatsalyavatika.org
```

---

### 3. Running Locally

```bash
# Start local development server with Vite
npm run dev
# Or directly from frontend/
cd frontend && npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

### 4. Build & Validation

```bash
# Type check and build production bundle
npm run typecheck
npm run build
```
