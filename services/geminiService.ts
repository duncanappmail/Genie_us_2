

import { GoogleGenAI, Type, VideoGenerationReferenceImage, VideoGenerationReferenceType, GenerateContentResponse, Modality } from "@google/genai";
import type { UploadedFile, CampaignBrief, CampaignInspiration, AdCopy, ScrapedProductDetails, PublishingPackage, PlatformPublishingContent, Project, BrandProfile, UGCScriptIdea, SocialProofIdea } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (file: UploadedFile) => {
    if (!file.base64) throw new Error("File base64 content is missing.");
    return {
        inlineData: {
            mimeType: file.mimeType,
            data: file.base64,
        },
    };
};

const fileToUploadedFile = async (file: File | Blob, name: string): Promise<UploadedFile> => {
    const reader = new FileReader();
    const blob = file;
    return new Promise((resolve, reject) => {
        reader.readAsDataURL(blob);
        reader.onload = () => {
            const base64 = (reader.result as string)?.split(',')[1];
            if (!base64) {
                reject(new Error("Failed to read file as base64"));
                return;
            }
            resolve({
                id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                base64,
                mimeType: file.type || 'application/octet-stream',
                name,
                blob,
            });
        };
        reader.onerror = error => reject(error);
    });
};

export const generatePromptSuggestions = async (mode: string, productInfo?: { productName: string, productDescription: string }): Promise<{ title: string; prompt: string; }[]> => {
    let prompt: string;

    if (mode === 'Product Ad' && productInfo?.productName) {
        prompt = `Generate 3 diverse and creative image generation concepts for our AI image generator. The concepts should be suitable for creating an advertisement for this product: "${productInfo.productName}". Description: "${productInfo.productDescription}". For each concept, provide a short, catchy "title" and a detailed "prompt" for the image generator. The prompt should be visually descriptive and under 200 characters. Return them as a JSON array of objects, where each object has "title" and "prompt" keys.`;
    } else if (mode === 'Video Maker') {
        prompt = `Generate 3 diverse and creative video generation concepts. The concepts should describe trendy, cool, or potentially viral video ideas. For each concept, provide a short, catchy "title" and a detailed "prompt" for the video generator. The prompt should be visually descriptive and under 200 characters. Return them as a JSON array of objects, where each object has "title" and "prompt" keys.`;
    } else { // Default to Art Maker
        prompt = `Generate 3 diverse and creative image generation concepts for our AI image generator. The concepts should be for creating artistic scenes or abstract concepts. For each concept, provide a short, catchy "title" and a detailed "prompt" for the image generator. The prompt should be visually descriptive and under 200 characters. Return them as a JSON array of objects, where each object has "title" and "prompt" keys.`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        prompt: { type: Type.STRING }
                    },
                    required: ["title", "prompt"]
                }
            }
        }
    });

    return JSON.parse(response.text);
};

export const generateCampaignBrief = async (productImage: UploadedFile): Promise<CampaignBrief> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [
            fileToGenerativePart(productImage),
            { text: "Analyze this product image and generate a concise campaign brief. Identify the product name, write a short description, suggest a target audience, list 3-4 key selling points, and describe the brand vibe (e.g., 'Luxurious', 'Playful', 'Minimalist')." }
        ]},
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    productName: { type: Type.STRING },
                    productDescription: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    keySellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    brandVibe: { type: Type.STRING }
                },
                required: ["productName", "productDescription", "targetAudience", "keySellingPoints", "brandVibe"]
            }
        }
    });
    return JSON.parse(response.text);
};


export const describeImageForPrompt = async (image: UploadedFile): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [
            fileToGenerativePart(image),
            { text: "Concisely describe this image in a way that can be appended to an AI image generation prompt. Focus on the style, composition, and key subjects. For example: 'a hyperrealistic shot of a person wearing a red jacket in a neon-lit city street'." }
        ]},
    });
    return response.text;
};

