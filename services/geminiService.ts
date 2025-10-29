import { GoogleGenAI, Type, VideoGenerationReferenceImage, VideoGenerationReferenceType, GenerateContentResponse, Modality } from "@google/genai";
import type { UploadedFile, CampaignBrief, CampaignInspiration, AdCopy, ScrapedProductDetails, PublishingPackage, PlatformPublishingContent, Project } from '../types';

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

export const generatePromptSuggestions = async (mode: string, productInfo?: { productName: string, productDescription: string }): Promise<string[]> => {
    let prompt: string;

    if (mode === 'Product Ad' && productInfo?.productName) {
        prompt = `Generate 3 diverse and creative image generation prompts for our AI image generator. The prompts should be suitable for creating an advertisement for this product: "${productInfo.productName}". Description: "${productInfo.productDescription}". The prompts should be concise, visually descriptive, and under 200 characters each. Return them as a JSON array of strings.`;
    } else if (mode === 'Video Maker') {
        prompt = `Generate 3 diverse and creative video generation prompts. The prompts should describe trendy, cool, or potentially viral video concepts. Focus on dynamic scenes, interesting camera movements, and engaging subjects. They should be concise, visually descriptive, and under 200 characters each. Return them as a JSON array of strings.`;
    } else { // Default to Art Maker
        prompt = `Generate 3 diverse and creative image generation prompts for our AI image generator. The prompts should be for creating artistic scenes or abstract concepts. They should be concise, visually descriptive, and under 200 characters each. Return them as a JSON array of strings.`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
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
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `I will provide a URL. Please act as a web scraper and extract the product name and a concise product description for all products listed on that page. URL: ${url}. Respond with only a JSON array of objects, each with "productName" and "productDescription" keys.`,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    
    try {
        let text = response.text.trim();
        const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            text = jsonMatch[1];
        }
        return JSON.parse(text);
    } catch (e) {
        console.error("Gemini API did not return valid JSON for scrapeProductDetailsFromUrl:", e);
        console.error("Response text was:", response.text);
        // The calling code handles an empty array as "no products found".
        return [];
    }
};


export const visualizeScrapedProduct = async (product: ScrapedProductDetails): Promise<UploadedFile> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Create a clean, professional product image of "${product.productName}". The product should be on a plain white background with studio lighting. The image should be photorealistic and suitable for e-commerce.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    const base64 = response.generatedImages[0].image.imageBytes;
    const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();

    return {
        id: `file_${Date.now()}`,
        base64,
        mimeType: 'image/jpeg',
        name: `${product.productName.replace(/\s/g, '_')}.jpg`,
        blob,
    };
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

export const generateUGCVideo = async (project: Project): Promise<UploadedFile> => {
    if (!project.ugcAvatarFile || !project.ugcScript) {
        throw new Error("An avatar and a script are required to generate a UGC video.");
    }

    // --- Build the composite prompt ---
    let prompt = `A UGC-style video of **this person** (referencing the avatar image).`;
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
    // When a product image is included, there are multiple reference images (avatar + product).
    // This requires the 'veo-3.1-generate-preview' model for best results.
    const hasMultipleReferences = !!project.ugcProductFile;
    const model = hasMultipleReferences || project.useCinematicQuality
        ? 'veo-3.1-generate-preview'
        : 'veo-3.1-fast-generate-preview';
        
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