import React, { useState, useEffect, useRef } from 'react';
import { CREDIT_COSTS } from '../constants';
import { SparklesIcon, UGCImage, UGCAction, UGCAudioText, UGCBackground, XMarkIcon, AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon, TshirtIcon, LeftArrowIcon, PencilIcon } from '../components/icons';
import type { Project, UploadedFile, UgcAvatarSource, Template } from '../types';
import { Uploader } from '../components/Uploader';
import { AssetPreview } from '../components/AssetPreview';
import { GenericSelect } from '../components/GenericSelect';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { AvatarTemplateModal } from '../components/AvatarTemplateModal';
import { ProductScraper } from '../components/ProductScraper';
import { generateCampaignBrief, fetchWithProxies, generateScriptFromTemplate, suggestAvatarFromContext, validateAvatarImage } from '../services/geminiService';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import { ProgressStepper } from '../components/ProgressStepper';
import { ModalWrapper } from '../components/ModalWrapper';

type TemplateStep = 'Setup' | 'Story' | 'Avatar' | 'Production';
type CustomStep = 'Setup' | 'Story' | 'Avatar' | 'Production';

// Expanded Quick Select Options
const QUICK_SCENES: Record<string, Record<string, string>> = {
    'talking_head': {
        'Modern Kitchen': 'A close-up, eye-level shot in a bright, modern kitchen. The background features clean white marble countertops, stainless steel appliances, and soft, natural light coming from a large window.',
        'Cozy Home Office': 'A medium shot in a cozy home office. The background includes a stylish wooden desk, a bookshelf filled with books, a comfortable chair, and a large window with soft, warm light.',
        'Living Room': 'A medium shot in a comfortable and stylish living room. The person is sitting on a plush sofa. The background includes a coffee table, a soft rug, and decorative plants.',
        'City Park': 'A medium shot in a beautiful city park on a sunny day. The background has green grass, lush trees, and a pathway with soft, out-of-focus details.'
    },
    'product_showcase': {
        'Studio White': 'A clean, bright studio setting with a seamless white background. Perfect for highlighting the product details.',
        'Kitchen Counter': 'A bright, modern kitchen counter with blurred appliances in the background.',
        'Wooden Table': 'A rustic wooden table top with soft, warm lighting.',
        'Outdoor Nature': 'An outdoor setting with natural sunlight and blurred greenery in the background.'
    },
    'unboxing': {
        'Clean Desk': 'A top-down or angled view of a clean, minimalist white desk with good lighting.',
        'Living Room Floor': 'Sitting on a soft, textured rug in a cozy living room.',
        'Kitchen Island': 'Standing at a spacious kitchen island with pendant lighting overhead.',
        'Bedroom': 'Sitting on a bed with a white duvet cover, cozy and casual.'
    },
    'green_screen': {
        'Tech News': 'A screenshot of a recent tech news article about AI advancements.',
        'Viral Tweet': 'A viral tweet with thousands of likes and retweets.',
        'Stock Chart': 'A stock market chart showing a sharp upward trend.',
        'Website Homepage': 'The homepage of a modern SaaS website.'
    },
    'podcast': {
        'Dark Studio': 'A dimly lit, professional podcast studio with soundproofing foam, neon accents, and a large microphone arm.',
        'Bright Studio': 'A bright, airy studio with plants, a large wooden table, and professional audio equipment.',
        'Cozy Corner': 'A comfortable armchair in a room with bookshelves and warm lamp lighting.',
        'Tech Setup': 'A modern desk setup with multiple monitors and RGB lighting in the background.'
    },
    'reaction': {
        'Viral Video': 'Split screen reaction to a viral video clip.',
        'Fail Compilation': 'Reacting to a funny fail video compilation.',
        'Product Launch': 'Watching a live stream of a new tech product launch.',
        'Movie Trailer': 'Reacting to an intense new movie trailer.'
    },
    'pov': {
        'Walking in Park': 'Handheld camera view walking through a sunny park.',
        'Car Dashboard': 'View from the dashboard of a car while driving (safely).',
        'Gym Mirror': 'Selfie view in a gym mirror with workout equipment behind.',
        'Desk Setup': 'Looking down at a keyboard and mouse from the user\'s perspective.'
    }
};

// Fallback for any types not explicitly defined
const DEFAULT_SCENES = QUICK_SCENES['talking_head'];

const AVATAR_DESCRIPTIONS = [
    { title: "Young & Trendy", description: "Gen Z, relatable, social media savvy style." },
    { title: "Professional & Trustworthy", description: "Millennial, clear communicator, expert-like." },
    { title: "Warm & Authentic", description: "Gen X, friendly, mom/dad-vlogger style." },
    { title: "Energetic & Fun", description: "Young adult, enthusiastic, gamer/streamer vibe." },
];

const VIDEO_MODELS = [
    { value: 'veo-3.1-fast-generate-preview', label: 'Veo Fast (Quick Preview)' },
    { value: 'veo-3.1-generate-preview', label: 'Veo Cinematic (Highest Quality)' },
];