export const generateCampaignInspiration = async (brief: CampaignBrief, highLevelGoal?: string): Promise<CampaignInspiration[]> => {
    let prompt = `You are an expert AI Marketing Strategist. Your task is to generate 3 distinct and creative campaign concepts based on a product brief.\nFor each concept, you must provide a short "hook", a detailed "strategy", a "concept" description, and a vivid visual "artDirection".\n\n`;

    if (highLevelGoal) {
        prompt += `The user has provided a specific high-level goal: "${highLevelGoal}". Your concepts MUST be directly aligned with achieving this goal.\n\n`;
    } else {
        prompt += `The user has NOT provided a specific goal. Therefore, you must act as an autonomous Chief Marketing Officer. Analyze the product and devise a compelling, timely, and relevant campaign strategy from scratch. To do this, consider factors like:\n
- The current season and any upcoming holidays or major cultural events that could provide a relevant theme.
- Potential trending narratives, aesthetics, or social media challenges related to the product's category or its target audience.
- Unique, standout angles that would make the product memorable in a crowded market.
Your concepts should be proactive, creative, and demonstrate expert-level strategic thinking.\n\n`;
    }

    prompt += `Here is the campaign brief:\n
    Product Name: ${brief.productName}
    Description: ${brief.productDescription}
    Target Audience: ${brief.targetAudience}
    Key Selling Points: ${brief.keySellingPoints.join(', ')}
    Brand Vibe: ${brief.brandVibe}\n\n
    Generate the 3 concepts now.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        hook: { type: Type.STRING },
                        strategy: { type: Type.STRING },
                        concept: { type: Type.STRING },
                        artDirection: { type: Type.STRING }
                    },
                    required: ["hook", "strategy", "concept", "artDirection"]
                }
            }
        }
    });

    return JSON.parse(response.text);
};

export const elaborateArtDirection = async (artDirection: string, brief: CampaignBrief): Promise<string> => {
    const prompt = `Elaborate on this art direction to create a detailed and effective prompt for an AI image generator. Incorporate the product details into the prompt.
    
    Art Direction: "${artDirection}"
    Product Name: ${brief.productName}
    Product Description: ${brief.productDescription}
    
    The final prompt should be a single, cohesive paragraph that vividly describes the desired visual, making the "${brief.productName}" the hero of the scene.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};

export const generateUGCScripts = async (brief: CampaignBrief): Promise<UGCScriptIdea[]> => {
    const prompt = `You are an expert UGC (User-Generated Content) scriptwriter. Your task is to generate 3 distinct and engaging UGC script ideas for a social media video based on a product brief.\nFor each concept, you must provide a short, catchy "hook" and a "script" that feels authentic and conversational.\n\nHere is the campaign brief:\n
    Product Name: ${brief.productName}
    Description: ${brief.productDescription}
    Target Audience: ${brief.targetAudience}
    Key Selling Points: ${brief.keySellingPoints.join(', ')}
    Brand Vibe: ${brief.brandVibe}\n\n
    Generate the 3 script ideas now. The script should be written as if a real person is speaking to their camera.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        hook: { type: Type.STRING },
                        script: { type: Type.STRING }
                    },
                    required: ["hook", "script"]
                }
            }
        }
    });

    return JSON.parse(response.text);
};

export const generateSocialProofIdeas = async (brief: CampaignBrief): Promise<SocialProofIdea[]> => {
    const prompt = `You are an expert social media marketer specializing in social proof. Your task is to generate 3 distinct ad concepts based on a product brief that leverage testimonials or reviews.\nFor each concept, provide a "hook" and a short, impactful "review" that feels genuine and highlights a key benefit.\n\nHere is the campaign brief:\n
    Product Name: ${brief.productName}
    Description: ${brief.productDescription}
    Target Audience: ${brief.targetAudience}
    Key Selling Points: ${brief.keySellingPoints.join(', ')}
    Brand Vibe: ${brief.brandVibe}\n\n
    Generate the 3 social proof ideas now. The review should be concise and compelling.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        hook: { type: Type.STRING },
                        review: { type: Type.STRING }
                    },
                    required: ["hook", "review"]
                }
            }
        }
    });

    return JSON.parse(response.text);
};

