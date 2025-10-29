# Shopify Integration Plan for GenieUs

## 1. Introduction & Goal

**Goal:** To seamlessly integrate GenieUs with the Shopify platform, allowing users to connect their stores and import product data (images, names, descriptions) directly into the generator.

This integration will significantly enhance the user experience by:
*   **Eliminating Friction:** Replacing the manual, error-prone process of finding and pasting product URLs.
*   **Streamlining Workflow:** Enabling a one-click process to select products and populate the generator.
*   **Increasing Value:** Positioning GenieUs as an essential tool in the e-commerce marketing stack.

## 2. High-Level Strategy

We will implement the official **Shopify OAuth 2.0 authentication flow**. This is the industry-standard, secure method for third-party applications to gain authorized access to a user's store data.

This approach requires two main components:
1.  **Frontend (UI/UX):** A user-friendly interface for initiating the connection and selecting products.
2.  **Backend (Secure Handler):** A lightweight server to securely manage the authentication process and store API credentials. The Shopify API Secret Key **must never** be exposed on the frontend.

---

## Phase 1: Backend Setup & Shopify App Configuration

1.  **Create a Shopify Partner Account & App:**
    *   Register a Shopify Partner account.
    *   Within the Partner Dashboard, create a new "Public App".
    *   This will generate a unique **API Key** and **API Secret Key** for GenieUs.

2.  **Configure App Scopes:**
    *   In the app settings, we will define the permissions (scopes) our app requires.
    *   To build user trust, we will start with the absolute minimum required scope: `read_products`. This is a read-only permission that reassures users we cannot modify their store data.

3.  **Set Up a Lightweight Backend Server:**
    *   A simple backend (e.g., using Node.js with Express) will be created to handle the OAuth handshake.
    *   **Primary Responsibilities:**
        *   Securely store our app's API Secret Key.
        *   Receive the callback from Shopify after a user authorizes the app.
        *   Exchange the temporary authorization code for a permanent user-specific access token.
        *   Securely store these user access tokens in a database.

---

## Phase 2: The User-Facing Authentication Flow (UI/UX)

1.  **"Connect Store" UI:**
    *   On the `GeneratorScreen`, the "Import from URL" section will be replaced by a more prominent "Import from your Store" section.
    *   This section will contain a single, clear call-to-action button: **"Connect Shopify Store"**.

2.  **Initiate OAuth Flow:**
    *   When the user clicks the "Connect" button, the frontend redirects them to their Shopify store's authorization URL. This URL will include our app's API Key and the requested `read_products` scope.

3.  **User Authorization:**
    *   The user is presented with a standard, official Shopify screen asking them to grant GenieUs permission to read their product data. This uses a familiar interface, which is crucial for user trust.

4.  **Redirect & Secure Token Exchange:**
    *   Upon successful authorization, Shopify redirects the user back to a pre-configured callback URL on our backend.
    *   Our backend receives a temporary authorization code from Shopify.
    *   The backend then makes a secure, server-to-server request to Shopify, exchanging the temporary code and our **API Secret Key** for a permanent access token for that specific user.

5.  **Token Storage & UI Update:**
    *   The backend securely stores this permanent access token, linking it to the user's GenieUs account.
    *   The frontend is notified of the successful connection.

---

## Phase 3: The In-App Product Selection Experience

1.  **"Connected" State UI:**
    *   Once connected, the UI on the `GeneratorScreen` updates.
    *   The "Connect Shopify Store" button is replaced with a status indicator (e.g., "✅ Connected to: *your-store-name.myshopify.com*") and a "Disconnect" option.
    *   A new primary button appears: **"Select a Product"**.

2.  **Product Picker Modal:**
    *   Clicking "Select a Product" opens a modal window designed for an excellent user experience:
        *   **Search Bar:** Allows users to quickly find products by name.
        *   **Scrollable Product List:** Displays products with a thumbnail image and title for easy identification.
        *   **Pagination/Infinite Scroll:** Gracefully handles stores with a large number of products, ensuring fast load times.

3.  **Fetching & Populating Product Data:**
    *   **Step 1: Fetch List.** When the modal opens, the frontend requests the product list from our backend. The backend uses the user's stored access token to make an authenticated API call to the Shopify Admin API, fetching the products.
    *   **Step 2: User Selection.** The user clicks on their desired product in the modal.
    *   **Step 3: Auto-Populate.** The frontend informs the backend of the selection. The backend can fetch more detailed info if needed. This data is then sent back to the frontend, which automatically:
        *   Populates the "Product Name" and "Product Description" fields.
        *   Downloads the product image, converts it to the required format, and places it in the image upload area.

## 4. Security Considerations

*   **API Secret Key:** The Shopify API Secret Key will **only** reside on our secure backend. It will never be included in the frontend code.
*   **User Access Tokens:** All user-specific access tokens will be stored securely in our database, encrypted at rest.
*   **Principle of Least Privilege:** We will only request the `read_products` scope, ensuring we only have access to the data absolutely necessary for the feature to function.