# He'i 📱

<p align="center">
  <img src="./assets/images/hei-logo.png" alt="He'i Logo" width="260" />
</p>

> **He’i** (pronounced *HAY-ee*) — in Fulfulde (spoken across Northern Cameroon and the broader Sahel region), He’i translates directly to:  
> **"It is found"** or **"It is here."**

A modern Lost & Found mobile application built with **React Native**, **Expo (Expo Router)**, **TypeScript**, and **Supabase (PostgreSQL)**.

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Expo Go**: Install the Expo Go app on your physical iOS or Android phone, or set up Android Studio / Xcode simulators.
- **Docker**: *(Optional)* Required only if running a local Supabase database instance.

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Add your Supabase project credentials in `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the Mobile App

```bash
# Start the Expo development server
npm start
```

Scan the QR code displayed in the terminal with the **Expo Go** app (Android) or the Camera app (iOS) to open the app on your physical device.

#### Platform-Specific Commands:

```bash
npm run android   # Open in Android Emulator / connected device
npm run ios       # Open in iOS Simulator (macOS required)
npm run web       # Preview in web browser
```

---

## Backend & Database (Supabase)

Supabase handles PostgreSQL database and backend services.

- **Local Development** *(requires Docker)*:
  ```bash
  npx supabase start    # Start local PostgreSQL, Auth, and Storage
  npx supabase status   # View local API URLs and credentials
  npx supabase stop     # Stop local containers
  ```

---

## Code Quality & Linting

```bash
npm run lint          # Run ESLint checks
npx tsc --noEmit      # Run TypeScript type check
```