export const generatePublishingPackage = async (brief: CampaignBrief, prompt: string, highLevelGoal?: string): Promise<PublishingPackage> => {
    const fullPrompt = `Generate a social media publishing package for a new ad visual.
    
    Campaign Brief:
    - Product: ${brief.productName}
    - Description: ${brief.productDescription}
    - Vibe: ${brief.brandVibe}
    
    Visual Description (from prompt): "${prompt}"
    ${highLevelGoal ? `\nUser's High-Level Goal: ${highLevelGoal}` : ''}

    Create content for Instagram, TikTok, YouTube Shorts, and X. The generated copy MUST be highly relevant to the provided brief, visual description, and user goal. The tone should perfectly match the brand vibe.
    - Instagram: A caption and relevant hashtags.
    - TikTok: A caption, relevant hashtags, and a trending audio suggestion.
    - YouTube Shorts: A title, a description (caption), and hashtags.
    - X: A short, punchy caption and hashtags.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    instagram: { 
                        type: Type.OBJECT, 
                        properties: {
                            caption: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["caption", "hashtags"]
                    },
                    tiktok: { 
                        type: Type.OBJECT, 
                        properties: {
                            caption: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                            audioSuggestion: { type: Type.STRING }
                        },
                        required: ["caption", "hashtags", "audioSuggestion"]
                    },
                     youtube: { 
                        type: Type.OBJECT, 
                        properties: {
                            title: { type: Type.STRING },
                            caption: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["title", "caption", "hashtags"]
                    },
                     x: { 
                        type: Type.OBJECT, 
                        properties: {
                            caption: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["caption", "hashtags"]
                    }
                },
                required: ["instagram", "tiktok", "youtube", "x"]
            }
        }
    });

    return JSON.parse(response.text);
}

export const scrapeProductDetailsFromUrl = async (url: string): Promise<ScrapedProductDetails[]> => {
    const prompt = `Your task is to act as an expert web scraper and marketing copywriter. You will be given a URL. You MUST use your search tool to access this URL and extract information about the products on the page.

URL to analyze: ${url}

**Extraction Rules:**
1.  **Product Name:** Prioritize the content of the main \`<h1>\` HTML tag.
2.  **Product Description:** Analyze the page content. Your goal is to create a compelling, summarized description suitable for an ad campaign. Prioritize the \`<meta name="description">\` tag, but if it's too long, generic, or uninspired, you MUST summarize the key features and benefits from the page into a concise and engaging paragraph (2-3 sentences max).
3.  **Image URL:** Prioritize the content of the \`<meta property="og:image">\` tag. The URL must be absolute.
4.  Identify all distinct products on the page.

**Crucial Output Rules:**
- Your entire response MUST be a single, valid JSON array of objects.
- Each object must contain "productName", "productDescription", and "imageUrl".
- Do NOT include any text, explanation, or markdown formatting (like \`\`\`json) before or after the JSON array.
- If the URL is inaccessible, or if no products are found, you MUST return an empty JSON array: [].

**Example:**
If you analyze a page and find one product, your response should be EXACTLY:
[
  {
    "productName": "Example Sneaker",
    "productDescription": "A comfortable and stylish sneaker for everyday wear.",
    "imageUrl": "https://example.com/images/sneaker.jpg"
  }
]
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    
    try {
        let text = response.text.trim();
        
        if (!text) {
            console.warn("Gemini API returned an empty or undefined text response for scrapeProductDetailsFromUrl.");
            return [];
        }
        
        // If response is wrapped in markdown, extract the JSON part.
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            text = jsonMatch[1];
        }

        // The response should be a JSON array. Parse it.
        return JSON.parse(text);

    } catch (e) {
        console.error("Gemini API did not return valid JSON for scrapeProductDetailsFromUrl:", e);
        console.error("Response text was:", response.text);
        // An empty array signals to the caller that no products were found.
        return [];
    }
};

export const fetchScrapedProductImage = async (imageUrl: string, websiteUrl: string, productName: string): Promise<UploadedFile> => {
    try {
        let validBaseUrl = websiteUrl;
        if (!/^https?:\/\//i.test(validBaseUrl)) {
            validBaseUrl = `https://${validBaseUrl}`;
        }
        
        const absoluteImageUrl = new URL(imageUrl, validBaseUrl).href;

        const response = await fetchWithProxies(absoluteImageUrl);
        const blob = await response.blob();

        if (blob.size === 0) {
            throw new Error(`Failed to fetch product image: Empty response received.`);
        }

        const imageName = absoluteImageUrl.substring(absoluteImageUrl.lastIndexOf('/') + 1).split('?')[0] || `${productName.replace(/\s/g, '_')}.jpg`;
        
        return await fileToUploadedFile(blob, imageName);
    } catch (e) {
        console.error("Failed to fetch and process product image:", e);
        throw new Error('Could not download the product image from the provided URL. The image might be protected or the URL is incorrect.');
    }
};

