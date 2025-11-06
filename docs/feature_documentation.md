# GenieUs: Comprehensive Feature Documentation

> **Last Updated:** October 28, 2023

> **Note for Future Updates:** This document is the single source of truth for all implemented features in the GenieUs application. It is intended for Product Managers and Developers to track and understand the current state of the platform's capabilities.
>
> When adding a new feature or modifying an existing one, please adhere to the established structure for each feature section and **always update the 'Last Updated' date at the top of this document.**
>
> -   **[Feature Name]:** The main heading for the feature.
> -   **User Value:** Explain *why* this feature exists from the user's perspective. What problem does it solve?
> -   **User Flow & Functionality:** Describe *how* a user interacts with the feature, step-by-step.
> -   **Technical Implementation:** Provide a high-level technical breakdown for developers.
>     -   **Primary Screens/Components:** List the main UI files involved.
>     -   **Core Logic:** Point to the key logic files (contexts, services) and specific functions.
>     -   **Data Models:** Reference the relevant interfaces from `types.ts`.
>     -   **Notes:** Add any other important technical details, such as the specific AI model used or any unique constraints.

---

## 1. Introduction

This document provides a comprehensive overview of the features and functionalities implemented in the GenieUs application. It is structured to give a clear understanding of the platform's capabilities, from core content creation modes to advanced AI-powered automation and user management.

---

## 2. Core Creative Modes

These are the primary entry points for users to begin the creation process, accessible from the `HomeScreen`.

### 2.1. Product Ad

-   **User Value:** Enables e-commerce sellers to create professional, ad-ready visuals of their products in any imagined scene without needing physical photoshoots, saving time and money.
-   **User Flow & Functionality:**
    1.  The user starts a "Product Ad" project from the `HomeScreen`.
    2.  On the `GeneratorScreen`, they can either upload a product image or use the "Import from URL" feature.
    3.  Upon image upload, the AI automatically analyzes the product and populates the `productName` and `productDescription` fields by generating a `CampaignBrief`.
    4.  The user describes their desired scene in the prompt input.
    5.  The AI generates a new visual that composites the user's product into the described scene.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `GeneratorScreen`, `ProductScraper`
    -   **Core Logic:** `ProjectContext.tsx` (state), `geminiService.ts#generateCampaignBrief`, `geminiService.ts#generateContent` (with `gemini-2.5-flash-image` model)
    -   **Data Models:** `Project`, `UploadedFile`, `CampaignBrief`
    -   **Notes:** This mode leverages a multimodal prompt (image + text) for generation.

### 2.2. Art Maker

-   **User Value:** Provides a flexible canvas for users to transform any text idea into a unique piece of visual art, enabling creative expression and content creation for blogs, social media, or personal projects.
-   **User Flow & Functionality:**
    1.  The user starts an "Art Maker" project from the `HomeScreen`.
    2.  On the `GeneratorScreen`, they describe their vision in the prompt input.
    3.  Optionally, they can upload up to four reference images to influence the style, subject, or composition of the output.
    4.  The AI generates a new image based on the text prompt and any provided reference images.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `GeneratorScreen`
    -   **Core Logic:** `ProjectContext.tsx` (state), `geminiService.ts#generateImages` (with `imagen-4.0-generate-001` model)
    -   **Data Models:** `Project`, `UploadedFile`
    -   **Notes:** Uses text-to-image generation. Reference images can be used to steer the final output.

### 2.3. Video Maker

-   **User Value:** Empowers users to create short-form video content from simple text prompts or static images, lowering the barrier to video production for social media and marketing.
-   **User Flow & Functionality:**
    1.  The user starts a "Video Maker" project (Pro Plan required).
    2.  On the `GeneratorScreen`, they describe a scene or action.
    3.  (Advanced) They can set a start/end frame, enable cinematic quality, or add camera controls.
    4.  The AI generates a short video clip based on the inputs.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `GeneratorScreen`, `AdvancedVideoSettings`
    -   **Core Logic:** `ProjectContext.tsx` (state), (Future `geminiService.ts` function for video)
    -   **Data Models:** `Project`, `UploadedFile`
    -   **Notes:** This is a Pro-tier feature.

### 2.4. Create a UGC Video

