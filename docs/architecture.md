# GenieUs Application Architecture

## 1. Introduction

This document outlines the software architecture and key technical decisions for the GenieUs application. The primary goal of this architecture is to support a modern, fast, and maintainable client-side application that leverages the full power of the Gemini API in the browser.

The architecture prioritizes:
- **Simplicity & Maintainability:** A clean, understandable structure that is easy for developers to work with.
- **User Experience:** A fast, responsive UI with seamless state transitions and offline data access.
- **Security & Privacy:** Keeping user data on the client-side wherever possible.
- **Rapid Development:** Utilizing modern tools and patterns to accelerate feature implementation.

---

## 2. Core Technologies

- **Frontend Framework:** **React 19** with **TypeScript** for building a type-safe, component-based user interface.
- **Styling:** **Tailwind CSS**, a utility-first CSS framework for rapid UI development. A small set of custom styles in `index.html` handles dark mode and animations.
- **AI Integration:** **@google/genai SDK**, the official library for all interactions with the Gemini family of models.
- **Build System:** **None (ES Modules + Import Maps)**. The application leverages modern browser capabilities to load modules directly from a CDN, eliminating the need for a complex build step (like Webpack or Vite) and simplifying the development environment.

---

## 3. Frontend Architecture

### Component Model
The application is structured into two primary types of components:
- **Screens (`/screens`):** Top-level components that represent a full page or view (e.g., `HomeScreen`, `GeneratorScreen`).
- **Components (`/components`):** Reusable, smaller UI elements that are used across multiple screens (e.g., `Header`, `Uploader`, various modals).

### State Management
- **React Context API (`AppContext.tsx`):** We use React's built-in Context API for global state management. `AppProvider` serves as a single source of truth for the entire application state, including user session, projects, the current `appStep`, loading states, and more.
- **Rationale:** For an application of this scale, the Context API provides a simple, powerful, and native way to manage state without the overhead and boilerplate of external libraries like Redux.

### Navigation
- **State-based Routing:** The application does not use a traditional URL-based router. Instead, navigation is handled by a state variable `appStep` within `AppContext`. The `navigateTo()` function updates this state, causing the main `App.tsx` component to render the appropriate screen.
- **Rationale:** This approach is highly effective for a single-page application with a defined, linear user flow. It simplifies the logic, avoids the need for a routing library, and keeps the focus on the application's state rather than the URL.

---

## 4. Data Persistence & Services

### Client-Side First Strategy
GenieUs is designed as a client-side-first application. All user-generated content, including project details and assets, is stored directly in the user's browser.
- **Rationale:** This approach enhances user privacy (no project data is sent to a server unless required for generation), provides excellent offline capabilities, and simplifies the backend infrastructure.

### Storage Mechanisms
- **IndexedDB (`dbService.ts`):** Used as the primary database for storing structured project data and large binary files (image and video `Blob`s). IndexedDB is robust, supports transactions, and is ideal for handling the application's core data.
- **LocalStorage:** Used for lightweight, non-critical data, specifically the user session object (for auto-login) and the user's preferred theme (light/dark).

### Service Layer Pattern
All external interactions (AI model calls, database operations) are abstracted into a dedicated service layer.
- **`geminiService.ts`:** Contains all logic for communicating with the `@google/genai` SDK. It handles prompt construction, API calls for image/video generation, and parsing responses.
- **`dbService.ts`:** Provides a clean, promise-based API for interacting with IndexedDB, abstracting away the complexities of the IndexedDB API.
- **Rationale:** This separation of concerns keeps UI components clean and focused on presentation, while the business logic is centralized, reusable, and easier to test and maintain.

---

## 5. Key Architectural Decisions

- **No Backend for Core App Logic:** The decision to make this a client-side-only application was deliberate. It simplifies deployment, reduces operational costs, and enhances user privacy. The planned Shopify integration will require a small, dedicated backend, but only for securely handling OAuth and API keys, not for storing user project data.

- **Handling VEO API Key:** For video generation features that use the VEO models, we rely on the `window.aistudio` object provided by the execution environment. This is a specific requirement of the platform to securely manage user-provided API keys for these advanced models without exposing them in our code.

- **Dynamic, Time-Based Templates:** The "Seasonal" and "Holidays & Events" templates are not static. They are filtered in the UI based on the user's current system date, ensuring the app feels timely and relevant without requiring any server-side logic.