export const regenerateFieldCopy = async (
    brief: CampaignBrief,
    prompt: string,
    platform: string,
    fieldName: 'title' | 'caption' | 'hashtags' | 'audioSuggestion',
    existingValues: string[],
    highLevelGoal?: string,
): Promise<string | string[]> => {
     const regenPrompt = `
        You are an expert social media copywriter. A user is asking for a new variation of some copy.
        
        Original Product: ${brief.productName}
        Original Visual Prompt: ${prompt}
        Platform: ${platform}
        Field to regenerate: ${fieldName}
        ${highLevelGoal ? `User's High-Level Goal: ${highLevelGoal}` : ''}
        Existing values they don't want: ${existingValues.join(', ')}

        Please generate one new, distinct variation for the "${fieldName}" field. It MUST be relevant to the user's goal and product.
        If regenerating hashtags, return a list of strings. Otherwise, return a single string.
    `;
    
    const isHashtags = fieldName === 'hashtags';

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: regenPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: isHashtags
                ? { type: Type.ARRAY, items: { type: Type.STRING } }
                : { type: Type.STRING }
        }
    });
    
    const parsed = JSON.parse(response.text);
    return isHashtags ? (parsed as string[]).map(h => h.replace(/#/g, '')) : parsed;
};

export const extractBrandProfileFromUrl = async (url: string): Promise<Omit<BrandProfile, 'logoFile' | 'websiteUrl' | 'userId'> & { logoUrl?: string }> => {
    const prompt = `
    You are an expert AI Brand Analyst. Your task is to analyze the provided company URL and extract its "Brand DNA" by strictly adhering to the following process. Your primary method MUST be analyzing the website's code (HTML and CSS), not visual interpretation, to ensure accuracy and consistency.

    **URL for Analysis:** ${url}

    **Mandatory Extraction Process:**
    1.  **Analyze CSS:** Use the search tool to locate and inspect the website's CSS. This includes linked stylesheets (\`<link rel="stylesheet">\`) and inline style blocks (\`<style>\`). This step is not optional.
    2.  **Extract Fonts from CSS:**
        *   For the "header" font, find the 'font-family' property applied to \`h1\` or \`h2\` elements.
        *   For the "subHeader" font, find the 'font-family' property for \`h3\` or \`h4\`.
        *   For the "body" font, find the 'font-family' property for \`p\` or \`body\`.
        *   Provide the full font stack (e.g., "Helvetica Neue, Arial, sans-serif").
    3.  **Extract Colors from CSS:**
        *   Prioritize finding declared CSS variables (e.g., --primary-color, --brand-accent).
        *   If variables are not found, identify the most frequently used hex codes for backgrounds, text, and buttons.
        *   Assign these hex codes to logical labels (Primary, Secondary, etc.) based on their usage.
    4.  **Extract Other Information:** Analyze the website's content to determine the business name, mission, values, tone, and aesthetics. Find the direct URL for the main logo image.

    **Output Requirement:**
    After completing the analysis, you MUST return a single, raw JSON object. Do not include any explanatory text, markdown formatting (like \`\`\`json), or any characters before or after the opening and closing curly braces. The JSON object must conform EXACTLY to the following structure:
    {
      "businessName": "The full, official name of the business.",
      "logoUrl": "The direct, absolute URL to the primary logo image found in an <img> tag, typically in the header.",
      "fonts": {
        "header": "The font family stack found in the CSS for h1/h2.",
        "subHeader": "The font family stack found in the CSS for h3/h4.",
        "body": "The primary font family stack found in the CSS for body/p."
      },
      "colors": [
        { "label": "Primary", "hex": "#RRGGBB" },
        { "label": "Secondary", "hex": "#RRGGBB" },
        { "label": "Accent", "hex": "#RRGGBB" },
        { "label": "Neutral (Dark)", "hex": "#RRGGBB" },
        { "label": "Neutral (Light)", "hex": "#RRGGBB" }
      ],
      "missionStatements": [
        "A concise, inspiring statement about the company's purpose and drive.",
        "A second, different statement summarizing the brand's mission.",
        "A third variation of the mission statement."
      ],
      "businessOverview": "A comprehensive overview of the business: what they do, what they sell, their industry, and how their values and mission are reflected in their operations. This should be a detailed paragraph.",
      "toneOfVoice": [
        "A descriptor for the tone of voice (e.g., 'Playful and witty').",
        "Another descriptor (e.g., 'Conversational').",
        "A third descriptor (e.g., 'Enthusiastic')."
      ],
      "brandAesthetics": [
        "A descriptor for the brand's visual look and feel (e.g., 'Minimal and clean').",
        "Another descriptor (e.g., 'Bold and vibrant').",
        "A third descriptor (e.g., 'Rustic and natural')."
      ],
      "brandValues": [
        "A core value (e.g., 'Social Responsibility').",
        "Another core value (e.g., 'Eco-minded Products').",
        "A third core value (e.g., 'Safety and Efficacy')."
      ]
    }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });

    try {
        let text = response.text.trim();
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            text = jsonMatch[1];
        }
        return JSON.parse(text);
    } catch (e) {
        console.error("Gemini API did not return valid JSON for extractBrandProfileFromUrl:", e);
        console.error("Response text was:", response.text);
        throw new Error("Failed to parse brand profile from website. The website might be blocking scrapers or the format is unreadable.");
    }
};

export const fetchWithProxies = async (url: string): Promise<Response> => {
    // 1. Try a direct fetch first
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout for direct fetch
        const response = await fetch(url, { signal: controller.signal, mode: 'cors' });
        clearTimeout(timeoutId);
        if (response.ok) {
            return response;
        }
    } catch (e) {
        if (e instanceof Error && (e.name === 'TypeError' || e.name === 'AbortError')) {
            // This is likely a CORS error or timeout, proceed to proxies.
        } else {
            console.error('Direct fetch failed with an unexpected error:', e);
        }
    }

    // 2. If direct fetch fails, try proxies
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://thingproxy.freeboard.io/fetch/${url}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://cors.eu.org/${url}`
    ];
    
    const PROXY_TIMEOUT = 15000; // Increased timeout to 15 seconds

    for (const proxyUrl of proxies) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);

            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                // Check if the response body is not empty, as some proxies return 200 OK on failure.
                const testBlob = await response.clone().blob();
                if (testBlob.size > 0) {
                    return response;
                }
                console.warn(`Proxy ${proxyUrl} returned an empty response.`);
            } else {
                console.warn(`Proxy ${proxyUrl} failed with status: ${response.statusText}`);
            }
        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') {
                console.warn(`Proxy ${proxyUrl} timed out.`);
            } else {
                console.warn(`Proxy ${proxyUrl} failed to fetch:`, e);
            }
        }
    }

    // 3. If all attempts fail, throw a clear error.
    throw new Error('Failed to fetch the resource through all available proxies.');
};