-   **User Value:** Allows brands to generate authentic-looking User-Generated Content (UGC) style videos with an AI avatar, providing a scalable way to create testimonials, explainers, or social media content without hiring actors.
-   **User Flow & Functionality:**
    1.  The user starts a "Create a UGC Video" project (Pro Plan required).
    2.  A multi-step wizard on `UGCGeneratorScreen` guides them through:
        -   **Image:** Uploading an avatar and optional product.
        -   **Action:** Describing the avatar's behavior.
        -   **Dialogue:** Writing the script and choosing voice characteristics.
        -   **Scene:** Defining the background.
    3.  The AI generates a video of the avatar performing the action and speaking the dialogue in the specified scene.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `UGCGeneratorScreen`
    -   **Core Logic:** `ProjectContext.tsx` (state), `geminiService.ts#generateUGCVideo` (using `veo` models)
    -   **Data Models:** `Project`, `UploadedFile`
    -   **Notes:** This is a Pro-tier feature that combines multiple AI capabilities.

---

## 3. AI-Powered Automation & Strategy

These features leverage AI to perform strategic tasks, accelerating the marketing workflow.

### 3.1. AI Agent: The Autonomous Marketing Genie

-   **User Value:** Acts as an "CMO-in-a-box" by autonomously generating a complete, ready-to-launch marketing campaign from a single product image, saving users immense time in strategy, copywriting, and creative direction.
-   **User Flow & Functionality:**
    1.  The user starts the "AI Agent" from the `HomeScreen` (Pro Plan required).
    2.  On `AgentScreen`, they upload a product image and can provide an optional high-level goal.
    3.  Upon launch, a loading screen shows the agent's real-time thought process (analyzing, brainstorming, generating).
    4.  The user is taken to the `AgentResultScreen`, which presents a complete package: the final visual, a summary of the AI's strategy, and a full set of social media copy.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `AgentScreen`, `AgentResultScreen`, `LoadingOverlay`
    -   **Core Logic:** `ProjectContext.tsx#runAgent`, multiple functions in `geminiService.ts`
    -   **Data Models:** `Project`, `CampaignPackage`, `PublishingPackage`
    -   **Notes:** This is the most complex AI workflow, chaining multiple Gemini calls together.

### 3.2. Brand DNA

-   **User Value:** Ensures all AI-generated content is consistent and on-brand by creating a persistent, editable brand profile that can be used to guide future generations.
-   **User Flow & Functionality:**
    1.  The user navigates to the "Brand DNA" page from the header.
    2.  If no profile exists, they can enter their website URL. The AI analyzes the site and automatically populates the profile.
    3.  The user can then review and manually edit every field: logo, colors, fonts, mission, values, tone of voice, and aesthetics.
    4.  The saved profile is stored locally for future use.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `BrandingScreen.tsx`, `Header.tsx`
    -   **Core Logic:** `AuthContext.tsx#handleFetchBrandProfile`, `geminiService.ts#extractBrandProfileFromUrl`, `geminiService.ts#fetchLogo`, `dbService.ts` (for persistence)
    -   **Data Models:** `BrandProfile`, `User`
    -   **Notes:**
        -   Uses Google Search grounding to analyze the website URL.
        -   The `extractBrandProfileFromUrl` function uses a highly specific prompt that instructs the AI to perform a code-based analysis of the website's CSS for fonts and colors, ensuring higher accuracy and consistency compared to visual interpretation.
        -   The `fetchLogo` function is resilient, supporting `data:` URIs for inline logos and utilizing a series of CORS proxy fallbacks to reliably fetch images from external domains.

### 3.3. Product Import from URL

-   **User Value:** Streamlines the `Product Ad` workflow by automatically fetching product details and creating a clean product image directly from a URL, eliminating manual data entry and the need for a pre-existing clean image.
-   **User Flow & Functionality:**
    1.  In the `Product Ad` flow on `GeneratorScreen`, the user pastes a product page URL.
    2.  The AI scrapes the page for product names and descriptions. If multiple are found, a modal appears for selection.
    3.  The AI generates a new, clean studio image of the selected product on a white background.
    4.  The generated image and scraped text automatically populate the generator fields.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `GeneratorScreen`, `ProductScraper`, `ProductSelectionModal`
    -   **Core Logic:** `geminiService.ts#scrapeProductDetailsFromUrl`, `geminiService.ts#visualizeScrapedProduct`
    -   **Data Models:** `ScrapedProductDetails`, `Project`
    -   **Notes:** Uses `googleSearch` grounding and `imagen-4.0-generate-001` for visualization.