const UGC_STYLES = [
    { type: 'talking_head', title: 'Just Talking', description: 'Classic talking head.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.04.52%E2%80%AFAM.png' },
    { type: 'product_showcase', title: 'Product Showcase', description: 'Highlighting a product.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.01.23%E2%80%AFAM.png' },
    { type: 'unboxing', title: 'Unboxing', description: 'Opening and revealing.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.47.47%E2%80%AFAM.png' },
    { type: 'green_screen', title: 'Green Screen', description: 'Commentary over background.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.52.17%E2%80%AFAM.png' },
    { type: 'podcast', title: 'Podcast Clip', description: 'Professional studio vibe.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.34.57%E2%80%AFAM.png' },
    { type: 'reaction', title: 'Reaction', description: 'Reacting to content.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.48.56%E2%80%AFAM.png' },
    { type: 'pov', title: 'POV / Vlog', description: 'Handheld, selfie style.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.47.47%E2%80%AFAM.png' },
];

// Basic file util
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

export const UGCGeneratorScreen: React.FC = () => {
    const { user } = useAuth();
    const { isLoading, error, setError, setIsLoading, setGenerationStatusMessages, goBack } = useUI();
    const {
        currentProject: project,
        setCurrentProject: setProject,
        handleGenerate,
        applyPendingTemplate,
        templateToApply
    } = useProjects();
    
    // Flow state
    const [templateStep, setTemplateStep] = useState<TemplateStep>('Setup');
    const [customStep, setCustomStep] = useState<CustomStep>('Setup');
    
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [templateStep, customStep]);

    // Trigger applyPendingTemplate on mount if one exists
    useEffect(() => {
        if (templateToApply && project) {
            applyPendingTemplate(project);
        }
    }, [templateToApply, project, applyPendingTemplate]);

    if (!project || !user) {
        return <div className="text-center p-8">Error: No active project.</div>;
    }

    const isTemplateMode = !!project.templateId;
    const currentTemplate = isTemplateMode ? TEMPLATE_LIBRARY.find(t => t.id === project.templateId) : null;

    const updateProject = (updates: Partial<Project>) => {
        if (project) {
            setProject({ ...project, ...updates });
        }
    };

    const handleUGCProductUpload = async (uploadedFile: UploadedFile) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const brief = await generateCampaignBrief(uploadedFile);
            updateProject({ 
                ugcProductFile: uploadedFile, 
                productName: brief.productName, 
                productDescription: brief.productDescription,
            });
        } catch (e: any) {
            console.error("Failed to analyze product image", e);
            setError(e.message || "Failed to analyze product image.");
            updateProject({ ugcProductFile: uploadedFile, productName: '', productDescription: '' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUGCProductScraped = (data: { name: string; description: string; file: UploadedFile | null; url: string; }) => {
        updateProject({
            ugcProductFile: data.file,
            productName: data.name,
            productDescription: data.description,
            websiteUrl: data.url,
        });
        if (!data.file) {
            setError("Product details imported. Please upload an image manually to continue.");
        }
    };

    const handleSelectTemplateCharacter = async (character: { name: string, url: string }) => {
        try {
            const response = await fetchWithProxies(character.url);
            const blob = await response.blob();
            const file = await fileToUploadedFile(blob, `${character.name}.jpg`);
            // Clear description when image template is chosen
            updateProject({ ugcAvatarFile: file, ugcAvatarDescription: '', ugcAvatarSource: 'template' });
            setIsAvatarModalOpen(false);
        } catch (e) {
            console.error("Failed to fetch template character:", e);
            setError("Could not download the selected avatar. Please try again.");
            setIsAvatarModalOpen(false);
        }
    };

    const handleAvatarUpload = async (file: UploadedFile) => {
        const isValid = await validateAvatarImage(file);
        if(isValid) {
            updateProject({ ugcAvatarFile: file, ugcAvatarSource: 'upload' });
        } else {
            setError("The uploaded image doesn't seem to contain a clear face. Please try another.");
        }
    };
    
    const cost = project.videoModel === 'veo-3.1-generate-preview'
        ? CREDIT_COSTS.base.ugcVideoCinematic
        : CREDIT_COSTS.base.ugcVideoFast;

    // --- Template Mode Navigation ---
    const skipsAvatarStep = project.ugcAvatarSource !== 'upload' && project.ugcAvatarSource !== 'ai';
    const templateSteps = skipsAvatarStep 
        ? ['Setup', 'Story', 'Production'] 
        : ['Setup', 'Story', 'Avatar', 'Production'];

    const getTemplateStepIndex = (step: TemplateStep) => templateSteps.indexOf(step);
    
    const handleTemplateNext = () => {
         if (templateStep === 'Setup') setTemplateStep('Story');
         else if (templateStep === 'Story') {
             if (skipsAvatarStep) {
                  setTemplateStep('Production');
             } else {
                  setTemplateStep('Avatar');
             }
         }
         else if (templateStep === 'Avatar') setTemplateStep('Production');
    };

    const handleTemplateBack = () => {
        if (templateStep === 'Production') {
            if (skipsAvatarStep) setTemplateStep('Story');
            else setTemplateStep('Avatar');
        }
        else if (templateStep === 'Avatar') setTemplateStep('Story');
        else if (templateStep === 'Story') setTemplateStep('Setup');
    };

    const getTemplateHeaderTitle = () => {
        switch (templateStep) {
            case 'Setup': return currentTemplate ? `${currentTemplate.title} Template` : 'Create Video';
            case 'Story': return "Craft the Script";
            case 'Avatar': return "Customize Avatar";
            case 'Production': return "Video Settings";
            default: return currentTemplate ? `${currentTemplate.title} Template` : 'Create Video';
        }
    };

    // --- Custom Mode Navigation ---
    const getCustomStepIndex = (step: CustomStep) => ['Setup', 'Story', 'Avatar', 'Production'].indexOf(step);

    const handleCustomNext = () => {
        if (customStep === 'Setup') setCustomStep('Story');
        else if (customStep === 'Story') setCustomStep('Avatar');
        else if (customStep === 'Avatar') setCustomStep('Production');
    };

    const handleCustomBack = () => {
        if (customStep === 'Production') setCustomStep('Avatar');
        else if (customStep === 'Avatar') setCustomStep('Story');
        else if (customStep === 'Story') setCustomStep('Setup');
        else if (customStep === 'Setup') goBack();
    };

    const getCustomHeaderTitle = () => {
        switch (customStep) {
            case 'Setup': return "Create a UGC Video";
            case 'Story': return "Scene & Story";
            case 'Avatar': return "Create Your Persona";
            case 'Production': return "Final Polish";
            default: return "Create a UGC Video";
        }
    };
    
    // --- Validation Logic ---
    const isTemplateNextDisabled = isLoading || 
        (templateStep === 'Setup' && (!project.ugcType || (project.ugcType === 'product_showcase' && !project.ugcProductFile))) ||
        (templateStep === 'Avatar' && !project.ugcAvatarFile && (!project.ugcAvatarDescription || !project.ugcAvatarDescription.trim()));
    
    const isProductCentric = ['product_showcase', 'unboxing'].includes(project.ugcType || '');

    const isCustomNextDisabled = isLoading ||
        (customStep === 'Setup' && (!project.ugcType || (isProductCentric && !project.ugcProductFile))) ||
        (customStep === 'Story' && (!project.ugcSceneDescription || !project.ugcScript)) || // Require scene and script
        (customStep === 'Avatar' && !project.ugcAvatarFile && (!project.ugcAvatarDescription || !project.ugcAvatarDescription.trim()));

    // --- Render Logic ---

    if (isTemplateMode) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        {templateStep !== 'Setup' && (
                            <button onClick={handleTemplateBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2">
                                <LeftArrowIcon className="w-6 h-6" />
                            </button>
                        )}
                         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {getTemplateHeaderTitle()}
                        </h2>
                    </div>
                    <ProgressStepper steps={templateSteps} currentStepIndex={getTemplateStepIndex(templateStep)} />
                </div>

                <div className="max-w-4xl mx-auto">
                    {templateStep === 'Setup' && (
                        <TemplateSetupStep 
                            project={project} 
                            updateProject={updateProject}
                            isAnalyzing={isAnalyzing}
                            handleUGCProductUpload={handleUGCProductUpload}
                            handleUGCProductScraped={handleUGCProductScraped}
                            setIsLoading={setIsLoading}
                            setGenerationStatusMessages={setGenerationStatusMessages}
                            setError={setError}
                            currentTemplate={currentTemplate}
                        />
                    )}
                    {templateStep === 'Story' && (
                        <TemplateStoryStep 
                            project={project} 
                            updateProject={updateProject} 
                            isLoading={isLoading}
                        />
                    )}
                    {templateStep === 'Avatar' && (
                         <TemplateAvatarStep 
                            project={project} 
                            updateProject={updateProject}
                            handleAvatarUpload={handleAvatarUpload}
                            onOpenTemplateModal={() => setIsAvatarModalOpen(true)}
                         />
                    )}
                    {templateStep === 'Production' && (
                        <div>
                             <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                                <div className="flex flex-wrap gap-4 flex-grow">
                                    <div className="min-w-[180px] flex-grow">
                                        <GenericSelect label="Video Model" options={VIDEO_MODELS} selectedValue={project.videoModel || 'veo-3.1-fast-generate-preview'} onSelect={(value) => updateProject({ videoModel: value as string })} />
                                    </div>
                                    <div className="min-w-[120px] flex-grow">
                                         <GenericSelect label="Aspect Ratio" options={[{ value: '9:16', label: '9:16', icon: <AspectRatioTallIcon className="w-5 h-5" /> }, { value: '16:9', label: '16:9', icon: <AspectRatioWideIcon className="w-5 h-5" /> }, { value: '1:1', label: '1:1', icon: <AspectRatioSquareIcon className="w-5 h-5" /> }]} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} />
                                    </div>
                                </div>
                                 <button 
                                    onClick={handleGenerate} 
                                    disabled={isLoading}
                                    className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 w-full md:w-auto justify-center"
                                >
                                    {isLoading ? (
                                        <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Generating...</>
                                    ) : (
                                         <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navigation Actions (Only for Steps 1, 2, 3) */}
                    {templateStep !== 'Production' && (
                        <div className="mt-10 flex items-center justify-end">
                            <button 
                                onClick={handleTemplateNext} 
                                disabled={isTemplateNextDisabled}
                                className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    )}
                     {error && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}
                </div>
                
                 <AvatarTemplateModal
                    isOpen={isAvatarModalOpen}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onSelect={handleSelectTemplateCharacter}
                />
            </div>
        );
    }

    // --- Custom Flow Render ---
    const customSteps = ['Goal', 'Scene', 'Avatar', 'Production'];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={handleCustomBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2">
                        <LeftArrowIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {getCustomHeaderTitle()}
                    </h2>
                </div>
                <ProgressStepper steps={customSteps} currentStepIndex={getCustomStepIndex(customStep)} />
            </div>

            <div className="max-w-5xl mx-auto">
                {customStep === 'Setup' && (
                    <CustomSetupStep
                        project={project}
                        updateProject={updateProject}
                        isAnalyzing={isAnalyzing}
                        handleUGCProductUpload={handleUGCProductUpload}
                        handleUGCProductScraped={handleUGCProductScraped}
                        setIsLoading={setIsLoading}
                        setGenerationStatusMessages={setGenerationStatusMessages}
                        setError={setError}
                    />
                )}
                {customStep === 'Story' && (
                    <CustomStoryStep
                        project={project}
                        updateProject={updateProject}
                        isLoading={isLoading}
                    />
                )}
                {customStep === 'Avatar' && (
                    <CustomAvatarStep
                        project={project}
                        updateProject={updateProject}
                        handleAvatarUpload={handleAvatarUpload}
                        onOpenTemplateModal={() => setIsAvatarModalOpen(true)}
                    />
                )}
                {customStep === 'Production' && (
                     <CustomProductionStep
                        project={project}
                        updateProject={updateProject}
                        handleGenerate={handleGenerate}
                        isLoading={isLoading}
                        cost={cost}
                     />
                )}

                {customStep !== 'Production' && (
                     <div className="mt-10 flex items-center justify-end">
                        <button
                            onClick={handleCustomNext}
                            disabled={isCustomNextDisabled}
                            className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                )}
                 {error && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}
            </div>
            
            <AvatarTemplateModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSelect={handleSelectTemplateCharacter}
            />
        </div>
    );
};


// --- TEMPLATE WIZARD STEPS ---

const TemplateSetupStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    isAnalyzing: boolean;
    handleUGCProductUpload: (file: UploadedFile) => void;
    handleUGCProductScraped: (data: { name: string; description: string; file: UploadedFile | null; url: string; }) => void;
    setIsLoading: (loading: boolean) => void;
    setGenerationStatusMessages: (messages: string[]) => void;
    setError: (error: string | null) => void;
    currentTemplate: Template | null | undefined;
}> = ({
    project, updateProject, isAnalyzing, handleUGCProductUpload, handleUGCProductScraped, setIsLoading, setGenerationStatusMessages, setError, currentTemplate
}) => {
    const isShowcase = project.ugcType === 'product_showcase';
    const useTemplateAvatar = project.ugcAvatarSource !== 'upload' && project.ugcAvatarSource !== 'ai';
    const shouldShowDetails = project.ugcProductFile || project.productName || isAnalyzing;
    
    const SelectionCard = ({ type, title, description, imageUrl }: { type: 'talking_head' | 'product_showcase', title: string, description: string, imageUrl?: string }) => {
         const isSelected = project.ugcType === type;
         return (
             <button 
                onClick={() => updateProject({ ugcType: type })}
                className={`group text-left flex flex-col items-center flex-shrink-0 w-full`}
            >
                <div className={`relative overflow-hidden rounded-xl aspect-[9/16] w-full bg-gray-100 dark:bg-gray-800 border-2 transition-all duration-300 ${isSelected ? 'border-brand-accent ring-1 ring-brand-accent' : 'border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600'}`}>
                    <img 
                        src={imageUrl} 
                        alt={title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                </div>
                <div className="mt-3 text-left w-full">
                    <h3 className={`text-base font-bold transition-colors ${isSelected ? 'text-brand-accent' : 'text-gray-800 dark:text-gray-100'} group-hover:text-brand-accent`}>
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {description}
                    </p>
                </div>
            </button>
         );
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Main Selection Section */}
            <div>
                <h2 className="text-xl font-bold text-center mb-6 text-gray-900 dark:text-white">What is the goal of this video?</h2>
                <div className="grid grid-cols-2 gap-4 w-full max-w-[30rem] mx-auto"> 
                    <SelectionCard 
                        type="talking_head" 
                        title="Just Talking" 
                        description="Avatar delivers a message."
                        imageUrl={currentTemplate?.previewImageUrl}
                    />
                    <SelectionCard 
                        type="product_showcase" 
                        title="Selling a Product" 
                        description="Avatar showcases a product."
                        imageUrl="https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.01.23%E2%80%AFAM.png"
                    />
                </div>
            </div>

            {isShowcase && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 max-w-2xl mx-auto">
                    <h4 className="font-bold mb-4 text-xl text-gray-900 dark:text-white text-center">Product Details</h4>
                    <div className="flex flex-col gap-6">
                        {/* Upload Card */}
                        <div className="flex flex-col items-center max-w-md mx-auto w-full">
                            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 w-full">
                                 <div className="space-y-4">
                                     <ProductScraper
                                        onProductScraped={handleUGCProductScraped}
                                        setIsLoading={setIsLoading}
                                        setStatusMessages={setGenerationStatusMessages}
                                        setError={setError}
                                    />
                                    <div className="relative my-2">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                                        <div className="relative flex justify-center text-sm"><span className="bg-gray-50 dark:bg-gray-700 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                                    </div>
                                     {isAnalyzing ? (
                                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <div style={{ borderColor: '#91EB23', borderTopColor: 'transparent' }} className="w-8 h-8 border-4 rounded-full animate-spin"></div>
                                        </div>
                                    ) : project.ugcProductFile ? (
                                        <div className="relative w-full h-48 group">
                                            {/* Image Container */}
                                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                                <AssetPreview asset={project.ugcProductFile} objectFit="contain" />
                                            </div>
                                            {/* Remove Button (Outside clipped area) */}
                                            <button 
                                                onClick={() => updateProject({ ugcProductFile: null, productName: '', productDescription: '' })} 
                                                className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition-colors"
                                            >
                                                <XMarkIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <Uploader onUpload={handleUGCProductUpload} title="Upload Product Image" subtitle="" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Product Details Inputs - Vertically Stacked */}
                        {shouldShowDetails && (
                            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300 w-full max-w-md mx-auto">
                                <div>
                                    <label htmlFor="productName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Product Name</label>
                                    {isAnalyzing ? (
                                        <div className="w-full p-4 h-[58px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                    ) : (
                                        <input type="text" id="productName" value={project.productName || ''} onChange={e => updateProject({ productName: e.target.value })} placeholder="e.g., The Cozy Slipper" 
                                        className="w-full p-4 border rounded-lg input-focus-brand" />
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="productDescription" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Product Description</label>
                                    {isAnalyzing ? (
                                        <div className="w-full p-4 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                    ) : (
                                        <textarea id="productDescription" value={project.productDescription || ''} onChange={e => updateProject({ productDescription: e.target.value })} placeholder="e.g., A warm and comfortable slipper..."
                                            className="w-full p-4 border rounded-lg input-focus-brand min-h-[8rem]"></textarea>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 mx-auto w-full max-w-[30rem]">
                <div>
                    <span className="font-bold block text-gray-900 dark:text-gray-200">Use Avatar in the Template?</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Uncheck to customize the avatar</span>
                </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={useTemplateAvatar} 
                        onChange={() => {
                            if (useTemplateAvatar) {
                                updateProject({ ugcAvatarSource: 'ai' });
                            } else {
                                updateProject({ ugcAvatarSource: 'template', ugcAvatarFile: null, ugcAvatarDescription: '' });
                            }
                        }} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-black rounded-full peer peer-checked:bg-[#91EB23] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
            </div>
        </div>
    );
};

const TemplateStoryStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; isLoading: boolean; }> = ({ project, updateProject, isLoading }) => {
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionText, setActionText] = useState(project.ugcAction || '');

    const handleMagicScript = async () => {
        setIsGeneratingScript(true);
        try {
            const productInfo = project.productName ? { productName: project.productName, productDescription: project.productDescription } : undefined;
            // Pass ugcType for context-aware generation
            const script = await generateScriptFromTemplate(project.ugcSceneDescription || "A generic scene", project.ugcType, productInfo);
            updateProject({ ugcScript: script });
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const saveAction = () => {
        updateProject({ ugcAction: actionText });
        setIsActionModalOpen(false);
    };
    
    // Simplified quick select for template mode (since templates usually dictate scene)
    const templateQuickScenes = QUICK_SCENES['talking_head'];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             {/* Action Section (Read Only + Edit Modal) */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <label className="font-bold text-lg text-gray-900 dark:text-white">What Your Avatar is Doing</label>
                    <button onClick={() => { setActionText(project.ugcAction || ''); setIsActionModalOpen(true); }} className="text-brand-accent hover:text-brand-accent-hover transition-colors" title="Edit">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="w-full p-4 border rounded-lg h-24 bg-gray-50 dark:!bg-[#131517] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 overflow-y-auto text-sm">
                     {project.ugcAction}
                </div>
            </div>

             {/* Dialogue Section */}
            <div className="relative">
                <label className="font-bold text-lg mb-2 block text-gray-900 dark:text-white">Dialogue / Script</label>
                <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:!bg-[#131517] input-focus-brand hover:border-gray-400 dark:hover:border-gray-500 transition-colors group-focus-within:ring-2 group-focus-within:ring-brand-focus group-focus-within:border-brand-focus">
                    <textarea
                        value={project.ugcScript}
                        onChange={(e) => updateProject({ ugcScript: e.target.value })}
                        placeholder="Enter what the avatar should say..."
                        className="w-full border-none focus:outline-none focus:ring-0 bg-transparent dark:!bg-transparent h-40 text-gray-900 dark:text-white resize-none p-0"
                    />
                    <div className="flex items-center justify-end mt-2">
                         <button 
                            onClick={handleMagicScript} 
                            disabled={isGeneratingScript || isLoading}
                            className="text-brand-accent hover:underline disabled:hover:no-underline text-sm disabled:text-gray-400 disabled:no-underline flex items-center gap-1 font-semibold"
                        >
                            {isGeneratingScript && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                            Write for me
                        </button>
                    </div>
                </div>
            </div>

             {/* Voice Settings */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GenericSelect label="Language" options={['English', 'Spanish', 'French', 'German', 'Japanese'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcLanguage || 'English'} onSelect={(v) => updateProject({ ugcLanguage: v as string })} />
                <GenericSelect label="Accent" options={['American', 'British', 'Australian'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcAccent || 'American'} onSelect={(v) => updateProject({ ugcAccent: v as string })} />
                <GenericSelect label="Emotion" options={['Auto', 'Happy', 'Excited', 'Serious', 'Calm'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcEmotion || 'Auto'} onSelect={(v) => updateProject({ ugcEmotion: v as string })} />
            </div>

            {/* Edit Action Modal */}
            <ModalWrapper isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)}>
                <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Avatar Action</h3>
                    <textarea
                        value={actionText}
                        onChange={(e) => setActionText(e.target.value)}
                        className="w-full p-4 border rounded-lg h-40 input-focus-brand bg-gray-50 dark:!bg-[#131517] text-gray-900 dark:text-white dark:border-gray-700"
                    />
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsActionModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                        <button onClick={saveAction} className="px-4 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover">Save</button>
                    </div>
                </div>
            </ModalWrapper>
        </div>
    );
};

const TemplateAvatarStep: React.FC<{ 
    project: Project; 
    updateProject: (u: Partial<Project>) => void; 
    handleAvatarUpload: (file: UploadedFile) => void; 
    onOpenTemplateModal: () => void;
}> = ({ project, updateProject, handleAvatarUpload, onOpenTemplateModal }) => {
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleSuggestAvatar = async () => {
        setIsSuggesting(true);
        try {
             const productInfo = project.productName ? { productName: project.productName, productDescription: project.productDescription } : undefined;
             const desc = await suggestAvatarFromContext(project.ugcSceneDescription || "", productInfo);
             updateProject({ ugcAvatarDescription: desc });
        } catch(e) {
            console.error(e);
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-xl font-bold mb-6 text-center text-gray-900 dark:text-white">Customize Avatar</h3>
            
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                {/* Description Section (AI) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Describe the person</label>
                        <button onClick={handleSuggestAvatar} disabled={isSuggesting} className="text-xs text-brand-accent font-semibold hover:underline flex items-center gap-1">
                            {isSuggesting ? 'Thinking...' : 'Suggest based on script'}
                        </button>
                    </div>
                    <textarea
                        value={project.ugcAvatarDescription || ''}
                        onChange={(e) => updateProject({ ugcAvatarDescription: e.target.value, ugcAvatarFile: null, ugcAvatarSource: 'ai' })}
                        placeholder="e.g., A friendly woman in her late 30s with blonde hair, wearing a casual sweater..."
                        className="w-full p-4 border rounded-lg h-32 input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600"
                    />
                     <div className="flex flex-wrap gap-2">
                        {AVATAR_DESCRIPTIONS.map(desc => (
                        <button
                            key={desc.title}
                            onClick={() => updateProject({ ugcAvatarDescription: desc.description, ugcAvatarFile: null, ugcAvatarSource: 'ai' })}
                            className="px-3 py-1.5 text-xs rounded-full border bg-white dark:bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-[#1C1E20] transition-colors"
                        >
                            {desc.title}
                        </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#2b2d31] font-semibold">Upload your photo</span>
                    </div>
                </div>

                {/* Upload Section */}
                <div>
                    {project.ugcAvatarFile ? (
                        <div className="relative w-full h-64 group">
                             {/* Wrapper Pattern for Remove Button Positioning */}
                             <div className="relative w-full h-full">
                                {/* Image Container (Clipped) */}
                                <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                    <AssetPreview asset={project.ugcAvatarFile} objectFit="contain" />
                                </div>
                                {/* Remove Button (Outside clipped area) */}
                                <button 
                                    onClick={() => updateProject({ ugcAvatarFile: null })} 
                                    className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition-colors"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Uploader onUpload={handleAvatarUpload} title="Upload Avatar Image" subtitle="" />
                            <div className="mt-2 text-center">
                                <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Pick from library</button>
                            </div>
                        </>
                    )}
                    
                    <div className="mt-6 flex justify-end">
                        <button onClick={onOpenTemplateModal} className="text-sm font-semibold text-brand-accent hover:underline">
                            Pick from template library
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- NEW CUSTOM WIZARD STEPS ---

const CustomSetupStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    isAnalyzing: boolean;
    handleUGCProductUpload: (file: UploadedFile) => void;
    handleUGCProductScraped: (data: { name: string; description: string; file: UploadedFile | null; url: string; }) => void;
    setIsLoading: (loading: boolean) => void;
    setGenerationStatusMessages: (messages: string[]) => void;
    setError: (error: string | null) => void;
}> = ({
    project, updateProject, isAnalyzing, handleUGCProductUpload, handleUGCProductScraped, setIsLoading, setGenerationStatusMessages, setError
}) => {
    const isProductCentric = ['product_showcase', 'unboxing'].includes(project.ugcType || '');
    const shouldShowDetails = project.ugcProductFile || project.productName || isAnalyzing;
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        if (scrollRef.current && project.ugcType) {
            // Find the index of the selected type in UGC_STYLES
            const selectedIndex = UGC_STYLES.findIndex(style => style.type === project.ugcType);
            if (selectedIndex !== -1) {
                // Calculate scroll position: (card width 192px + gap 16px) * index
                const cardWidth = 192 + 16; 
                const scrollPos = selectedIndex * cardWidth;
                
                // Scroll smoothly to the position
                scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
            }
        }
    }, []); // Only run on mount to restore position

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const maxScroll = scrollWidth - clientWidth;
            setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
        }
    };

    const SelectionCard = ({ type, title, description, imageUrl }: { type: Project['ugcType'], title: string, description: string, imageUrl?: string }) => {
         const isSelected = project.ugcType === type;
         return (
             <button 
                onClick={() => updateProject({ ugcType: type })}
                className="group text-left flex flex-col flex-shrink-0 w-48 snap-start"
            >
                <div className={`relative overflow-hidden rounded-xl aspect-[9/16] w-full bg-gray-100 dark:bg-gray-800 border-2 transition-all duration-300 ${isSelected ? 'border-brand-accent ring-1 ring-brand-accent' : 'border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600'}`}>
                    {imageUrl && (
                        <img 
                            src={imageUrl} 
                            alt={title} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                    )}
                </div>
                <div className="mt-3 w-full text-left">
                    <h3 className={`text-base font-bold transition-colors ${isSelected ? 'text-brand-accent' : 'text-gray-800 dark:text-gray-100'} group-hover:text-brand-accent`}>
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {description}
                    </p>
                </div>
            </button>
         );
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Main Selection Carousel */}
            <div>
                <h2 className="text-xl font-bold mb-6 text-left text-gray-900 dark:text-white">Choose a Video Style</h2>
                
                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
                >
                    {UGC_STYLES.map((style) => (
                         <SelectionCard 
                            key={style.type}
                            type={style.type as any}
                            title={style.title}
                            description={style.description}
                            imageUrl={style.imageUrl}
                        />
                    ))}
                </div>

                 {/* Scroll Indicator */}
                <div className="relative h-1 bg-gray-200 dark:bg-[#2B2B2B] rounded-full -mt-2 mb-6 w-full max-w-md overflow-hidden">
                    <div 
                        className="absolute top-0 h-full bg-brand-accent rounded-full"
                        style={{ 
                            width: '20%', 
                            left: `${scrollProgress * 80}%`,
                            transition: 'left 0.1s ease-out'
                        }}
                    />
                </div>
            </div>

            {isProductCentric && (
                <div>
                    <div className="max-w-5xl">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            {/* Left Column: Upload Card */}
                            <div className="w-full">
                                <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 w-full">
                                     <div className="space-y-4">
                                         <div className="flex justify-between items-center mb-2">
                                             <h4 className="font-bold text-xl text-gray-900 dark:text-white text-left">Product Details</h4>
                                         </div>
                                         <ProductScraper
                                            onProductScraped={handleUGCProductScraped}
                                            setIsLoading={setIsLoading}
                                            setStatusMessages={setGenerationStatusMessages}
                                            setError={setError}
                                        />
                                        <div className="relative my-2">
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                                            <div className="relative flex justify-center text-sm"><span className="bg-gray-50 dark:bg-gray-700 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                                        </div>
                                         {isAnalyzing ? (
                                            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                <div style={{ borderColor: '#91EB23', borderTopColor: 'transparent' }} className="w-8 h-8 border-4 rounded-full animate-spin"></div>
                                            </div>
                                        ) : project.ugcProductFile ? (
                                            <div className="relative w-full h-48 group">
                                                {/* Wrapper Pattern for Remove Button Positioning */}
                                                <div className="relative w-full h-full">
                                                    {/* Image Container (Clipped) */}
                                                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                                        <AssetPreview asset={project.ugcProductFile} objectFit="contain" />
                                                    </div>
                                                    {/* Remove Button (Outside clipped area) */}
                                                    <button 
                                                        onClick={() => updateProject({ ugcProductFile: null, productName: '', productDescription: '' })} 
                                                        className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition-colors"
                                                    >
                                                        <XMarkIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Uploader onUpload={handleUGCProductUpload} title="Upload Product Image" subtitle="" />
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                             {/* Right Column: Inputs */}
                            {shouldShowDetails && (
                                <div className="flex flex-col gap-6 w-full">
                                    <div>
                                        <label htmlFor="productName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Product Name</label>
                                        {isAnalyzing ? (
                                            <div className="w-full p-4 h-[58px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                        ) : (
                                            <input type="text" id="productName" value={project.productName || ''} onChange={e => updateProject({ productName: e.target.value })} placeholder="e.g., The Cozy Slipper" 
                                            className="w-full p-4 border rounded-lg input-focus-brand" />
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="productDescription" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Product Description</label>
                                        {isAnalyzing ? (
                                            <div className="w-full p-4 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                        ) : (
                                            <textarea id="productDescription" value={project.productDescription || ''} onChange={e => updateProject({ productDescription: e.target.value })} placeholder="e.g., A warm and comfortable slipper..."
                                                className="w-full p-4 border rounded-lg input-focus-brand min-h-[8rem]"></textarea>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CustomStoryStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; isLoading: boolean; }> = ({ project, updateProject, isLoading }) => {
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

    const handleMagicScript = async () => {
        setIsGeneratingScript(true);
        try {
            const productInfo = project.productName ? { productName: project.productName, productDescription: project.productDescription } : undefined;
            // Pass ugcType for better context
            const script = await generateScriptFromTemplate(project.ugcSceneDescription || "A generic scene", project.ugcType, productInfo);
            updateProject({ ugcScript: script });
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const getSceneLabel = () => {
        switch(project.ugcType) {
            case 'green_screen': return 'Background Description';
            case 'reaction': return 'What are you reacting to?';
            case 'podcast': return 'Studio Setting';
            default: return 'Scene';
        }
    };
    
    const getScenePlaceholder = () => {
        switch(project.ugcType) {
             case 'green_screen': return 'e.g., A news article about AI trends, a screenshot of a viral tweet...';
             case 'reaction': return 'e.g., A funny cat video, a competitor\'s product launch...';
             case 'podcast': return 'e.g., A moody, dimly lit studio with neon accents and soundproofing foam...';
             default: return 'e.g., A bright, modern kitchen with marble countertops...';
        }
    }

    // Get relevant quick scenes for the current type
    const currentQuickScenes = QUICK_SCENES[project.ugcType || 'talking_head'] || DEFAULT_SCENES;

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Scene Description */}
            <div>
                <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{getSceneLabel()}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Describe the background and setting of the video.</p>
                <textarea
                    value={project.ugcSceneDescription || ''}
                    onChange={(e) => updateProject({ ugcSceneDescription: e.target.value })}
                    placeholder={getScenePlaceholder()}
                    className="w-full p-4 border rounded-lg min-h-[6rem] input-focus-brand"
                />
                <div className="mt-4">
                    <p className="font-semibold text-sm mb-2">Quick Select:</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(currentQuickScenes).map(key => (
                            <button
                                key={key}
                                onClick={() => updateProject({ ugcSceneDescription: currentQuickScenes[key] })}
                                className="px-3 py-1.5 text-sm rounded-full border bg-gray-50 dark:bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-[#131517] transition-colors"
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Dialogue */}
            <div className="relative">
                <label className="font-bold text-lg mb-2 block text-gray-900 dark:text-white">Dialogue / Script</label>
                <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:!bg-[#131517] input-focus-brand hover:border-gray-400 dark:hover:border-gray-500 transition-colors group-focus-within:ring-2 group-focus-within:ring-brand-focus group-focus-within:border-brand-focus">
                    <textarea
                        value={project.ugcScript || ''}
                        onChange={(e) => updateProject({ ugcScript: e.target.value })}
                        placeholder="Enter what the avatar should say..."
                        className="w-full border-none focus:outline-none focus:ring-0 bg-transparent dark:!bg-transparent h-40 text-gray-900 dark:text-white resize-none p-0"
                    />
                    <div className="flex items-center justify-end mt-2">
                         <button 
                            onClick={handleMagicScript} 
                            disabled={isGeneratingScript || isLoading}
                            className="text-brand-accent hover:underline disabled:hover:no-underline text-sm disabled:text-gray-400 disabled:no-underline flex items-center gap-1 font-semibold"
                        >
                            {isGeneratingScript && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                            Write for me
                        </button>
                    </div>
                </div>
            </div>

             {/* Action */}
             <div>
                <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Action</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">What should the person be doing?</p>
                <textarea
                    value={project.ugcAction || ''}
                    onChange={(e) => updateProject({ ugcAction: e.target.value })}
                    placeholder="e.g., Smiling at the camera, holding the product up, pointing to the side..."
                    className="w-full p-4 border rounded-lg min-h-[6rem] input-focus-brand"
                />
            </div>

             {/* Voice Settings */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GenericSelect label="Language" options={['English', 'Spanish', 'French', 'German', 'Japanese'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcLanguage || 'English'} onSelect={(v) => updateProject({ ugcLanguage: v as string })} />
                <GenericSelect label="Accent" options={['American', 'British', 'Australian'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcAccent || 'American'} onSelect={(v) => updateProject({ ugcAccent: v as string })} />
                <GenericSelect label="Emotion" options={['Auto', 'Happy', 'Excited', 'Serious', 'Calm'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcEmotion || 'Auto'} onSelect={(v) => updateProject({ ugcEmotion: v as string })} />
            </div>
        </div>
    );
};

const CustomAvatarStep = TemplateAvatarStep; // Reuse logic directly

const CustomProductionStep: React.FC<{ 
    project: Project; 
    updateProject: (u: Partial<Project>) => void; 
    handleGenerate: () => void;
    isLoading: boolean;
    cost: number;
}> = ({ project, updateProject, handleGenerate, isLoading, cost }) => {
    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div className="flex flex-wrap gap-4 flex-grow">
                    <div className="min-w-[180px] flex-grow">
                        <GenericSelect label="Video Model" options={VIDEO_MODELS} selectedValue={project.videoModel || 'veo-3.1-fast-generate-preview'} onSelect={(value) => updateProject({ videoModel: value as string })} />
                    </div>
                    <div className="min-w-[120px] flex-grow">
                         <GenericSelect label="Aspect Ratio" options={[{ value: '9:16', label: '9:16', icon: <AspectRatioTallIcon className="w-5 h-5" /> }, { value: '16:9', label: '16:9', icon: <AspectRatioWideIcon className="w-5 h-5" /> }, { value: '1:1', label: '1:1', icon: <AspectRatioSquareIcon className="w-5 h-5" /> }]} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} />
                    </div>
                </div>
                 <button 
                    onClick={handleGenerate} 
                    disabled={isLoading}
                    className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 w-full md:w-auto justify-center"
                >
                    {isLoading ? (
                        <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Generating...</>
                    ) : (
                         <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                    )}
                </button>
            </div>
        </div>
    );
};