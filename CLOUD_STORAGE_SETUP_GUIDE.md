# ☁️ Cloud Media Storage Setup & Handoff Guide
### Free Image & Video CDN Integration for Vatsalya Vatika

---

## 📌 Overview

This project uses **direct client-to-cloud upload** with global CDN caching.
* **Cost:** 100% Free Forever (Free Tier includes 25 GB storage & monthly bandwidth).
* **Credit Card Required:** **NO** (Zero payment details needed).
* **Supported Media:** Photos (`.png`, `.jpg`, `.jpeg`, `.webp`) and Videos (`.mp4`, `.webm`).
* **Real-time Sync:** All uploaded media appears across the live public website and admin dashboard instantly without page refreshes.

> **Note on Provider:**  
> The media engine is powered by **Cloudinary**. While services like Cloudflare R2 / Stream require entering a credit card on file, Cloudinary provides a truly free tier with no credit card required and supports direct browser uploads via **Unsigned Presets**.

---

## 🚀 3-Minute Account Setup (Step-by-Step)

Follow these exact steps to create your storage bucket and obtain your two keys:

### Step 1: Create a Free Account
1. Open [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free).
2. Enter your Name, Email, and Password (or sign up with Google/GitHub).
3. Select any standard options (e.g., "Developer", "Web & Mobile").
4. **No credit card or payment information is requested.**
5. Confirm your email address if prompted.

---

### Step 2: Get Your "Cloud Name"
1. Once logged into the [Cloudinary Console](https://console.cloudinary.com/), look at the top left of the Dashboard.
2. You will see your **Cloud Name** (for example: `dx8y9abcd` or whatever custom name you chose).
3. Copy this value. This is your `VITE_CLOUDINARY_CLOUD_NAME`.

---

### Step 3: Create an "Unsigned" Upload Preset
Direct frontend uploads from the browser require an **Unsigned Preset**. This allows the admin panel to upload images and videos without exposing private API secrets.

1. Click the **Settings (Gear icon ⚙️)** in the bottom-left sidebar of Cloudinary.
2. Under "Account", select the **Upload** settings tab.
3. Scroll down to the **Upload presets** section.
4. Click **Add upload preset**.
5. Configure the following:
   - **Upload preset name**: You can leave the random generated name (e.g., `ml_default` or `ak8h6kk8`) or type a custom name like `vatsalya_preset`.
   - **Signing Mode**: Click the dropdown and change it from **Signed** to **Unsigned** *(CRITICAL: uploads will fail if left as Signed)*.
   - **Folder** (Optional): Set to `vatsalya_media`.
6. Click the orange **Save** button in the top-right corner.
7. Copy the **Upload preset name**. This is your `VITE_CLOUDINARY_UPLOAD_PRESET`.

---

## 🔑 Where to Put Your Credentials

### 1. For Local Development:
Open the file [frontend/.env](file:///d:/hope/temp/frontend/.env) and replace the values on lines 10 and 11:

```env
# 100% Free Image & Video CDN (No Credit Card Required)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name_here
```

### 2. For Live Hosting (Vercel / Netlify / Production):
If hosting on **Vercel**:
1. Go to your project dashboard on Vercel.
2. Navigate to **Settings** → **Environment Variables**.
3. Add:
   - `VITE_CLOUDINARY_CLOUD_NAME` = *(your cloud name)*
   - `VITE_CLOUDINARY_UPLOAD_PRESET` = *(your upload preset)*
4. Click **Save** and trigger a Redeploy.

---

## 🔍 Comprehensive Upload Verification Checklist

The application has been audited and configured to support direct cloud uploads across every section:

| Feature / Location | Supported File Types | Fallback Option | Real-Time Sync Effect |
| :--- | :--- | :--- | :--- |
| **Gallery Page** | Images (`.jpg`, `.png`, `.webp`) & Videos (`.mp4`, `.webm`) | Direct URL paste | Displays immediately in Lightbox & Video Player |
| **Upcoming Events** | Images (`.jpg`, `.png`, `.webp`) | Direct URL paste | Displays immediately with custom focal point & calendar chip |
| **Memory Vault** | Images (`.jpg`, `.png`, `.webp`) | Direct URL paste | Live 3D interactive memory cards with rotation & focal point |
| **Our Students** | Images (`.jpg`, `.png`, `.webp`) | Direct URL paste | Reflects immediately in the Student Life pillars |
| **Hero Carousel & Strip** | Images (`.jpg`, `.png`, `.webp`) | Direct URL paste | Live animated showcase & infinite sliding strip update without refresh |
| **Donation QR Code** | PNG, JPG, JPEG, WEBP | Direct URL paste | Updates public "Scan & Donate" modal for all visitors |

---

## 🛡️ Security & Privacy Note

* **API Secret is NEVER required in the frontend code:** Unsigned presets are designed specifically for client-side uploads.
* Visitors cannot delete, replace, or overwrite existing media using an unsigned preset.
* Do **NOT** put your Cloudinary `API_SECRET` in any frontend file or Git commit.

---

## 🆘 Troubleshooting Quick Reference

* **Error: "Upload preset must be specified when using unsigned upload"**  
  👉 Verify that `VITE_CLOUDINARY_UPLOAD_PRESET` in `.env` exactly matches the preset name in Cloudinary.
* **Error: "Upload preset not found" or "Preset is not unsigned"**  
  👉 Return to Cloudinary Settings → Upload → Upload Presets. Edit your preset and verify that **Signing Mode** is set to **Unsigned**.
* **Video Upload Limit**:  
  👉 Free Cloudinary tier supports video files up to 100MB per file, which is more than sufficient for short ashram highlights and event clips.