export const fetchLogo = async (logoUrl: string, websiteUrl: string): Promise<UploadedFile | null> => {
    try {
        // Handle data URIs directly, as they don't require fetching.
        if (logoUrl.startsWith('data:')) {
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const mimeType = logoUrl.substring(logoUrl.indexOf(':') + 1, logoUrl.indexOf(';'));
            const extension = mimeType.split('/')[1] || 'png';
            const logoName = `logo_from_data_uri.${extension}`;
            return await fileToUploadedFile(blob, logoName);
        }
        
        // Ensure the base URL has a protocol.
        let validBaseUrl = websiteUrl;
        if (!/^https?:\/\//i.test(validBaseUrl)) {
            validBaseUrl = `https://${validBaseUrl}`;
        }

        // Handle protocol-relative and relative URLs robustly
        const absoluteLogoUrl = new URL(logoUrl, validBaseUrl).href;
        
        // Use a fetch function with proxy fallbacks to bypass CORS issues
        const response = await fetchWithProxies(absoluteLogoUrl);
        
        const blob = await response.blob();

        if (blob.size === 0) {
            throw new Error(`Failed to fetch logo: Empty response received.`);
        }

        const logoName = absoluteLogoUrl.substring(absoluteLogoUrl.lastIndexOf('/') + 1).split('?')[0] || 'logo.png';

        return await fileToUploadedFile(blob, logoName);
    } catch (e) {
        console.error("Failed to fetch and process logo:", e);
        // Re-throw the specific error from fetchWithProxies if it exists
        if (e instanceof Error && e.message.includes('proxies')) {
             throw e;
        }
        // For other errors like invalid URLs, return null to fail gracefully.
        return null;
    }
};

