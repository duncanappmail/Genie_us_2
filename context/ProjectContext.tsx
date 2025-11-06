import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GoogleGenAI, GenerateContentResponse, Modality, Type, FunctionDeclaration } from '@google/genai';
import { CREDIT_COSTS } from '../App';
import type { Project, CreativeMode, UploadedFile, Template, PublishingPackage, CampaignBrief } from '../types';
import * as dbService from '../services/dbService';
import * as geminiService from '../services/geminiService';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';

type ProjectContextType = {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    loadProjects: (userId: string) => Promise<void>;
    currentProject: Project | null;
    setCurrentProject: (project: Project | null) => void;
    projectToDelete: Project | null;
    setProjectToDelete: (project: Project | null) => void;
    isRegenerating: 'image' | 'video' | null;
    isAnimating: number | null;
    isRefining: boolean;
    templateToApply: Template | null;
    selectTemplate: (template: Template) => void;
    applyPendingTemplate: (project: Project) => void;
    startNewProject: (mode: CreativeMode) => void;
    handleGenerate: () => Promise<void>;
    handleRegenerate: (type: 'image' | 'video') => Promise<void>;
    handleAnimate: (imageIndex: number) => Promise<void>;
    handleRefine: (imageIndex: number, refinePrompt: string) => Promise<void>;
    handleConfirmDelete: () => Promise<void>;
    handleConfirmExtend: (prompt: string) => Promise<void>;
    runAgent: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const fileToUploadedFile = async (file: File | Blob, name: string): Promise<UploadedFile> => {
    const reader = new FileReader();
    const blob = file;
    return new Promise((resolve) => {
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64 = (reader.result as string)?.split(',')[1];
            resolve({
                id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                base64,
                mimeType: file.type || 'application/octet-stream',
                name,
                blob,
            });
        };
    });
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<'image' | 'video' | null>(null);
    const [isAnimating, setIsAnimating] = useState<number | null>(null);
    const [isRefining, setIsRefining] = useState(false);
    const [templateToApply, setTemplateToApply] = useState<Template | null>(null);

    const { user, deductCredits } = useAuth();
    const { 
        navigateTo, setIsLoading, setError, 
        setIsExtendModalOpen, setAgentStatusMessages, setGenerationStatusMessages
    } = useUI();

    const loadProjects = useCallback(async (userId: string) => {
        const userProjects = await dbService.getProjectsForUser(userId);
        setProjects(userProjects);
    }, []);

    const startNewProject = useCallback((mode: CreativeMode) => {
        if (!user) return;
        
        setTemplateToApply(null);

        const newProject: Project = {
            id: `proj_${Date.now()}`, userId: user.email, createdAt: Date.now(), mode, prompt: '', productFile: null,
            productName: '', productDescription: '', campaignBrief: null, generatedImages: [], generatedVideos: [],
            aspectRatio: mode === 'Create a UGC Video' ? '9:16' : '1:1',
            batchSize: 1, stylePreset: null, useCinematicQuality: false, negativePrompt: '',
            referenceFiles: [], publishingPackage: null, ugcScript: '', ugcAction: '', ugcVoice: 'Auto',
            ugcEmotion: 'Auto', ugcLanguage: 'English', ugcSceneDescription: '', ugcAvatarFile: null, ugcProductFile: null,
        };
        setCurrentProject(newProject);
        if (mode === 'AI Agent') navigateTo('AGENT');
        else if (mode === 'Create a UGC Video') navigateTo('UGC_GENERATE');
        else navigateTo('GENERATE');
    }, [user, navigateTo]);
    
    const handleConfirmDelete = useCallback(async () => {
        if (projectToDelete) {
            await dbService.deleteProject(projectToDelete.id);
            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
            setProjectToDelete(null);
        }
    }, [projectToDelete]);
    
    const selectTemplate = useCallback((template: Template) => {
        if (!user) return;
        const mode = template.type === 'video' ? 'Video Maker' : 'Product Ad';
        startNewProject(mode);
        setTemplateToApply(template);
    }, [user, startNewProject]);

    const applyPendingTemplate = useCallback((project: Project) => {
        if (templateToApply && project.campaignBrief) {
            let prompt = templateToApply.promptTemplate;
            prompt = prompt.replace('{{PRODUCT_NAME}}', project.campaignBrief.productName);
            prompt = prompt.replace('{{BRAND_VIBE}}', project.campaignBrief.brandVibe);
            prompt = prompt.replace('{{TARGET_AUDIENCE}}', project.campaignBrief.targetAudience);
            
            setCurrentProject({ ...project, prompt });
            setTemplateToApply(null);
        } else {
             setCurrentProject(project);
        }
    }, [templateToApply]);

    const handleGenerate = useCallback(async () => {
        if (!currentProject || !user || !user.credits) return;

        const cost = {
            'Product Ad': CREDIT_COSTS.productAd * currentProject.batchSize,
            'Art Maker': CREDIT_COSTS.artMaker * currentProject.batchSize,
            'Video Maker': currentProject.useCinematicQuality ? CREDIT_COSTS.videoCinematic : CREDIT_COSTS.videoFast,
            'Create a UGC Video': CREDIT_COSTS.ugcVideo,
            'AI Agent': CREDIT_COSTS.agent,
        }[currentProject.mode];

        if (user.credits.current < cost) {
            setError("Not enough credits.");
            return;
        }

        setIsLoading(true);
        setGenerationStatusMessages([]);
        setError(null);

        try {
            deductCredits(cost);
            let updatedProject = { ...currentProject };
            
            const addMsg = (msg: string, isDone = false) => setGenerationStatusMessages(prev => {
                if (isDone) {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs.pop();
                    return [...newMsgs, `✅ ${lastMsg}`];
                }
                return [...prev, msg];
            });

            addMsg("Preparing your vision...");
            // Simulate brief prep time
            await new Promise(res => setTimeout(res, 300));
            addMsg("Preparing your vision...", true);
            addMsg("Conjuring your assets...");

            if (currentProject.mode === 'Create a UGC Video') {
                const newVideo = await geminiService.generateUGCVideo(currentProject);
                updatedProject.generatedVideos = [...updatedProject.generatedVideos, newVideo];
            } else if (currentProject.mode === 'Video Maker') {
                // Mock Video Maker
                await new Promise(res => setTimeout(res, 5000));
                const newVideo: UploadedFile = { id: `file_${Date.now()}`, mimeType: 'video/mp4', name: 'video.mp4', blob: new Blob() };
                updatedProject.generatedVideos = [...updatedProject.generatedVideos, newVideo];
            } else { // Art Maker or Product Ad
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                let newImages: UploadedFile[] = [];

                if (currentProject.productFile && currentProject.productFile.base64) {
                    const imagePart = { inlineData: { data: currentProject.productFile.base64, mimeType: currentProject.productFile.mimeType } };
                    const textPart = { text: currentProject.prompt };

                    for (let i = 0; i < currentProject.batchSize; i++) {
                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash-image',
                            contents: { parts: [imagePart, textPart] },
                            config: { responseModalities: [Modality.IMAGE] },
                        });
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) {
                                const blob = await (await fetch(`data:image/png;base64,${part.inlineData.data}`)).blob();
                                newImages.push(await fileToUploadedFile(blob, `generated_image_${i}.png`));
                            }
                        }
                    }
                } else {
                    const response = await ai.models.generateImages({
                        model: 'imagen-4.0-generate-001',
                        prompt: currentProject.prompt,
                        config: { numberOfImages: currentProject.batchSize, aspectRatio: currentProject.aspectRatio },
                    });
                    newImages = await Promise.all(
                        response.generatedImages.map(async (img) => {
                            const blob = await (await fetch(`data:image/png;base64,${img.image.imageBytes}`)).blob();
                            return fileToUploadedFile(blob, 'generated_image.png');
                        })
                    );
                }
                updatedProject.generatedImages = [...updatedProject.generatedImages, ...newImages];
            }
            
            addMsg("Conjuring your assets...", true);
            
            let briefForCopy: CampaignBrief | null = updatedProject.campaignBrief;
            const promptForCopy = updatedProject.prompt || updatedProject.ugcScript || "A creative visual";
            if (!briefForCopy && promptForCopy) {
                briefForCopy = {
                    productName: updatedProject.mode,
                    productDescription: promptForCopy,
                    targetAudience: 'a general audience',
                    keySellingPoints: ['visually stunning', 'creative', 'unique'],
                    brandVibe: 'modern',
                };
                updatedProject.campaignBrief = briefForCopy;
            }
            
            if (briefForCopy) {
                addMsg("Writing social media copy...");
                try {
                    const pkg = await geminiService.generatePublishingPackage(briefForCopy, promptForCopy, updatedProject.highLevelGoal);
                    updatedProject.publishingPackage = pkg;
                    addMsg("Writing social media copy...", true);
                } catch (copyError) {
                    console.warn("Failed to generate social media copy, but visual generation succeeded.", copyError);
                    addMsg("Writing social media copy...", true); // Mark as done even if it fails
                }
            }
            
            setCurrentProject(updatedProject);
            await dbService.saveProject(updatedProject);
            await loadProjects(user.email);
            navigateTo('PREVIEW');

        } catch (e: any) {
            setError(e.message || "Generation failed.");
        } finally {
            setIsLoading(false);
            setGenerationStatusMessages([]);
        }
    }, [currentProject, user, navigateTo, deductCredits, setError, setIsLoading, setGenerationStatusMessages, loadProjects]);

    const handleRegenerate = useCallback(async (type: 'image' | 'video') => {
        if (!currentProject || !user || !user.credits) return;
    
        if (type === 'image') {
            const cost = currentProject.mode === 'Product Ad' ? CREDIT_COSTS.productAd : CREDIT_COSTS.artMaker;
            if (user.credits.current < cost) {
                setError("Not enough credits to regenerate.");
                return;
            }
    
            setIsRegenerating('image');
            setError(null);
            
            try {
                deductCredits(cost);
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                let newImage: UploadedFile | null = null;
    
                if (currentProject.productFile && currentProject.productFile.base64) {
                    // Multimodal regeneration for projects with a source product image
                    const imagePart = {
                        inlineData: {
                            data: currentProject.productFile.base64,
                            mimeType: currentProject.productFile.mimeType,
                        },
                    };
                    const textPart = { text: currentProject.prompt };
    
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [imagePart, textPart] },
                        config: {
                            responseModalities: [Modality.IMAGE],
                        },
                    });
    
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            const base64 = part.inlineData.data;
                            const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
                            newImage = await fileToUploadedFile(blob, `regenerated_image.png`);
                            break;
                        }
                    }
                } else {
                    // Standard text-to-image regeneration
                    const response = await ai.models.generateImages({
                        model: 'imagen-4.0-generate-001',
                        prompt: currentProject.prompt,
                        config: {
                            numberOfImages: 1,
                            aspectRatio: currentProject.aspectRatio
                        }
                    });
    
                    const img = response.generatedImages[0];
                    const base64 = img.image.imageBytes;
                    const blob = await(await fetch(`data:image/png;base64,${base64}`)).blob();
                    newImage = await fileToUploadedFile(blob, 'regenerated_image.png');
                }
    
                if (newImage) {
                    const updatedProject = {
                        ...currentProject,
                        generatedImages: [...currentProject.generatedImages, newImage]
                    };
                    
                    setCurrentProject(updatedProject);
                    await dbService.saveProject(updatedProject);
                    await loadProjects(user.email);
                } else {
                    throw new Error("Regeneration did not produce an image.");
                }
    
            } catch (e: any) {
                setError(e.message || "Regeneration failed.");
            } finally {
                setIsRegenerating(null);
            }
        }
        // TODO: Implement video regeneration if needed
    }, [currentProject, user, deductCredits, setError, loadProjects]);

    const handleAnimate = useCallback(async (imageIndex: number) => {}, []);
    const handleRefine = useCallback(async (imageIndex: number, refinePrompt: string) => {}, []);
    
    const handleConfirmExtend = useCallback(async (prompt: string) => {
        if (!currentProject || !user || !user.credits) return;
        const cost = CREDIT_COSTS.videoExtend;
        if (user.credits.current < cost) {
            setError("Not enough credits to extend video.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setIsExtendModalOpen(false);

        try {
            deductCredits(cost);
            // In a real app, you would make an API call to extend the video
            setGenerationStatusMessages(['Extending your video...']);
            await new Promise(res => setTimeout(res, 3000)); // Simulate API call
            
            const newVideo: UploadedFile = {
                 id: `file_${Date.now()}`,
                 mimeType: 'video/mp4',
                 name: 'extended_video.mp4',
                 blob: new Blob([]), // Placeholder
            };
            
            const updatedProject = { ...currentProject, generatedVideos: [...currentProject.generatedVideos, newVideo], prompt: '' };
            setCurrentProject(updatedProject);
            await dbService.saveProject(updatedProject);
            await loadProjects(user.email);
            navigateTo('PREVIEW');
        } catch (e: any) {
            setError(e.message || 'Failed to extend video.');
        } finally {
            setIsLoading(false);
            setGenerationStatusMessages([]);
        }
    }, [currentProject, user, deductCredits, setError, setIsLoading, setIsExtendModalOpen, navigateTo, loadProjects]);

    const runAgent = useCallback(async () => {
        if (!currentProject || !user || !user.credits || !currentProject.productFile) return;
        const cost = CREDIT_COSTS.agent;
        if (user.credits.current < cost) { setError("Not enough credits to run the agent."); return; }

        setIsLoading(true);
        setError(null);
        setAgentStatusMessages([]);

        try {
            deductCredits(cost);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const tools: FunctionDeclaration[] = [
                {
                    name: "generateCampaignBrief",
                    description: "Analyzes a product image to create a marketing brief.",
                    parameters: { type: Type.OBJECT, properties: {} } // Image is handled separately
                },
                {
                    name: "generateCampaignInspiration",
                    description: "Generates 3 distinct campaign concepts based on a brief.",
                    parameters: { type: Type.OBJECT, properties: { brief: { type: Type.OBJECT }, highLevelGoal: { type: Type.STRING, nullable: true } } }
                },
                {
                    name: "elaborateArtDirection",
                    description: "Expands a simple art direction into a detailed image prompt.",
                    parameters: { type: Type.OBJECT, properties: { artDirection: { type: Type.STRING }, brief: { type: Type.OBJECT } } }
                },
                {
                    name: "generateFinalVisual",
                    description: "Generates the final visual asset for the campaign.",
                    parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } } } // Image handled separately
                },
                {
                    name: "generatePublishingPackage",
                    description: "Writes all social media copy for the campaign.",
                    parameters: { type: Type.OBJECT, properties: { brief: { type: Type.OBJECT }, prompt: { type: Type.STRING }, highLevelGoal: { type: Type.STRING, nullable: true } } }
                }
            ];

            const chat = ai.chats.create({
                model: 'gemini-2.5-pro',
                config: {
                    systemInstruction: `You are an expert AI Marketing Agent. Your goal is to create a complete campaign for the user's product. 
                    Analyze the user's request, form a plan, and use the available functions to execute it step-by-step.
                    You must call the functions in a logical order. First, analyze the product to get a brief. Then, generate inspiration. Then, elaborate the art direction. Then, generate the visual. Finally, write the copy.
                    When you have the final publishing package, your job is done. Respond with a summary of the campaign strategy and a confirmation message.`,
                },
            });
            
            const addMsg = (type: 'thought' | 'action' | 'result' | 'done', content: string) => {
                setAgentStatusMessages(prev => [...prev, { type, content }]);
            };

            const initialPrompt = `My product is in the attached image. My high-level goal is: "${currentProject.highLevelGoal || ' autonomously create the best campaign you see fit'}". Please begin.`;
            
            let response = await chat.sendMessage({
                message: initialPrompt,
                history: [],
                config: { tools: [{ functionDeclarations: tools }] },
                files: [{
                    name: 'product.jpg',
                    mimeType: currentProject.productFile.mimeType,
                    uri: `data:${currentProject.productFile.mimeType};base64,${currentProject.productFile.base64}`
                }]
            });
            
            let agentState: Partial<Project> = { ...currentProject };
            let finalImage: UploadedFile | null = null;

            while(response.functionCalls && response.functionCalls.length > 0) {
                const fc = response.functionCalls[0];
                addMsg('action', `Executing: ${fc.name}...`);

                let result;
                if (fc.name === 'generateCampaignBrief') {
                    result = await geminiService.generateCampaignBrief(currentProject.productFile);
                    agentState.campaignBrief = result;
                } else if (fc.name === 'generateCampaignInspiration' && agentState.campaignBrief) {
                    const inspirations = await geminiService.generateCampaignInspiration(agentState.campaignBrief, currentProject.highLevelGoal);
                    result = inspirations[0]; // Agent will autonomously use the first/best one
                    agentState.campaignInspiration = result;
                    agentState.campaignStrategy = result.strategy;
                } else if (fc.name === 'elaborateArtDirection' && agentState.campaignInspiration && agentState.campaignBrief) {
                    result = await geminiService.elaborateArtDirection(agentState.campaignInspiration.artDirection, agentState.campaignBrief);
                    agentState.prompt = result;
                } else if (fc.name === 'generateFinalVisual' && agentState.prompt) {
                    const imageResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [
                            { inlineData: { data: currentProject.productFile.base64!, mimeType: currentProject.productFile.mimeType } },
                            { text: agentState.prompt }
                        ] },
                        config: { responseModalities: [Modality.IMAGE] },
                    });
                    let base64 = ''; for (const part of imageResponse.candidates[0].content.parts) if (part.inlineData) { base64 = part.inlineData.data; break; }
                    if (!base64) throw new Error("Agent failed to generate visual.");
                    const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();
                    finalImage = await fileToUploadedFile(blob, 'agent_image.jpg');
                    result = { success: true, imageId: finalImage.id };
                    agentState.generatedImages = [finalImage];
                } else if (fc.name === 'generatePublishingPackage' && agentState.campaignBrief && agentState.prompt) {
                    result = await geminiService.generatePublishingPackage(agentState.campaignBrief, agentState.prompt, currentProject.highLevelGoal);
                    agentState.publishingPackage = result;
                } else {
                    result = { error: `Function ${fc.name} not found or required data is missing.` };
                }

                addMsg('result', `Result: ${JSON.stringify(result).substring(0, 100)}...`);

                response = await chat.sendMessage({
                    message: '',
                    toolResponses: [{
                        id: fc.id,
                        name: fc.name,
                        response: result
                    }],
                    config: { tools: [{ functionDeclarations: tools }] }
                });
            }
            
            addMsg('done', `Campaign generation complete!`);
            const finalProjectState = { ...currentProject, ...agentState };
            setCurrentProject(finalProjectState);
            await dbService.saveProject(finalProjectState);
            await loadProjects(user.email);
            navigateTo('AGENT_RESULT');

        } catch (e: any) {
            setError(e.message || "The AI Agent failed to complete its task.");
        } finally {
            setIsLoading(false);
            // setAgentStatusMessages([]); // Keep messages for result screen
        }
    }, [currentProject, user, deductCredits, setError, setIsLoading, setAgentStatusMessages, navigateTo, loadProjects]);


    const value: ProjectContextType = {
        projects, setProjects, loadProjects, currentProject, setCurrentProject, projectToDelete, setProjectToDelete,
        isRegenerating, isAnimating, isRefining, templateToApply, selectTemplate, applyPendingTemplate,
        startNewProject, handleGenerate, handleRegenerate, handleAnimate, handleRefine,
        handleConfirmDelete, handleConfirmExtend, runAgent
    };

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
};