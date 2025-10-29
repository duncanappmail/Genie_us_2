# Production Transition Plan for GenieUs

## 1. Introduction & Goal

**Current State:** GenieUs is a powerful, client-side-first React application. It uses the browser's IndexedDB for all project and file storage and calls the Gemini API directly from the frontend. This is an excellent architecture for a prototype, ensuring user privacy and offline functionality.

**Goal:** To evolve GenieUs into a scalable, multi-device, production-ready application. This requires transitioning from a client-side storage model to a robust backend architecture where the server becomes the **single source of truth** for all user data.

This transition will enable key features:
*   **Multi-device Sync:** Users can access their projects from any device.
*   **Enhanced Security:** Protects the Gemini API key and enables secure user management.
*   **Scalability:** Handles a growing user base and more complex server-side tasks.
*   **Data Backup & Reliability:** Safeguards user data against browser-specific issues.

This document provides a comprehensive plan for a full-stack developer to build the required backend and guide the necessary frontend refactoring.

---

## 2. High-Level Target Architecture

The target architecture consists of four main components:
1.  **Frontend:** The existing React application, refactored to communicate with our new API instead of IndexedDB.
2.  **Backend API:** A new server application (e.g., Node.js/Express) that will manage business logic, database interactions, and secure calls to external services.
3.  **Cloud Database:** A managed database (e.g., Google Firestore, PostgreSQL) to store user accounts and project metadata.
4.  **Cloud File Storage:** A dedicated service (e.g., Google Cloud Storage, AWS S3) to store large assets like images and videos.

---

## 3. Backend Requirements & API Specification

### 3.1. Technology Stack Recommendation
*   **Language/Framework:** **Node.js with Express or NestJS**. This allows for a consistent JavaScript/TypeScript ecosystem across the stack.
*   **Database:** **Google Firestore (NoSQL)** or a managed **PostgreSQL** service. Firestore is a strong choice as it aligns well with the existing object-based data structure.
*   **File Storage:** **Google Cloud Storage (GCS)** is recommended for its seamless integration within the Google Cloud ecosystem.

### 3.2. Database Schema
Two primary collections/tables are required:

*   **`users` collection:**
    *   `userId` (Primary Key)
    *   `email`
    *   `hashedPassword`
    *   `createdAt`
    *   `subscriptionId` (links to Stripe/payment provider)
    *   ...other user-specific fields.

*   **`projects` collection:**
    *   `projectId` (Primary Key)
    *   `userId` (Foreign Key to `users`)
    *   `createdAt`
    *   `mode`
    *   `prompt`
    *   `productName`
    *   ...all other fields from the existing `Project` type in `types.ts`.
    *   **CRITICAL CHANGE:** Fields like `productFile`, `generatedImages`, etc., will no longer store file data. Instead, they will store a **URL string** pointing to the file's location in Google Cloud Storage.

### 3.3. Secure Gemini API Integration (Proxy)
The Gemini API key **must never** be exposed on the frontend. The backend will act as a secure proxy.

*   The frontend will no longer call `@google/genai` directly for most operations.
*   Instead, it will call new, dedicated endpoints on our backend (e.g., `POST /api/ai/generate-images`).
*   The backend will receive the request, attach the secret `GEMINI_API_KEY` (stored as an environment variable), and then make the actual call to the Gemini API. This keeps the key completely secure.

### 3.4. API Endpoint Specification (The "Contract")

The backend must expose the following RESTful API endpoints. All endpoints, except for `register` and `login`, must be protected and require a valid JWT.

#### Authentication (`/api/auth`)
*   `POST /register`: { email, password } -> { user, token }
*   `POST /login`: { email, password } -> { user, token }

#### Projects (`/api/projects`)
*   `GET /`: Returns a list of all projects for the authenticated user.
*   `POST /`: Creates a new project. Body should match the `Project` type. Returns the newly created project.
*   `PUT /:projectId`: Updates an existing project. Returns the updated project.
*   `DELETE /:projectId`: Deletes a project. Returns a success message.

#### File Handling (`/api/files`)
*   `POST /upload`: Handles file uploads (e.g., via `multipart/form-data`). The backend streams the file to GCS and returns a secure, public URL for the stored file.
    *   **Response:** `{ "url": "https://storage.googleapis.com/..." }`

#### AI Proxy (`/api/ai`)
*   `POST /generate-images`: Takes a prompt and other parameters. Calls the Gemini Image API and returns the result.
*   `POST /generate-video`: Takes a prompt and parameters. **This must be handled asynchronously.** (See Section 4).
*   ...other endpoints to proxy every function currently in `services/geminiService.ts`.

---

## 4. Handling Long-Running Operations (Video Generation)

Video generation can take several minutes and will time out a standard HTTP request. This requires an asynchronous job queue architecture.

**Workflow:**
1.  **Request:** Frontend calls `POST /api/ai/generate-video` with the prompt.
2.  **Acknowledge:** The backend immediately creates a job record in the database (status: `pending`), adds the task to a background job queue (e.g., using Google Cloud Tasks), and responds with `202 Accepted`.
    *   **Response:** `{ "jobId": "..." }`
3.  **Process:** A separate background worker picks up the job, generates the video, and updates the job record with the final video URL and a `completed` status upon finishing.
4.  **Poll for Status:** The frontend polls a new endpoint, `GET /api/jobs/:jobId`, every 10-15 seconds.
5.  **Completion:** Once the job status is `completed`, the polling endpoint returns the final result, including the video URL. The frontend then displays the result to the user.

---

## 5. Frontend Refactoring Plan

The frontend will need significant updates to communicate with the new backend.

1.  **Rewrite Service Layer (`services/dbService.ts`):**
    *   This is the most critical task. Gut all IndexedDB logic.
    *   Rewrite every function to make an authenticated HTTP request (using `fetch` or `axios`) to the new backend API endpoints defined above.

2.  **Implement Authentication Flow (`context/AuthContext.tsx`):**
    *   Update `handleLogin` to call `POST /api/auth/login`.
    *   Upon successful login, securely store the received JWT (e.g., in a secure, HTTP-only cookie or localStorage).
    *   Create a mechanism (like an `axios` interceptor) to automatically attach the JWT as an `Authorization: Bearer <token>` header to all subsequent API requests.

3.  **Update File Upload Logic (`components/Uploader.tsx`, etc.):**
    *   Modify all file upload components to send files to the `POST /api/files/upload` endpoint.
    *   On success, use the returned URL to update the project state before saving the project to the backend.

4.  **Update AI Calls (`context/ProjectContext.tsx`):**
    *   Refactor `handleGenerate`, `runAgent`, etc., to call the new backend proxy endpoints (`/api/ai/...`) instead of the Gemini SDK directly.
    *   Implement the polling logic for long-running jobs like video generation.

---

## 6. Deployment & Infrastructure Checklist

*   **Hosting Provider:** Vercel (for frontend) and Google Cloud Run (for backend API and background workers) are highly recommended.
*   **Database:** Provision a managed database instance (e.g., Google Firestore).
*   **File Storage:** Create a Google Cloud Storage bucket with appropriate public access rules for generated assets.
*   **CI/CD:** Set up a CI/CD pipeline (e.g., using GitHub Actions) for automated testing and deployment.
*   **Environment Variables:** Securely configure all secrets (Database URL, Gemini API Key, Shopify API Keys, JWT Secret) in the hosting provider's environment variable settings. **These must never be committed to the repository.**