export const generateUGCVideo = async (project: Project): Promise<UploadedFile> => {
    if (!project.ugcAvatarFile || !project.ugcScript) {
        throw new Error("An avatar and a script are required to generate a UGC video.");
    }

    // --- Build the composite prompt ---
    let prompt = `A UGC-style video of **this person** (referencing the avatar image).`;
    if (project.ugcAvatarDescription) {
        prompt += ` The person should be: **${project.ugcAvatarDescription}**.`;
    }
    prompt += ` The scene is **${project.ugcSceneDescription || 'a neutral, clean background'}**.`;

    if (project.ugcProductFile) {
        prompt += ` The person is holding, presenting, and interacting naturally with **this product** (referencing the product image).`;
    }

    prompt += ` They are looking directly at the camera.`;

    if (project.ugcAction) {
        prompt += ` Their behavior should be: **${project.ugcAction}**.`;
    }
    
    let audioDescription = `They are saying the following script in ${project.ugcLanguage || 'English'}: **"${project.ugcScript}"**.`;
    const voiceCharacteristics = [];
    if (project.ugcVoice && project.ugcVoice !== 'Auto') {
        voiceCharacteristics.push(`a ${project.ugcVoice.toLowerCase()} voice`);
    }
    if (project.ugcEmotion && project.ugcEmotion !== 'Auto') {
        voiceCharacteristics.push(`with a ${project.ugcEmotion.toLowerCase()} emotion`);
    }
    if (project.ugcAccent && project.ugcAccent !== 'American') {
        voiceCharacteristics.push(`in a ${project.ugcAccent.toLowerCase()} accent`);
    }

    if (voiceCharacteristics.length > 0) {
        audioDescription += ` Their delivery should be with ${voiceCharacteristics.join(', ')}.`;
    } else {
        audioDescription += ` Their delivery should be clear and natural.`;
    }
    prompt += ` ${audioDescription}`;
    
    // --- INJECT STYLE INSTRUCTIONS BASED ON TYPE ---
    let styleInstruction = "";
    switch (project.ugcType) {
        case 'green_screen':
            styleInstruction = "Visual Style: The speaker is superimposed over a background image representing the scene description (Green Screen effect). Camera is fixed, focused on the speaker.";
            break;
        case 'podcast':
            styleInstruction = "Visual Style: Professional podcast setup. The speaker is speaking into a large microphone, potentially wearing headphones. Darker, moody studio lighting.";
            break;
        case 'reaction':
            styleInstruction = "Visual Style: Reaction video style. The speaker is reacting to something. Split screen or picture-in-picture composition if appropriate for the scene.";
            break;
        case 'pov':
            styleInstruction = "Visual Style: POV / Vlog style. Handheld camera movement (shaky cam), wide angle selfie lens. Authentic and casual.";
            break;
        case 'unboxing':
             styleInstruction = "Visual Style: Unboxing video. The person is excited, holding the product up close to the camera, showing details.";
             break;
    }
    prompt += ` ${styleInstruction}`;

    prompt += ` The video should feel authentic and engaging.`;

    // --- Prepare reference images ---
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];
    if (project.ugcAvatarFile && project.ugcAvatarFile.base64) {
        referenceImagesPayload.push({
            image: { imageBytes: project.ugcAvatarFile.base64, mimeType: project.ugcAvatarFile.mimeType },
            referenceType: VideoGenerationReferenceType.ASSET,
        });
    }
    if (project.ugcProductFile && project.ugcProductFile.base64) {
        referenceImagesPayload.push({
            image: { imageBytes: project.ugcProductFile.base64, mimeType: project.ugcProductFile.mimeType },
            referenceType: VideoGenerationReferenceType.ASSET,
        });
    }

    // --- Make the API call ---
    const hasMultipleReferences = !!project.ugcProductFile;
    let model = project.videoModel || 'veo-3.1-fast-generate-preview';

    // Override: Multiple references require the 'generate-preview' model for best results.
    if (hasMultipleReferences && model !== 'veo-3.1-generate-preview') {
        model = 'veo-3.1-generate-preview';
    }
        
    let operation = await ai.models.generateVideos({
        model: model,
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            referenceImages: referenceImagesPayload,
            resolution: '720p',
            aspectRatio: project.aspectRatio,
        }
    });

    // This is a long-running operation. In a real app, you might use a webhook or
    // more sophisticated polling. For this context, we'll poll.
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    // Fetch the video blob from the URI
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error("Failed to download the generated video file.");
    }
    const blob = await videoResponse.blob();

    return {
        id: `file_${Date.now()}`,
        blob: blob,
        mimeType: 'video/mp4',
        name: 'ugc_video.mp4',
    };
};

