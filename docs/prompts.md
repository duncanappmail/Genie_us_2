# GenieUs: System & Template Prompts

> **Last Updated:** October 28, 2023
>
> **Note:** This document is the single source of truth for all major system prompts and template prompts used in the GenieUs application. It is intended to be a reference for developers and prompt engineers.

---

## 1. AI Service Prompts

This section contains the prompts used by the functions in `services/geminiService.ts` to perform various AI tasks. Placeholders like `${...}` or `{{...}}` are filled dynamically by the application.

---

### 1.1. `generatePromptSuggestions`

-   **Purpose:** To generate a few creative starting points for the user in the generator screen.

-   **Product Ad Mode:**
    > Generate 3 diverse and creative image generation prompts for our AI image generator. The prompts should be suitable for creating an advertisement for this product: "${productInfo.productName}". Description: "${productInfo.productDescription}". The prompts should be concise, visually descriptive, and under 200 characters each. Return them as a JSON array of strings.

-   **Video Maker Mode:**
    > Generate 3 diverse and creative video generation prompts. The prompts should describe trendy, cool, or potentially viral video concepts. Focus on dynamic scenes, interesting camera movements, and engaging subjects. They should be concise, visually descriptive, and under 200 characters each. Return them as a JSON array of strings.

-   **Art Maker Mode (Default):**
    > Generate 3 diverse and creative image generation prompts for our AI image generator. The prompts should be for creating artistic scenes or abstract concepts. They should be concise, visually descriptive, and under 200 characters each. Return them as a JSON array of strings.

---

### 1.2. `generateCampaignBrief`

-   **Purpose:** To analyze an uploaded product image and generate initial marketing context.
-   **Prompt (sent with product image):**
    > Analyze this product image and generate a concise campaign brief. Identify the product name, write a short description, suggest a target audience, list 3-4 key selling points, and describe the brand vibe (e.g., 'Luxurious', 'Playful', 'Minimalist').

---

### 1.3. `describeImageForPrompt`

-   **Purpose:** To describe a reference image in a style that can be appended to another image generation prompt.
-   **Prompt (sent with reference image):**
    > Concisely describe this image in a way that can be appended to an AI image generation prompt. Focus on the style, composition, and key subjects. For example: 'a hyperrealistic shot of a person wearing a red jacket in a neon-lit city street'.

---

### 1.4. `generateCampaignInspiration`

-   **Purpose:** To brainstorm high-level campaign concepts.
-   **System Instruction:**
    > You are an expert AI Marketing Strategist. Your task is to generate 3 distinct and creative campaign concepts based on a product brief.
    > For each concept, you must provide a short "hook", a detailed "strategy", a "concept" description, and a vivid visual "artDirection".

-   **Conditional Logic (No Goal Provided):**
    > The user has NOT provided a specific goal. Therefore, you must act as an autonomous Chief Marketing Officer. Analyze the product and devise a compelling, timely, and relevant campaign strategy from scratch. To do this, consider factors like:
    > - The current season and any upcoming holidays or major cultural events that could provide a relevant theme.
    > - Potential trending narratives, aesthetics, or social media challenges related to the product's category or its target audience.
    > - Unique, standout angles that would make the product memorable in a crowded market.
    > Your concepts should be proactive, creative, and demonstrate expert-level strategic thinking.

-   **Conditional Logic (Goal Provided):**
    > The user has provided a specific high-level goal: "${highLevelGoal}". Your concepts MUST be directly aligned with achieving this goal.

---

### 1.5. `elaborateArtDirection`

-   **Purpose:** To expand a high-level creative direction into a detailed, effective prompt for an image generator.
-   **Prompt:**
    > Elaborate on this art direction to create a detailed and effective prompt for an AI image generator. Incorporate the product details into the prompt.
    >
    > Art Direction: "${artDirection}"
    > Product Name: ${brief.productName}
    > Product Description: ${brief.productDescription}
    >
    > The final prompt should be a single, cohesive paragraph that vividly describes the desired visual, making the "${brief.productName}" the hero of the scene.

