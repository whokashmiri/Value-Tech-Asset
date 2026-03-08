# ValTech 
ValTech is a comprehensive web application designed for professional asset inspection and valuation. It provides a robust platform for companies to manage complex inspection projects, assign roles, capture detailed asset data in the field, and generate reports. The application is built with a focus on performance, offline capability, and a modern user experience.

## Key Features

- **Role-Based Access Control**:
  - **Admin**: Manages all projects, users, and company-wide settings. Can assign inspectors and valuators to projects.
  - **Inspector**: Captures asset data in the field, including photos, videos, and descriptions. Can create new projects.
  - **Valuation**: Reviews and assesses asset data.

- **Project & Asset Management**:
  - Create, edit, and manage multiple inspection projects.
  - Organize assets within a hierarchical folder structure.
  - Track project status (New, Recent, Done) and mark projects as favorites for quick access.

- **Offline-First Capability**:
  - Download entire projects, including all associated data and media, for full functionality in areas with no internet connectivity.
  - All changes made offline (creating/editing assets and folders) are queued and automatically synchronized with the server once a connection is re-established.
  - Uses IndexedDB (via Dexie.js) for robust client-side storage.

- **Advanced Media Handling**:
  - **Direct Camera Access**: Capture photos and videos directly within the app using a custom camera interface with features like flash and zoom control.
  - **Gallery Upload**: Upload multiple images and videos from the device's gallery.
  - **Cloudinary Integration**: All media is securely uploaded to Cloudinary, organized into project and asset-specific folders for easy management.
  - **Client-Side Compression**: Images are intelligently compressed on the client before upload to save bandwidth and storage.

- **Rich Data Capture**:
  - Record asset details including name, serial number, and miscellaneous custom data.
  - Capture both written descriptions and voice-to-text transcribed audio descriptions.

- **Powerful Data Export**:
  - Export all assets for a project into a comprehensive Excel (`.xlsx`) file.
  - The export includes all asset details, a "Progress" status (Completed/Incomplete), and a direct, public link to a web page displaying all media for that asset.

- **Multi-Language Support**:
  - Fully internationalized with support for both English (LTR) and Arabic (RTL) layouts and translations.

## Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth) (mocked user system using Firestore)
- **Media Storage**: [Cloudinary](https://cloudinary.com/)
- **Offline Storage**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **State Management**: React Context API, `useState`, `useReducer`

---

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn

### 1. Environment Variables

Create a `.env.local` file in the root of the project and add the following Firebase and Cloudinary configuration variables.

```env
# Firebase Configuration
# Get these from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Cloudinary Configuration
# Get these from your Cloudinary dashboard
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 2. Install Dependencies

Install the required project dependencies by running:

```bash
npm install
```

### 3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## Project Structure

- **`/src/app`**: Contains all pages and layouts, following the Next.js App Router structure.
  - **`/(pages)`**: Main application pages like `/`, `/login`, `/project/[projectId]`, etc.
  - **`/api`**: API routes (if any).
  - **`layout.tsx`**: The root layout for the entire application.
  - **`globals.css`**: Global styles and Tailwind CSS directives.
- **`/src/components`**: Reusable React components.
  - **`/ui`**: Core UI components from ShadCN (Button, Card, etc.).
  - **`/modals`**: Dialog components for creating/editing projects, assets, etc.
- **`/src/contexts`**: React Context providers for managing global state (Authentication, Language, etc.).
- **`/src/lib`**: Core application logic and third-party service initializations.
  - **`/firebase`**: Firebase configuration and initialization.
  - **`firestore-service.ts`**: All interactions with the Firestore database.
  - **`offline-service.ts`**: Logic for managing IndexedDB and the offline action queue.
- **`/src/actions`**: Next.js Server Actions, used for secure operations like media uploads.
- **`/public`**: Static assets, including icons and the PWA manifest.