export const validateAvatarImage = async (image: UploadedFile): Promise<boolean> => {
    if (!image.base64) return false;
    const prompt = "Does this image contain a clear, front-facing photo of a single person? The person should be the main subject, and there should be no other people visible. Respond with only 'yes' or 'no'.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [fileToGenerativePart(image), { text: prompt }] },
        });
        const textResponse = response.text.trim().toLowerCase();
        return textResponse.includes('yes');
    } catch (e) {
        console.error("Avatar validation failed:", e);
        return false; // Fail safely
    }
};

export const generateScriptFromTemplate = async (sceneDescription: string, ugcType?: string, productInfo?: { productName: string, productDescription: string }): Promise<string> => {
    let prompt = `You are an expert UGC scriptwriter. Generate a short, engaging, and natural script for a video content creator.\n\nScene: ${sceneDescription}\n`;
    
    if (ugcType) {
        prompt += `Video Style: ${ugcType.replace(/_/g, ' ')}\n`;
    }
    
    if (productInfo?.productName) {
        prompt += `Product: ${productInfo.productName}\nDescription: ${productInfo.productDescription}\n\nThe script should authentically recommend and showcase this product in the given scene. Keep it under 45 seconds spoken.`;
    } else {
        prompt += `The creator is just talking to their audience, sharing a relatable thought or story relevant to this setting. Keep it under 30 seconds spoken.`;
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
};

export const suggestAvatarFromContext = async (sceneDescription: string, productInfo?: { productName: string, productDescription: string }): Promise<string> => {
     const prompt = `Suggest a visual description for an AI avatar character that would fit perfectly in this scene and (optionally) promoting this product.\n\nScene: ${sceneDescription}\n${productInfo ? `Product: ${productInfo.productName}` : ''}\n\nRespond with a single, concise paragraph describing the person's appearance, age, clothing, and vibe.`;
     
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
};