---

## 4. Asset & Project Management

Features related to organizing, finding, and reusing creative work.

### 4.1. Project System & Client-Side Persistence

-   **User Value:** Automatically saves all user creations and their settings, allowing users to revisit, review, and build upon their past work. Client-side storage ensures data privacy and offline access.
-   **User Flow & Functionality:**
    -   Every creation session is saved as a `Project`.
    -   Recent projects are displayed on the `HomeScreen`.
    -   All projects are viewable and searchable on the `AllProjectsScreen`.
    -   Users can open a project to view its assets and details, or delete it.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `AllProjectsScreen`, `PreviewScreen`
    -   **Core Logic:** `dbService.ts` (handles all IndexedDB operations), `ProjectContext.tsx` (manages state)
    -   **Data Models:** `Project`
    -   **Notes:** Large assets (images/videos) are stored as `Blob`s in a separate IndexedDB object store for performance.

### 4.2. Template Library & Exploration

-   **User Value:** Provides a curated library of creative starting points, helping users overcome creative blocks and quickly generate high-quality, relevant content for specific seasons, holidays, or styles.
-   **User Flow & Functionality:**
    -   Featured templates are shown on the `HomeScreen`. The user can toggle between "Image" and "Video" templates.
    -   The user can navigate to the `ExploreScreen` to view and filter the entire library.
    -   On the `ExploreScreen`, the user first selects the primary content type ("Image" or "Video") and then can apply secondary category filters (e.g., 'Seasonal', 'Studio').
    -   Selecting an image template starts a `Product Ad` project and pre-populates the prompt, which is then customized with product details after an image upload. Selecting a video template will start a `Video Maker` project.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `ExploreScreen`
    -   **Core Logic:** `ProjectContext.tsx#selectTemplate`, `lib/templates.ts` (static template data), filtering logic within `HomeScreen.tsx` and `ExploreScreen.tsx`.
    -   **Data Models:** `Template` (now includes a `type` property).
    -   **Notes:** 
        -   The library is dynamic, intelligently surfacing `Seasonal` and `Holidays & Events` templates based on the user's current date.
        -   The separation of `type` (Image/Video) from `category` provides a scalable structure for introducing new content types. Video templates currently show a "Coming Soon!" message.

---

## 5. Post-Generation Toolkit

This suite of tools, primarily located on the `PreviewScreen` and `AgentResultScreen`, allows users to refine and repurpose their generated assets.

-   **Functionality:**
    -   **Regenerate:** Creates a new variation based on the original prompt, consuming credits.
    -   **Refine (Images):** Allows the user to provide a text prompt to make specific edits to an image (e.g., "add a hat").
    -   **Animate (Pro Plan):** Converts a static image into a short, animated video clip.
    -   **Extend Video (Pro Plan):** Adds more time to a generated video based on a new prompt describing the subsequent action.
    -   **Download:** Saves the final asset to the user's device.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `PreviewScreen`, `AgentResultScreen`
    -   **Core Logic:** `ProjectContext.tsx` (handles all post-generation actions)
    -   **Data Models:** `Project`

---

## 6. User & Account Management

-   **User Value:** Provides standard, secure account management features, including a tiered subscription model that allows users to choose a plan that fits their needs.
-   **Functionality:**
    -   **Authentication:** `AuthScreen` provides email/password and OAuth sign-in/sign-up.
    -   **Subscription & Billing:** `SubscriptionScreen` and related screens allow users to view their current plan, manage payment methods, see billing history, and change or cancel their subscription.
    -   **Credit System:** Credits are the currency for generation. The system is managed in `AuthContext` and displayed in the `Header`. Users on paid plans can purchase top-up credits.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `AuthScreen`, `PlanSelectScreen`, `SubscriptionScreen`, `BillingHistoryScreen`, `PaymentDetailsScreen`
    -   **Core Logic:** `AuthContext.tsx` (manages all user state and actions), `UIContext.tsx` (handles navigation between account screens)
    -   **Data Models:** `User`, `Subscription`, `Credits`, `PaymentMethod`
    -   **Notes:** The current implementation uses mock data and state management. A production version would require a secure backend and integration with a payment provider like Stripe.