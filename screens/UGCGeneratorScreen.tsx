
import React, { useState, useEffect } from 'react';
import { CREDIT_COSTS } from '../constants';
import { SparklesIcon, UGCImage, UGCAction, UGCAudioText, UGCBackground, XMarkIcon, AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon, TshirtIcon, LeftArrowIcon } from '../components/icons';
import type { Project, UploadedFile, UgcAvatarSource } from '../types';
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

type UGCStep = 'Product' | 'Action' | 'Dialogue' | 'Scene' | 'Avatar';
type TemplateStep = 'Setup' | 'Story' | 'Avatar' | 'Production';

const SCENE_TEMPLATES: Record<string, string> = {
    'Modern Kitchen': 'A close-up, eye-level shot in a bright, modern kitchen. The background features clean white marble countertops, stainless steel appliances, and soft, natural light coming from a large window, creating a fresh and professional look.',
    'Cozy Home Office': 'A medium shot in a cozy home office. The background includes a stylish wooden desk, a bookshelf filled with books, a comfortable chair, and a large window with soft, warm light. The atmosphere is professional yet relaxed and trustworthy.',
    'Living Room': 'A medium shot in a comfortable and stylish living room. The person is sitting on a plush sofa. The background includes a coffee table, a soft rug, and decorative plants. The lighting is warm and inviting, perfect for a friendly, relatable message.',
    'In a Car (Passenger)': 'A close-up shot from the passenger seat of a modern, clean car. The background shows a calm city street with some bokeh. The lighting is natural daylight from the window, creating a casual, on-the-go feel.',
    'Modern Bathroom': 'A medium shot in a clean, modern bathroom with bright, even lighting. The background has white tiles, a large mirror, and a few minimalist decorative plants, creating a fresh, clean, and trustworthy aesthetic.',
    'City Park': 'A medium shot in a beautiful city park on a sunny day. The background has green grass, lush trees, and a pathway with soft, out-of-focus details. The scene is bright and lively, conveying energy and positivity.',
    'Beach': 'A medium shot on a beautiful sandy beach with calm blue waves and a clear sky in the background. The sun is bright, creating a relaxed, happy, and aspirational atmosphere perfect for a vacation or lifestyle theme.'
};

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
    
    // Standard flow state
    const [currentStep, setCurrentStep] = useState<UGCStep>('Product');
    // Template flow state
    const [templateStep, setTemplateStep] = useState<TemplateStep>('Setup');
    
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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

    // --- Template Mode Handlers ---
    
    const handleTemplateNext = () => {
         if (templateStep === 'Setup') setTemplateStep('Story');
         else if (templateStep === 'Story') {
             // If using template avatar, skip Avatar step
             if (project.ugcAvatarSource !== 'upload' && project.ugcAvatarSource !== 'ai' && project.ugcAvatarSource !== 'template') {
                 // Default to template if not explicitly changed
                  setTemplateStep('Production');
             } else if (project.ugcAvatarSource === 'template') { // Assuming 'template' here means 'default template avatar' logic handled loosely, technically 'template' in source means from the library
                  setTemplateStep('Production');
             } else {
                  setTemplateStep('Avatar');
             }
         }
         else if (templateStep === 'Avatar') setTemplateStep('Production');
    };

    const handleTemplateBack = () => {
        if (templateStep === 'Production') {
             // Check if we skipped Avatar step
            if (project.ugcAvatarSource === 'template' || (!project.ugcAvatarSource)) {
                 setTemplateStep('Story');
            } else {
                 setTemplateStep('Avatar');
            }
        }
        else if (templateStep === 'Avatar') setTemplateStep('Story');
        else if (templateStep === 'Story') setTemplateStep('Setup');
    };

    // --- Standard Mode Handlers ---

    const standardSteps: { name: UGCStep, icon: React.ReactNode }[] = [
        { name: 'Product', icon: <TshirtIcon className="w-5 h-5" /> },
        { name: 'Action', icon: <UGCAction className="w-5 h-5" /> },
        { name: 'Dialogue', icon: <UGCAudioText className="w-5 h-5" /> },
        { name: 'Scene', icon: <UGCBackground className="w-5 h-5" /> },
        { name: 'Avatar', icon: <UGCImage className="w-5 h-5" /> },
    ];
    
    const standardStepOrder: UGCStep[] = ['Product', 'Action', 'Dialogue', 'Scene', 'Avatar'];
    const isStandardFirstStep = currentStep === standardStepOrder[0];
    const isStandardLastStep = currentStep === standardStepOrder[standardStepOrder.length - 1];

    const handleStandardNext = () => {
        const currentIndex = standardStepOrder.indexOf(currentStep);
        if (currentIndex < standardStepOrder.length - 1) {
            setCurrentStep(standardStepOrder[currentIndex + 1]);
        }
    };
    
    const handleStandardBack = () => {
        const currentIndex = standardStepOrder.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(standardStepOrder[currentIndex - 1]);
        }
    };
    
    // --- Render Logic ---

    if (isTemplateMode) {
        return (
            <div className="max-w-5xl mx-auto">
                <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold mb-6 text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
                    <LeftArrowIcon className="w-4 h-4"/> Back
                </button>

                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {currentTemplate?.title || 'Create Video'}
                    </h2>
                     <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full ${templateStep === 'Setup' ? 'bg-brand-accent text-on-accent' : 'bg-gray-200 dark:bg-gray-700'}`}>1. Setup</span>
                        <span className={`px-2 py-1 rounded-full ${templateStep === 'Story' ? 'bg-brand-accent text-on-accent' : 'bg-gray-200 dark:bg-gray-700'}`}>2. Story</span>
                        <span className={`px-2 py-1 rounded-full ${templateStep === 'Avatar' ? 'bg-brand-accent text-on-accent' : 'bg-gray-200 dark:bg-gray-700'}`}>3. Avatar</span>
                        <span className={`px-2 py-1 rounded-full ${templateStep === 'Production' ? 'bg-brand-accent text-on-accent' : 'bg-gray-200 dark:bg-gray-700'}`}>4. Finish</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Template Preview (Visible on all steps for context) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-24">
                            <div className="aspect-[9/16] relative">
                                <img src={currentTemplate?.previewImageUrl} alt="Template Preview" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                    <p className="text-white text-sm font-medium">{currentTemplate?.sceneDescription}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Wizard Content */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-fit">
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
                            />
                        )}
                        {templateStep === 'Story' && (
                            <TemplateStoryStep 
                                project={project} 
                                updateProject={updateProject} 
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
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
                             <VideoSettings project={project} updateProject={updateProject} />
                        )}

                        {/* Navigation Actions */}
                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={handleTemplateBack} disabled={templateStep === 'Setup'} className="px-6 py-2 font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50">
                                Back
                            </button>
                            <button 
                                onClick={templateStep === 'Production' ? handleGenerate : handleTemplateNext} 
                                disabled={isLoading || (templateStep === 'Setup' && project.ugcType === 'product_showcase' && !project.ugcProductFile)}
                                className="px-8 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center gap-2"
                            >
                                {isLoading && templateStep === 'Production' ? (
                                    <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Generating...</>
                                ) : templateStep === 'Production' ? (
                                     <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                                ) : (
                                    'Next'
                                )}
                            </button>
                        </div>
                         {error && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}
                    </div>
                </div>
                 <AvatarTemplateModal
                    isOpen={isAvatarModalOpen}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onSelect={handleSelectTemplateCharacter}
                />
            </div>
        );
    }

    // Standard Render
    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-4 md:hidden">Create UGC Video</h2>
                <div className="md:hidden mb-6 border-b dark:border-gray-700">
                    <div className="flex overflow-x-auto gap-1 p-1.5">
                        {standardSteps.map(step => (
                             <button
                                key={step.name}
                                onClick={() => setCurrentStep(step.name)}
                                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-semibold transition-colors ${currentStep === step.name ? 'bg-brand-accent text-on-accent' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                {step.icon}
                                {step.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="hidden md:block md:col-span-1">
                        <h2 className="text-2xl font-bold mb-4">Create UGC Video</h2>
                        <nav className="space-y-2">
                            {standardSteps.map(step => (
                                <button
                                    key={step.name}
                                    onClick={() => setCurrentStep(step.name)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-semibold transition-colors ${currentStep === step.name ? 'bg-brand-accent text-on-accent' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {step.icon}
                                    {step.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="md:col-span-3">
                        <div className="md:min-h-[60vh]">
                          {currentStep === 'Product' && <ProductStep project={project} updateProject={updateProject} isAnalyzing={isAnalyzing} handleUGCProductUpload={handleUGCProductUpload} handleUGCProductScraped={handleUGCProductScraped} setIsLoading={setIsLoading} setGenerationStatusMessages={setGenerationStatusMessages} setError={setError} />}
                          {currentStep === 'Action' && <ActionStep project={project} updateProject={updateProject} />}
                          {currentStep === 'Dialogue' && <DialogueStep project={project} updateProject={updateProject} />}
                          {currentStep === 'Scene' && <SceneStep project={project} updateProject={updateProject} />}
                          {currentStep === 'Avatar' && <AvatarStep project={project} updateProject={updateProject} onOpenTemplateModal={() => setIsAvatarModalOpen(true)} />}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8">
                <div className="flex flex-col-reverse sm:flex-row sm:items-end sm:justify-between gap-6">
                    <div className={`flex-1 ${!isStandardLastStep ? 'hidden sm:block' : ''}`}>
                        {isStandardLastStep && <VideoSettings project={project} updateProject={updateProject} />}
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={handleStandardBack}
                            disabled={isLoading || isStandardFirstStep}
                            className="action-btn !w-auto !px-6 !py-3 !text-base"
                        >
                        Back
                        </button>
                        <button
                            onClick={isStandardLastStep ? handleGenerate : handleStandardNext}
                            disabled={isLoading}
                            className="flex-1 sm:flex-initial sm:w-auto px-6 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading && isStandardLastStep ? (
                                <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div><span>Generating...</span></>
                            ) : isStandardLastStep ? (
                                <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                            ) : (
                                <span>Next</span>
                            )}
                        </button>
                    </div>
                </div>
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
}> = ({
    project, updateProject, isAnalyzing, handleUGCProductUpload, handleUGCProductScraped, setIsLoading, setGenerationStatusMessages, setError
}) => {
    const isShowcase = project.ugcType === 'product_showcase';
    const useTemplateAvatar = project.ugcAvatarSource !== 'upload' && project.ugcAvatarSource !== 'ai';

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => updateProject({ ugcType: 'talking_head' })}
                    className={`p-6 border-2 rounded-xl text-center transition-all ${project.ugcType === 'talking_head' ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}
                >
                    <span className="text-2xl block mb-2">🗣️</span>
                    <h3 className="font-bold text-lg">Just Talking</h3>
                    <p className="text-sm text-gray-500">Avatar talks directly to camera</p>
                </button>
                <button 
                     onClick={() => updateProject({ ugcType: 'product_showcase' })}
                     className={`p-6 border-2 rounded-xl text-center transition-all ${isShowcase ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}
                >
                    <span className="text-2xl block mb-2">🛍️</span>
                    <h3 className="font-bold text-lg">Selling a Product</h3>
                    <p className="text-sm text-gray-500">Avatar interacts with a product</p>
                </button>
            </div>

            {isShowcase && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="font-bold mb-4">Upload Product</h4>
                     <div className="space-y-4">
                         <ProductScraper
                            onProductScraped={handleUGCProductScraped}
                            setIsLoading={setIsLoading}
                            setStatusMessages={setGenerationStatusMessages}
                            setError={setError}
                        />
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-700" /></div>
                            <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                        </div>
                         {isAnalyzing ? (
                            <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <div style={{ borderColor: '#91EB23', borderTopColor: 'transparent' }} className="w-8 h-8 border-4 rounded-full animate-spin"></div>
                            </div>
                        ) : project.ugcProductFile ? (
                            <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <AssetPreview asset={project.ugcProductFile} objectFit="contain" />
                                <button onClick={() => updateProject({ ugcProductFile: null, productName: '', productDescription: '' })} className="absolute top-2 right-2 bg-white dark:bg-gray-900/50 dark:hover:bg-gray-900/80 backdrop-blur-sm rounded-full p-1 shadow-md">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Uploader onUpload={handleUGCProductUpload} title="Upload Product Image" subtitle="" compact />
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <div>
                    <span className="font-bold block text-gray-900 dark:text-gray-200">Use Template Character?</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Uncheck to customize the avatar</span>
                </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={useTemplateAvatar} 
                        onChange={() => {
                             // If unchecking, set to 'ai' to enable customization step. If checking, remove custom fields to revert to 'template default' (conceptually)
                            if (useTemplateAvatar) {
                                updateProject({ ugcAvatarSource: 'ai' });
                            } else {
                                updateProject({ ugcAvatarSource: 'template', ugcAvatarFile: null, ugcAvatarDescription: '' });
                            }
                        }} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
                </label>
            </div>
        </div>
    );
};

const TemplateStoryStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; isLoading: boolean; setIsLoading: (l: boolean) => void; }> = ({ project, updateProject, isLoading, setIsLoading }) => {
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

    const handleMagicScript = async () => {
        setIsGeneratingScript(true);
        try {
            const productInfo = project.productName ? { productName: project.productName, productDescription: project.productDescription } : undefined;
            const script = await generateScriptFromTemplate(project.ugcSceneDescription || "A generic scene", productInfo);
            updateProject({ ugcScript: script });
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="font-bold text-lg">Script</label>
                    <button 
                        onClick={handleMagicScript} 
                        disabled={isGeneratingScript || isLoading}
                        className="text-sm text-brand-accent font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                        {isGeneratingScript ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-4 h-4"/>}
                        Write for me
                    </button>
                </div>
                <textarea
                    value={project.ugcScript}
                    onChange={(e) => updateProject({ ugcScript: e.target.value })}
                    placeholder="Enter what the avatar should say..."
                    className="w-full p-4 border rounded-lg h-40 input-focus-brand"
                />
            </div>
            <div>
                <label className="font-bold text-lg block mb-2">Action</label>
                <textarea
                     value={project.ugcAction}
                     onChange={(e) => updateProject({ ugcAction: e.target.value })}
                     className="w-full p-4 border rounded-lg h-24 input-focus-brand bg-gray-50 dark:bg-gray-700/30"
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <GenericSelect label="Voice" options={['Auto', 'Male', 'Female'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcVoice || 'Auto'} onSelect={(v) => updateProject({ ugcVoice: v as string })} />
                <GenericSelect label="Language" options={['English'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcLanguage || 'English'} onSelect={(v) => updateProject({ ugcLanguage: v as string })} />
            </div>
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
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold mb-4">Customize Avatar</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-bold text-sm">Description</label>
                            <button onClick={handleSuggestAvatar} disabled={isSuggesting} className="text-xs text-brand-accent font-semibold hover:underline flex items-center gap-1">
                                {isSuggesting ? 'Thinking...' : <><SparklesIcon className="w-3 h-3"/> Suggest</>}
                            </button>
                        </div>
                         <textarea
                            value={project.ugcAvatarDescription}
                            onChange={(e) => updateProject({ ugcAvatarDescription: e.target.value, ugcAvatarFile: null, ugcAvatarSource: 'ai' })}
                            placeholder="Describe the person..."
                            className="w-full p-3 border rounded-lg h-32 input-focus-brand"
                        />
                    </div>
                    <div>
                         <label className="font-bold text-sm block mb-2">Or Upload Image</label>
                         {project.ugcAvatarFile ? (
                            <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <AssetPreview asset={project.ugcAvatarFile} objectFit="cover" />
                                <button onClick={() => updateProject({ ugcAvatarFile: null })} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><XMarkIcon className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <Uploader onUpload={handleAvatarUpload} compact title="Upload Photo" />
                        )}
                         <button onClick={onOpenTemplateModal} className="mt-2 w-full text-center text-sm font-semibold text-brand-accent hover:underline">
                            Pick from Library
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- STANDARD STEPS (Reused) ---
// ... (Existing Step Components: ProductStep, ActionStep, DialogueStep, SceneStep, AvatarStep) ...
// Included in the full file above for completeness, but functionally unchanged except for slight styling tweaks.

const ProductStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    isAnalyzing: boolean;
    handleUGCProductUpload: (file: UploadedFile) => void;
    handleUGCProductScraped: (data: { name: string; description: string; file: UploadedFile | null; url: string; }) => void;
    setIsLoading: (loading: boolean) => void;
    setGenerationStatusMessages: (messages: string[]) => void;
    setError: (error: string | null) => void;
}> = ({
    project,
    updateProject,
    isAnalyzing,
    handleUGCProductUpload,
    handleUGCProductScraped,
    setIsLoading,
    setGenerationStatusMessages,
    setError
}) => {
    const isUGCAndMissingProductInfo = !project.ugcProductFile && !project.productName;
    const isChecked = !project.ugcProductFile && !project.productName;
    const shouldShowDetails = project.ugcProductFile || project.productName || isAnalyzing;

    return (
        <div>
            <h3 className="text-xl font-bold mb-1">Product Placement</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Feature a product in the video. You can import from a URL or upload an image.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left Column */}
                <div className="space-y-6">
                    <ProductScraper
                        onProductScraped={handleUGCProductScraped}
                        setIsLoading={setIsLoading}
                        setStatusMessages={setGenerationStatusMessages}
                        setError={setError}
                    />
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-700" /></div>
                        <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm">Upload Product Image</label>
                        {isAnalyzing ? (
                            <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <div style={{ borderColor: '#91EB23', borderTopColor: 'transparent' }} className="w-8 h-8 border-4 rounded-full animate-spin"></div>
                            </div>
                        ) : project.ugcProductFile ? (
                            <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <AssetPreview asset={project.ugcProductFile} objectFit="contain" />
                                <button onClick={() => updateProject({ ugcProductFile: null, productName: '', productDescription: '' })} className="absolute top-2 right-2 bg-white dark:bg-gray-900/50 dark:hover:bg-gray-900/80 backdrop-blur-sm rounded-full p-1 shadow-md">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Uploader onUpload={handleUGCProductUpload} title="Upload Product Image" subtitle="(Optional)" />
                        )}
                    </div>
                     <div className="mt-4 flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-black/20">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-300">I don't want to feature a product.</span>
                        <label className="relative inline-flex items-center cursor-default">
                            <input type="checkbox" checked={isChecked} readOnly className="sr-only" />
                            <div className={`w-11 h-6 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${isChecked ? 'bg-brand-accent after:translate-x-full' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        </label>
                    </div>
                </div>

                {/* Right Column */}
                {shouldShowDetails && (
                    <div className="flex flex-col gap-6 h-full">
                        <div>
                            <label htmlFor="productName" className={`block mb-2 text-sm ${isUGCAndMissingProductInfo ? 'text-gray-400 dark:text-gray-600' : ''}`}>Product Name</label>
                            {isAnalyzing ? (
                                <div className="w-full p-4 h-[58px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            ) : (
                                <input type="text" id="productName" value={project.productName || ''} onChange={e => updateProject({ productName: e.target.value })} placeholder="e.g., The Cozy Slipper" 
                                className="w-full p-4 border rounded-lg input-focus-brand disabled:opacity-60" disabled={isUGCAndMissingProductInfo} />
                            )}
                        </div>
                        <div className="flex-grow flex flex-col">
                            <label htmlFor="productDescription" className={`block mb-2 text-sm ${isUGCAndMissingProductInfo ? 'text-gray-400 dark:text-gray-600' : ''}`}>Product Description</label>
                            {isAnalyzing ? (
                                <div className="w-full p-4 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse flex-grow"></div>
                            ) : (
                                <textarea id="productDescription" value={project.productDescription || ''} onChange={e => updateProject({ productDescription: e.target.value })} placeholder="e.g., A warm and comfortable slipper..."
                                    className="w-full p-4 border rounded-lg h-full flex-grow input-focus-brand disabled:opacity-60" disabled={isUGCAndMissingProductInfo}></textarea>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const ActionStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; }> = ({ project, updateProject }) => (
    <div>
        <h3 className="text-xl font-bold mb-1">Action & Behavior</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">What should the person be doing in the video?</p>
        <textarea
            value={project.ugcAction}
            onChange={(e) => updateProject({ ugcAction: e.target.value })}
            placeholder="e.g., Unboxing a package with excitement, pointing to a graphic on screen, demonstrating how to use a product, showing a before-and-after result..."
            className="w-full p-3 border rounded-lg min-h-[10rem] input-focus-brand"
        />
    </div>
);

const DialogueStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; }> = ({ project, updateProject }) => (
    <div>
        <h3 className="text-xl font-bold mb-1">Dialogue & Voice</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Enter the script and choose the voice characteristics.</p>
        <textarea
            value={project.ugcScript}
            onChange={(e) => updateProject({ ugcScript: e.target.value })}
            placeholder="Write the full script here..."
            className="w-full p-3 border rounded-lg min-h-[10rem] input-focus-brand"
        />
        <div className="mt-4 grid grid-cols-2 gap-4">
            <GenericSelect label="Voice" options={['Auto', 'Male', 'Female'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcVoice || 'Auto'} onSelect={(v) => updateProject({ ugcVoice: v as string })} />
            <GenericSelect label="Emotion" options={['Auto', 'Happy', 'Excited', 'Serious', 'Calm'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcEmotion || 'Auto'} onSelect={(v) => updateProject({ ugcEmotion: v as string })} />
            <GenericSelect label="Language" options={['English'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcLanguage || 'English'} onSelect={(v) => updateProject({ ugcLanguage: v as string })} />
            <GenericSelect label="Accent" options={['American', 'British', 'Australian'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcAccent || 'American'} onSelect={(v) => updateProject({ ugcAccent: v as string })} />
        </div>
    </div>
);

const SceneStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; }> = ({ project, updateProject }) => {
    return (
        <div>
            <h3 className="text-xl font-bold mb-1">Scene Description</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Describe the background and setting of the video.</p>
            <textarea
                value={project.ugcSceneDescription}
                onChange={(e) => updateProject({ ugcSceneDescription: e.target.value })}
                placeholder="e.g., A bright, modern kitchen with marble countertops..."
                className="w-full p-3 border rounded-lg min-h-[8rem] input-focus-brand"
            />
            <div className="mt-4">
                <p className="font-semibold text-sm mb-2">Or use a template:</p>
                <div className="flex flex-wrap gap-2">
                    {Object.keys(SCENE_TEMPLATES).map(key => (
                        <button
                            key={key}
                            onClick={() => updateProject({ ugcSceneDescription: SCENE_TEMPLATES[key] })}
                            className="px-3 py-1.5 text-sm rounded-full border bg-gray-100 dark:bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-[#1C1E20]"
                        >
                            {key}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AvatarStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; onOpenTemplateModal: () => void; }> = ({ project, updateProject, onOpenTemplateModal }) => {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h3 className="text-xl font-bold mb-1">Avatar</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Describe the person you want to see, or choose an image.</p>
            </div>
            
            <div className="flex flex-col gap-4">
                <textarea
                    value={project.ugcAvatarDescription}
                    onChange={(e) => updateProject({ ugcAvatarDescription: e.target.value, ugcAvatarFile: null, ugcAvatarSource: 'ai' })}
                    placeholder="Describe the person... e.g., A friendly woman in her late 30s with blonde hair, wearing a casual sweater..."
                    className="w-full p-3 border rounded-lg h-24 input-focus-brand"
                />
                
                <div className="flex flex-wrap gap-2">
                     {AVATAR_DESCRIPTIONS.map(desc => (
                        <button
                            key={desc.title}
                            onClick={() => updateProject({ ugcAvatarDescription: desc.description, ugcAvatarFile: null, ugcAvatarSource: 'ai' })}
                            className="px-3 py-1.5 text-sm rounded-full border bg-gray-100 dark:bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-[#1C1E20]"
                        >
                            {desc.title}
                        </button>
                    ))}
                </div>

                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-700" /></div>
                    <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                </div>
                
                {project.ugcAvatarFile ? (
                    <div className="relative w-full max-w-xs h-auto aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <AssetPreview asset={project.ugcAvatarFile} />
                        <button onClick={() => updateProject({ ugcAvatarFile: null })} className="absolute top-2 right-2 bg-white dark:bg-gray-900/50 dark:hover:bg-gray-900/80 backdrop-blur-sm rounded-full p-1 shadow-md">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="max-w-xs">
                        <Uploader onUpload={(file) => updateProject({ ugcAvatarFile: file, ugcAvatarDescription: '', ugcAvatarSource: 'upload' })} title="Upload Avatar Image" subtitle="" compact />
                        <button onClick={onOpenTemplateModal} className="mt-2 w-full text-center text-sm font-semibold text-brand-accent hover:underline">
                            Choose from template characters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const VideoSettings: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; }> = ({ project, updateProject }) => {
    const aspectRatios = [
        { value: '9:16', label: '9:16', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
        { value: '16:9', label: '16:9', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
        { value: '1:1', label: '1:1', icon: <AspectRatioSquareIcon className="w-5 h-5" /> },
    ];
    return (
        <div>
            <h3 className="text-lg font-bold mb-2">Video Settings</h3>
            <div className="flex flex-wrap gap-4">
                <div className="min-w-[150px]">
                    <GenericSelect label="Video Model" options={VIDEO_MODELS} selectedValue={project.videoModel || 'veo-3.1-fast-generate-preview'} onSelect={(value) => updateProject({ videoModel: value as string })} />
                </div>
                <div className="min-w-[150px]">
                     <GenericSelect label="Aspect Ratio" options={aspectRatios} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} />
                </div>
            </div>
        </div>
    );
};
