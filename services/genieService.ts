import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import type { Project, BrandProfile, UploadedFile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GENIE_SYSTEM_INSTRUCTION = `
You are "Genie", an expert AI Creative Director and Marketing Co-pilot for the GenieUs platform.
Your goal is to help the user create stunning marketing assets (images, videos, ads) and campaigns.

**Your Personality:**
- Creative, enthusiastic, and encouraging.
- Strategic: You don't just make things; you ask *why* and who the audience is.
- Proactive: Suggest ideas if the user is stuck.
- Brief: Keep responses concise and conversational. Break up paragraphs for readability.

**Rich UI Capabilities (IMPORTANT):**
You can render interactive elements in the chat. To do this, output a JSON block hidden inside a special delimiter at the end of your message.
Delimiter: \`:::GENIE_UI_JSON { ... } :::\`

**Supported UI Types:**
1. **Selectable Cards ("idea-cards"):** Use this when offering distinct choices (e.g., style directions, script angles).
   JSON Format:
   \`\`\`json
   {
     "type": "idea-cards",
     "data": [
       { "title": "Bold & Modern", "description": "High contrast, neon vibes.", "value": "I choose Bold & Modern" },
       { "title": "Soft & Minimal", "description": "Pastel colors, clean lines.", "value": "I choose Soft & Minimal" }
     ]
   }
   \`\`\`

**Your Context:**
You have access to the user's current project state.
- If they are on the "Home" screen, guide them to a tool.
- If they are in "Generator", help them refine their prompt or settings.
- If they are in "Preview", help them critique or repurpose the asset.

**Capabilities (simulated via text responses for now, handled by app logic):**
1. Brainstorming: Generate creative angles.
2. Copywriting: Write captions or scripts.
3. Critique: Analyze their current prompt/image choices.

**Format:**
- Use markdown for formatting (headers, bold text).
- Keep paragraphs short.
`;

export const createGenieSession = (modelName: string = 'gemini-2.5-flash'): Chat => {
    return ai.chats.create({
        model: modelName,
        config: {
            systemInstruction: GENIE_SYSTEM_INSTRUCTION,
            temperature: 0.8, // Slightly creative
        },
        history: [
            {
                role: 'user',
                parts: [{ text: "Hello Genie! I'm ready to create." }]
            },
            {
                role: 'model',
                parts: [{ text: "Hello! I am your creative co-pilot. What are we building today? A product ad, a video, or maybe refining your brand DNA?" }]
            }
        ]
    });
};

export const generateGenieResponse = async (
    chat: Chat, 
    userMessage: string, 
    appContext: { 
        screen: string, 
        project?: Project | null,
        brandProfile?: BrandProfile | null
    },
    attachments: UploadedFile[] = []
): Promise<string> => {
    // Inject context invisibly
    let contextString = `[Current Context - Screen: ${appContext.screen}]`;
    
    if (appContext.project) {
        contextString += `\n[Active Project Mode: ${appContext.project.mode}]`;
        if (appContext.project.productName) {
            contextString += `\n[Product: ${appContext.project.productName}]`;
        }
        if (appContext.project.prompt) {
            contextString += `\n[Current Prompt: "${appContext.project.prompt}"]`;
        }
    }
    
    if (appContext.brandProfile) {
        contextString += `\n[Brand Tone: ${appContext.brandProfile.toneOfVoice.join(', ')}]`;
    }

    const fullMessageText = `${contextString}\n\nUser says: ${userMessage}`;
    
    let messageContent: any;

    if (attachments.length > 0) {
        const parts: any[] = [];
        // Add text part
        parts.push({ text: fullMessageText });
        // Add image parts
        for (const file of attachments) {
            if (file.base64) {
                 parts.push({
                    inlineData: {
                        mimeType: file.mimeType,
                        data: file.base64
                    }
                });
            }
        }
        messageContent = parts;
    } else {
        messageContent = fullMessageText;
    }
    
    try {
        const response: GenerateContentResponse = await chat.sendMessage({ message: messageContent });
        return response.text || "I'm having trouble connecting to my creative source right now. Try again?";
    } catch (e) {
        console.error("Genie Chat Error:", e);
        return "My lamp is a bit dusty (Network Error). Please try again.";
    }
};