---

### 1.6. `generatePublishingPackage`

-   **Purpose:** To generate a complete set of social media copy for a generated visual.
-   **Prompt:**
    > Generate a social media publishing package for a new ad visual.
    >
    > Campaign Brief:
    > - Product: ${brief.productName}
    > - Description: ${brief.productDescription}
    > - Vibe: ${brief.brandVibe}
    >
    > Visual Description (from prompt): "${prompt}"
    > ${highLevelGoal ? `\nUser's High-Level Goal: ${highLevelGoal}` : ''}
    >
    > Create content for Instagram, TikTok, YouTube Shorts, and X. The generated copy MUST be highly relevant to the provided brief, visual description, and user goal. The tone should perfectly match the brand vibe.
    > - Instagram: A caption and relevant hashtags.
    > - TikTok: A caption, relevant hashtags, and a trending audio suggestion.
    > - YouTube Shorts: A title, a description (caption), and hashtags.
    > - X: A short, punchy caption and hashtags.

---

### 1.7. `scrapeProductDetailsFromUrl`

-   **Purpose:** To extract structured product data from a given URL using Google Search.
-   **Prompt:**
    > Using your search tool, find the product name, a concise product description, and the direct URL to the main product image for all products listed at the URL: ${url}. Respond ONLY with a raw JSON array of objects, where each object has "productName", "productDescription", and "imageUrl" keys. Do not include any introductory text, markdown formatting, or apologies.

---

### 1.8. `regenerateFieldCopy`

-   **Purpose:** To generate a new variation of a specific piece of social media copy.
-   **Prompt:**
    > You are an expert social media copywriter. A user is asking for a new variation of some copy.
    >
    > Original Product: ${brief.productName}
    > Original Visual Prompt: ${prompt}
    > Platform: ${platform}
    > Field to regenerate: ${fieldName}
    > ${highLevelGoal ? `User's High-Level Goal: ${highLevelGoal}` : ''}
    > Existing values they don't want: ${existingValues.join(', ')}
    >
    > Please generate one new, distinct variation for the "${fieldName}" field. It MUST be relevant to the user's goal and product.
    > If regenerating hashtags, return a list of strings. Otherwise, return a single string.

---

### 1.9. `extractBrandProfileFromUrl`

