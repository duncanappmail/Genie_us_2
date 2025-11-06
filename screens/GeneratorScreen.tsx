import React, { useState, useRef, useEffect } from 'react';
import type { Project, UploadedFile, CampaignBrief } from '../types';
import { Uploader } from '../components/Uploader';
import { PromptExamplesModal } from '../components/PromptExamplesModal';
import { CampaignInspirationModal } from '../components/CampaignInspirationModal';
import { AssetPreview } from '../components/AssetPreview';
import { GenericSelect } from '../components/GenericSelect';
import { AdvancedVideoSettings } from '../components/AdvancedVideoSettings';
import { generateCampaignBrief, describeImageForPrompt } from '../services/geminiService';
import { AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon, MagnifyingGlassIcon, PlusIcon, SparklesIcon, XMarkIcon } from '../components/icons';
import { CREDIT_COSTS } from '../App';
import { ProductScraper } from '../components/ProductScraper';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';

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
                mimeType: file.type,
                // Fix: Use the `name` parameter instead of `file.name` as Blob does not have a `name` property.
                name: name,
                blob: blob,
            });
        };
    });
};

export const GeneratorScreen: React.FC = () => {
    const { user } = useAuth();
    const {
        isLoading,
        error,
        setError,
        navigateTo,
        setIsLoading,
        setGenerationStatusMessages,
    } = useUI();
    const {
        currentProject: project,
        setCurrentProject: setProject,
        handleGenerate: onGenerate,
        templateToApply,
        applyPendingTemplate,
    } = useProjects();

    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDescribing, setIsDescribing] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!project || !user) {
        // Or a loading state/redirect
        return <div className="text-center p-8">Error: No active project or user.</div>;
    }

    const plan = user.subscription!.plan;

    const subtitles = {
        'Product Ad': 'Drop your product into any scene — instantly ad-ready.',
        'Art Maker': 'Turn ideas into beautiful visuals',
        'Video Maker': 'Make your next viral video — or animate your image in seconds'
    };
    const extendSubtitle = 'Describe what should happen next in your scene.';

    const updateProject = (updates: Partial<Project>) => {
        setProject({ ...project, ...updates });
    };

    useEffect(() => {
        if (project.mode === 'Video Maker' && !['16:9', '9:16'].includes(project.aspectRatio)) {
            updateProject({ aspectRatio: '16:9' });
        }
    }, [project.mode]);

    const handleFileUpload = async (uploadedFile: UploadedFile) => {
        if (project.mode === 'Product Ad') {
            setIsAnalyzing(true);
            setError(null);
            try {
                const campaignBrief = await generateCampaignBrief(uploadedFile);
                const updatedProject = { 
                    ...project,
                    productFile: uploadedFile, 
                    productName: campaignBrief.productName, 
                    productDescription: campaignBrief.productDescription,
                    campaignBrief,
                };
                applyPendingTemplate(updatedProject);
            } catch (e: any) {
                console.error("Failed to analyze product image", e);
                setError(e.message || "Failed to analyze product image.");
                updateProject({ productFile: uploadedFile });
            } finally {
                setIsAnalyzing(false);
            }
        } else {
            updateProject({ productFile: uploadedFile });
        }
    };
    
    const handleReferenceFileUpload = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).slice(0, 4 - project.referenceFiles.length);
        Promise.all(newFiles.map(file => fileToUploadedFile(file, file.name))).then(uploadedFiles => {
            updateProject({ referenceFiles: [...project.referenceFiles, ...uploadedFiles] });
        });
    };

    const handleDescribeImage = async (index: number) => {
        const fileToDescribe = project.referenceFiles[index];
        if (!fileToDescribe) return;
        setIsDescribing(index);
        setError(null);
        try {
            const description = await describeImageForPrompt(fileToDescribe);
            updateProject({ prompt: project.prompt ? `${project.prompt}, ${description}` : description });
        } catch (e: any) {
            console.error("Failed to describe image", e);
            setError(e.message || "Failed to describe image.");
        } finally {
            setIsDescribing(null);
        }
    };
    
    const calculateCost = (): number => {
        if (project.videoToExtend) return CREDIT_COSTS.videoExtend;
        switch (project.mode) {
            case 'Product Ad': return CREDIT_COSTS.productAd * project.batchSize;
            case 'Art Maker': return CREDIT_COSTS.artMaker * project.batchSize;
            case 'Video Maker': return project.useCinematicQuality ? CREDIT_COSTS.videoCinematic : CREDIT_COSTS.videoFast;
            default: return 0;
        }
    };
    
    const cost = calculateCost();
    const hasEnoughCredits = (user.credits?.current ?? 0) >= cost;
    const isGenerateDisabled = isLoading || (!project.prompt && !project.productFile && project.referenceFiles.length === 0) || !hasEnoughCredits;
    const generateButtonText = project.videoToExtend ? `Extend Video (${cost} Credits)` : `Generate (${cost} Credits)`;

    const allAspectRatios: { value: Project['aspectRatio']; label: string; icon: React.ReactNode }[] = [
        { value: '16:9', label: '16:9', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
        { value: '9:16', label: '9:16', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
        { value: '1:1', label: '1:1', icon: <AspectRatioSquareIcon className="w-5 h-5" /> },
        { value: '4:3', label: '4:3', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
        { value: '3:4', label: '3:4', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
    ];

    const aspectRatios = project.mode === 'Video Maker'
        ? allAspectRatios.filter(r => r.value === '16:9' || r.value === '9:16')
        : allAspectRatios;
    
    const isAspectRatioLocked = project.mode === 'Product Ad' && project.productFile !== null;
    
    useEffect(() => {
        if (isAspectRatioLocked) {
            updateProject({ aspectRatio: '1:1' });
        }
    }, [isAspectRatioLocked]);

    const maxBatchSize = 4;
    const batchSizeOptions = Array.from({ length: maxBatchSize }, (_, i) => i + 1).map(n => ({
        value: n,
        label: `${n} Image${n > 1 ? 's' : ''}`,
    }));

    const stylePresets = {
        "Cinematic": "cinematic lighting, epic composition, high detail, 8k, photorealistic",
        "Vintage": "vintage photo, grainy film, retro aesthetic, 1970s",
        "Minimalist": "minimalist, clean background, simple, studio lighting",
        "Anime": "anime style, vibrant colors, detailed characters, manga aesthetic",
        "Fantasy Art": "fantasy art, epic, detailed, magical, D&D",
        "Sci-Fi": "sci-fi, futuristic, cyberpunk, neon lights, advanced technology"
    };
    const stylePresetOptions = [
        { value: 'None', label: 'None' },
        ...Object.keys(stylePresets).map(name => ({ value: name, label: name }))
    ];

    const handleProductScraped = (data: { name: string; description: string; file: UploadedFile; }) => {
        // A full campaign brief isn't generated from scraping, so create a minimal one.
        const minimalBrief: CampaignBrief = {
            productName: data.name,
            productDescription: data.description,
            targetAudience: '', // User can provide more context if needed
            keySellingPoints: [],
            brandVibe: 'Neutral',
        };
        const updatedProject = {
            ...project,
            productFile: data.file,
            productName: data.name,
            productDescription: data.description,
            campaignBrief: minimalBrief,
        };
        applyPendingTemplate(updatedProject);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                 <h2 className="text-3xl font-bold">{
                    project.videoToExtend ? 'Extend Your Video' :
                    project.mode === 'Product Ad' ? 'Create a Product Ad' :
                    project.mode === 'Art Maker' ? 'Create with Art Maker' : 'Create a Video'
                 }</h2>
                 <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {project.videoToExtend ? extendSubtitle : subtitles[project.mode]}
                 </p>
            </div>
            
            {templateToApply && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-center dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-500/30">
                    Upload a product image to apply the <strong>"{templateToApply.title}"</strong> template.
                </div>
            )}

            {project.mode === 'Product Ad' && !project.videoToExtend && (
                <>
                    <ProductScraper
                        onProductScraped={handleProductScraped}
                        setIsLoading={setIsLoading}
                        setStatusMessages={setGenerationStatusMessages}
                        setError={setError}
                    />
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                        <div className="relative flex justify-center text-sm"><span className="bg-slate-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                    </div>
                    <div className="mb-6">
                        <label className="font-semibold block mb-2">Upload Product Image</label>
                        {project.productFile ? (
                            <div className="relative w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <AssetPreview asset={project.productFile} />
                                <button onClick={() => updateProject({ productFile: null, productName: '', productDescription: '', campaignBrief: null })} className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 rounded-full p-1 shadow-md">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Uploader onUpload={handleFileUpload} />
                        )}
                    </div>
                </>
            )}
            
            <div className="space-y-6">
                {project.mode === 'Product Ad' && !project.videoToExtend && (
                    <>
                        <div>
                            <label htmlFor="productName" className="font-semibold block mb-2">Product Name</label>
                             {isAnalyzing ? (
                                <div className="w-full p-4 h-[58px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            ) : (
                                <input type="text" id="productName" value={project.productName} onChange={e => updateProject({ productName: e.target.value })} placeholder="e.g., The Cozy Slipper" 
                                className="w-full p-4 border rounded-lg" />
                            )}
                        </div>
                         <div>
                            <label htmlFor="productDescription" className="font-semibold block mb-2">Product Description</label>
                             {isAnalyzing ? (
                                <div className="w-full p-4 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            ) : (
                                <textarea id="productDescription" value={project.productDescription} onChange={e => updateProject({ productDescription: e.target.value })} placeholder="e.g., A warm and comfortable slipper, perfect for relaxing at home."
                                    className="w-full p-4 border rounded-lg h-24"></textarea>
                            )}
                        </div>
                    </>
                )}

                {/* Main Prompt */}
                <div>
                     <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt" className="font-semibold">
                            {project.mode === 'Product Ad' ? 'Describe your vision' : '1. Describe your vision'}
                        </label>
                     </div>
                     <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                         {project.referenceFiles.length > 0 && !project.videoToExtend && (
                             <div className="flex flex-wrap gap-2 p-2">
                                {project.referenceFiles.map((file, index) => (
                                    <div key={index} className="relative group w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                        <AssetPreview asset={file} />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                                            {project.mode === 'Art Maker' && (
                                                <button onClick={() => handleDescribeImage(index)} className="p-1 bg-white/20 rounded-full hover:bg-white/40">
                                                    {isDescribing === index ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-4 h-4 text-white" />}
                                                </button>
                                            )}
                                            <button onClick={() => updateProject({ referenceFiles: project.referenceFiles.filter((_, i) => i !== index) })} className="p-1 bg-white/20 rounded-full hover:bg-white/40">
                                                <XMarkIcon className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                         )}
                         <textarea
                            id="prompt"
                            value={project.prompt}
                            onChange={(e) => updateProject({ prompt: e.target.value })}
                            placeholder={project.videoToExtend ? "e.g., and then it starts to rain" : "A cinematic shot of..."}
                            className="w-full p-2 border-none focus:outline-none focus:ring-0 bg-transparent min-h-[8rem]"
                        ></textarea>
                         <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-2">
                                {!project.videoToExtend && (
                                    <button onClick={() => fileInputRef.current?.click()} disabled={project.referenceFiles.length >= 4} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} onChange={e => handleReferenceFileUpload(e.target.files)} multiple className="hidden" accept="image/*" />
                            </div>
                             <div className="flex items-center gap-4">
                                {project.mode === 'Product Ad' && (
                                    <button onClick={() => setIsCampaignModalOpen(true)} className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">Campaign Inspiration</button>
                                )}
                                <button onClick={() => setIsPromptModalOpen(true)} className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
                                    {project.mode === 'Video Maker' ? 'Video inspiration' : 'Visual inspiration'}
                                </button>
                             </div>
                         </div>
                     </div>
                </div>
            </div>

            {/* Settings */}
            {!project.videoToExtend && (
            <div className="mt-8">
                 <h3 className="text-xl font-bold mb-4">Settings</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <GenericSelect
                        label="Aspect Ratio"
                        options={aspectRatios}
                        selectedValue={project.aspectRatio}
                        onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })}
                        disabled={isAspectRatioLocked}
                    />
                     {project.mode !== 'Video Maker' && (
                        <GenericSelect
                            label="Batch Size"
                            options={batchSizeOptions}
                            selectedValue={project.batchSize}
                            onSelect={(value) => updateProject({ batchSize: value as number })}
                        />
                     )}
                     <GenericSelect
                        label="Style Presets"
                        options={stylePresetOptions}
                        selectedValue={project.stylePreset || 'None'}
                        onSelect={(value) => updateProject({ stylePreset: value === 'None' ? null : String(value) })}
                        disabled={plan === 'Free'}
                    />
                 </div>
                 {isAspectRatioLocked && <p className="text-xs text-gray-500 mt-2">Aspect ratio is locked to 1:1 for best results with product images.</p>}
            </div>
            )}

            {/* Advanced Video Settings */}
            {project.mode === 'Video Maker' && !project.videoToExtend && plan === 'Pro' && (
                <AdvancedVideoSettings project={project} updateProject={updateProject} />
            )}

            {error && <div className="mt-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">{error}</div>}
            
            {!hasEnoughCredits && (
                <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-500/30 text-center">
                    Not enough credits. <button onClick={() => navigateTo('SUBSCRIPTION')} className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-200">Buy More or Upgrade Plan</button>.
                </div>
            )}

            <div className="mt-8 text-center">
                <button onClick={onGenerate} disabled={isGenerateDisabled} className="w-full sm:w-auto px-12 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-3 sm:mx-auto">
                    {isLoading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-6 h-6" />}
                    {isLoading ? 'Generating...' : generateButtonText}
                </button>
            </div>
            
            <PromptExamplesModal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} onSelect={(p) => updateProject({ prompt: p })} project={project} />
            <CampaignInspirationModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} onSelect={(p) => updateProject({ prompt: p })} project={project} />
        </div>
    );
};