-   **Purpose:** To perform a deep analysis of a website to extract its "Brand DNA." This is a highly constrained prompt that guides the model to analyze code over visual interpretation for better accuracy.
-   **Prompt:**
    > You are an expert AI Brand Analyst. Your task is to analyze the provided company URL and extract its "Brand DNA" by strictly adhering to the following process. Your primary method MUST be analyzing the website's code (HTML and CSS), not visual interpretation, to ensure accuracy and consistency.
    >
    > **URL for Analysis:** ${url}
    >
    > **Mandatory Extraction Process:**
    > 1.  **Analyze CSS:** Use the search tool to locate and inspect the website's CSS. This includes linked stylesheets (`<link rel="stylesheet">`) and inline style blocks (`<style>`). This step is not optional.
    > 2.  **Extract Fonts from CSS:**
    >     *   For the "header" font, find the 'font-family' property applied to `h1` or `h2` elements.
    >     *   For the "subHeader" font, find the 'font-family' property for `h3` or `h4`.
    >     *   For the "body" font, find the 'font-family' property for `p` or `body`.
    >     *   Provide the full font stack (e.g., "Helvetica Neue, Arial, sans-serif").
    > 3.  **Extract Colors from CSS:**
    >     *   Prioritize finding declared CSS variables (e.g., --primary-color, --brand-accent).
    >     *   If variables are not found, identify the most frequently used hex codes for backgrounds, text, and buttons.
    >     *   Assign these hex codes to logical labels (Primary, Secondary, etc.) based on their usage.
    > 4.  **Extract Other Information:** Analyze the website's content to determine the business name, mission, values, tone, and aesthetics. Find the direct URL for the main logo image.
    >
    > **Output Requirement:**
    > After completing the analysis, you MUST return a single, raw JSON object. Do not include any explanatory text, markdown formatting (like \`\`\`json), or any characters before or after the opening and closing curly braces. The JSON object must conform EXACTLY to the following structure:
    > *(The full JSON schema is included in the service file and omitted here for brevity.)*

---

### 1.10. `generateUGCVideo`

-   **Purpose:** To construct a detailed, multi-faceted prompt for generating a User-Generated Content style video.
-   **Structure:** This prompt is built programmatically from several pieces:
    1.  **Avatar:** `A UGC-style video of **this person** (referencing the avatar image).`
    2.  **Scene:** `The scene is **${project.ugcSceneDescription || 'a neutral, clean background'}**.`
    3.  **Product (Optional):** `The person is holding, presenting, and interacting naturally with **this product** (referencing the product image).`
    4.  **Gaze:** `They are looking directly at the camera.`
    5.  **Action (Optional):** `Their behavior should be: **${project.ugcAction}**.`
    6.  **Dialogue:** `They are saying the following script in ${project.ugcLanguage || 'English'}: **"${project.ugcScript}"**.`
    7.  **Voice Characteristics (Optional):** `Their delivery should be with ${voiceCharacteristics.join(', ')}.`
    8.  **Closing:** `The video should feel authentic and engaging.`

---

## 2. Creative Template Prompts

This section contains the prompts from the Template Library in `lib/templates.ts`. Each template has two prompts:

-   **`promptTemplate`:** A dynamic template used by the app, with `{{PLACEHOLDERS}}` that are filled in based on the user's product information.
-   **`imageGenerationPrompt`:** A concrete, high-quality example prompt used to generate the template's preview image.

---

### 2.1. Clean Studio Backdrop
-   **`promptTemplate`:** A professional studio product shot of {{PRODUCT_NAME}} on a solid, light grey seamless background. Use clean, soft lighting to highlight the product's details. The style should be minimalist and elegant, perfect for an e-commerce website. The overall mood is {{BRAND_VIBE}}.
-   **`imageGenerationPrompt`:** Professional product photography of a sleek, modern water bottle made of matte black stainless steel. The bottle is centered on a seamless, solid, light grey background (#f0f0f0). The scene is lit with clean, soft studio lighting that creates gentle highlights and minimizes shadows, emphasizing the bottle's form and texture. Style: minimalist, elegant, commercial. Shot on a DSLR with a prime lens.

### 2.2. Geometric Pedestals
-   **`promptTemplate`:** A high-fashion product shot of {{PRODUCT_NAME}} displayed on a set of overlapping pastel-colored geometric pedestals and blocks. The lighting should be bright and direct, creating sharp shadows. The background is a solid, complementary color. The feel is modern, artistic, and {{BRAND_VIBE}}.
-   **`imageGenerationPrompt`:** A stylish advertisement for a luxury watch. The watch is displayed on a mint green geometric pedestal. The scene includes other geometric shapes in pastel pink and cream. The background is a solid soft beige. The lighting is bright and direct, creating crisp, defined shadows. The style is modern, minimalist, and high-fashion. 4k, photorealistic.

### 2.3. Cozy Morning Coffee
-   **`promptTemplate`:** A lifestyle photograph of {{PRODUCT_NAME}} on a wooden coffee table next to a steaming mug of coffee and an open book. Soft morning light streams in through a nearby window, creating a warm and inviting atmosphere. The scene should feel relatable and cozy, targeting {{TARGET_AUDIENCE}}.
-   **`imageGenerationPrompt`:** A cozy lifestyle scene featuring a pair of high-end, noise-cancelling headphones resting on a rustic wooden coffee table. Next to the headphones are a steaming ceramic mug of coffee and an open book with glasses. Soft, warm morning light streams through a window, illuminating the scene. The atmosphere is peaceful, comfortable, and inviting. Photorealistic, depth of field.

### 2.4. On the Go
-   **`promptTemplate`:** Action shot of {{PRODUCT_NAME}} being used by a person in a bustling, stylish urban environment. The background is slightly blurred to emphasize the product. The overall image should feel energetic, modern, and aspirational, resonating with a {{TARGET_AUDIENCE}} lifestyle.
-   **`imageGenerationPrompt`:** A dynamic lifestyle shot of a stylish backpack in a modern urban setting. The backpack is worn by a person walking through a bustling city street, with blurred background motion of people and city lights. The image feels energetic, fashionable, and aspirational. The focus is sharp on the backpack, highlighting its textures and details. Cinematic, photorealistic.

### 2.5. Spring Bloom
-   **`promptTemplate`:** A vibrant spring scene featuring {{PRODUCT_NAME}} surrounded by fresh cherry blossoms and tulips. The lighting is bright and airy, with a soft-focus background of a green garden. The mood is refreshing, clean, and optimistic, perfect for a {{BRAND_VIBE}} spring campaign.
-   **`imageGenerationPrompt`:** A bottle of perfume sitting on a white marble surface, surrounded by fresh, dewy cherry blossoms and pink tulips. The background is a soft-focus garden with lush greenery. The lighting is bright and airy, evoking a fresh spring morning. Style: elegant, clean, refreshing. Photorealistic, macro details.

### 2.6. Summer Beach Day
-   **`promptTemplate`:** A vibrant, sun-drenched photo of {{PRODUCT_NAME}} on a clean, sandy beach. The background features turquoise ocean waves and a clear blue sky. The product is the hero, looking crisp and refreshing. The feel is energetic, fun, and perfectly captures the {{BRAND_VIBE}} of summer.
-   **`imageGenerationPrompt`:** A can of sparkling soda, dripping with condensation, sits partially buried in clean, white sand on a tropical beach. In the background, turquoise waves gently lap the shore under a bright, clear blue sky. The sun is high, casting a sharp, clean light. Style: vibrant, commercial, refreshing. Photorealistic, 8k.

### 2.7. Autumn Harvest
-   **`promptTemplate`:** A festive, {{BRAND_VIBE}} flat-lay of {{PRODUCT_NAME}} surrounded by mini pumpkins, colorful autumn leaves, and a cozy knit sweater. The color palette should be warm, with oranges, reds, and browns. The lighting is soft and golden, like a crisp autumn afternoon.
-   **`imageGenerationPrompt`:** A beautiful autumn-themed flat-lay featuring a bottle of premium skincare serum. The bottle is centrally placed and surrounded by mini pumpkins, vibrant red and orange autumn leaves, a cinnamon stick, and a corner of a cozy, chunky-knit sweater. The background is dark wood. The lighting is soft and golden, creating a warm, festive mood. Top-down view, sharp focus, rich textures.

### 2.8. Winter Wonderland
-   **`promptTemplate`:** A magical shot of {{PRODUCT_NAME}} resting on a bed of fresh, sparkling snow, with out-of-focus fairy lights in the background. A single, delicate snowflake is captured landing nearby. The mood is enchanting, festive, and perfect for a holiday gift guide targeting {{TARGET_AUDIENCE}}.
-   **`imageGenerationPrompt`:** An enchanting product shot of a luxury candle in a glass jar, resting on a bed of pristine, sparkling snow. The background is a soft-focus view of a winter forest at dusk with warm, glowing fairy lights (bokeh effect). A single, perfect snowflake is captured in mid-air near the candle. The mood is magical, festive, and serene. Cinematic, high detail.

### 2.9. Valentine's Romance
-   **`promptTemplate`:** An elegant, romantic scene for {{PRODUCT_NAME}}. The product is artfully placed among red rose petals and silk fabric. The lighting is soft and warm, with a few candles creating a gentle glow in the background. The mood is luxurious and perfect for a Valentine's Day gift.
-   **`imageGenerationPrompt`:** A bottle of expensive perfume is elegantly placed on a draped, deep red silk fabric, surrounded by fresh rose petals. In the background, soft-focus candles provide a warm, intimate glow. The scene is luxurious, romantic, and sophisticated. Photorealistic, shallow depth of field.

### 2.10. Mother's Day Elegance
-   **`promptTemplate`:** A beautiful and elegant flat-lay for {{PRODUCT_NAME}}, perfect for Mother's Day. The product is surrounded by a bouquet of fresh peonies and a handwritten card. The background is clean white marble. The lighting is bright and natural, creating a feeling of appreciation and love.
-   **`imageGenerationPrompt`:** An elegant Mother's Day flat-lay. A beautifully packaged box of chocolates is placed on a white marble surface, surrounded by a bouquet of fresh pink peonies and a handwritten card that says "Thank You". The lighting is bright, soft, and natural. The style is clean, sophisticated, and heartfelt.

### 2.11. Spooky Halloween
-   **`promptTemplate`:** A moody and atmospheric Halloween shot of {{PRODUCT_NAME}}. The product sits on a dark wooden surface, surrounded by theatrical smoke, small black bats, and a hint of spiderwebs. The lighting is dramatic and orange, perhaps from a nearby jack-o'-lantern. The mood is spooky, fun, and {{BRAND_VIBE}}.
-   **`imageGenerationPrompt`:** A pair of black leather boots on a dark, rustic wooden table. The scene is filled with theatrical fog, and a few small, decorative bats are in the background. A carved jack-o'-lantern off-camera casts a dramatic, orange light on the boots. The mood is spooky, atmospheric, and stylish. Cinematic lighting, halloween theme.

### 2.12. Holiday Cheer
-   **`promptTemplate`:** A festive holiday photograph of {{PRODUCT_NAME}} nestled among pine branches, red berries, and shiny ornaments. Twinkling holiday lights are softly blurred in the background. The scene is warm, joyful, and captures the magic of the holiday season, making it a perfect gift.
-   **`imageGenerationPrompt`:** A high-end leather wallet is nestled amongst fresh pine branches, clusters of red berries, and gold and silver christmas ornaments. In the background, warm twinkling holiday lights are beautifully blurred (bokeh). The overall mood is festive, warm, and luxurious. The perfect holiday gift. Photorealistic, tack sharp focus on the wallet.

### 2.13. Floating in Air
-   **`promptTemplate`:** A surreal, artistic image where {{PRODUCT_NAME}} is floating gracefully in the center of a room with clouds drifting by. The lighting is ethereal and dreamlike. The color palette is soft and pastel. This is a high-concept ad that feels {{BRAND_VIBE}} and artistic.
-   **`imageGenerationPrompt`:** A surreal and artistic advertisement where a pair of elegant, high-tech sneakers are floating weightlessly in the center of a minimalist room. Fluffy white clouds drift slowly through the room. The walls are a soft pastel blue. The lighting is ethereal and dreamlike, casting soft shadows. The overall mood is serene, imaginative, and high-concept. Photorealistic, 8k.

### 2.14. Nature Fusion
-   **`promptTemplate`:** An advertisement showcasing {{PRODUCT_NAME}} as if it is growing organically from a mossy patch of forest floor. Beautiful, bioluminescent flowers are intertwined with the product. The scene is at twilight, with magical lighting. Key selling points to hint at are: {{KEY_SELLING_POINTS}}.
-   **`imageGenerationPrompt`:** An organic, surreal product shot. A bottle of natural face oil appears to be growing from a patch of lush, green moss on a forest floor. Small, glowing, bioluminescent mushrooms and delicate flowers are intertwined around the base of the bottle. The scene is set at twilight, with magical, soft light filtering through the trees. The mood is enchanting and highlights the product's natural ingredients. Macro photography, fantasy style.
