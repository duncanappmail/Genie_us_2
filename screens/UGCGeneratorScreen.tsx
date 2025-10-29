import React, { useState } from 'react';
import { CREDIT_COSTS } from '../App';
import { SparklesIcon, UGCImage, UGCAction, UGCAudioText, UGCBackground, XMarkIcon, AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon } from '../components/icons';
import type { Project, UploadedFile } from '../types';
import { Uploader } from '../components/Uploader';
import { AssetPreview } from '../components/AssetPreview';
import { GenericSelect } from '../components/GenericSelect';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';

type UGCStep = 'Image' | 'Action' | 'Dialogue' | 'Scene';

const TEMPLATE_CHARACTERS = [
    { name: 'Chloe', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1974&auto=format&fit=crop' },
    { name: 'Marcus', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop' },
    { name: 'Isabella', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop' },
    { name: 'Liam', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974&auto=format&fit=crop' },
];

const SCENE_TEMPLATES: Record<string, string> = {
    'Modern Kitchen': 'A close-up, eye-level shot in a bright, modern kitchen. The background features clean white marble countertops, stainless steel appliances, and soft, natural light coming from a large window, creating a fresh and professional look.',
    'Cozy Home Office': 'A medium shot in a cozy home office. The background includes a stylish wooden desk, a bookshelf filled with books, a comfortable chair, and a large window with soft, warm light. The atmosphere is professional yet relaxed and trustworthy.',
    'Living Room': 'A medium shot in a comfortable and stylish living room. The person is sitting on a plush sofa. The background includes a coffee table, a soft rug, and decorative plants. The lighting is warm and inviting, perfect for a friendly, relatable message.',
    'In a Car (Passenger)': 'A close-up shot from the passenger seat of a modern, clean car. The background shows a calm city street with some bokeh. The lighting is natural daylight from the window, creating a casual, on-the-go feel.',
    'Modern Bathroom': 'A medium shot in a clean, modern bathroom with bright, even lighting. The background has white tiles, a large mirror, and a few minimalist decorative plants, creating a fresh, clean, and trustworthy aesthetic.',
    'City Park': 'A medium shot in a beautiful city park on a sunny day. The background has green grass, lush trees, and a pathway with soft, out-of-focus details. The scene is bright and lively, conveying energy and positivity.',
    'Beach': 'A medium shot on a beautiful sandy beach with calm blue waves and a clear sky in the background. The sun is bright, creating a relaxed, happy, and aspirational atmosphere perfect for a vacation or lifestyle theme.'
};


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
    const { isLoading, error } = useUI();
    const {
        currentProject: project,
        setCurrentProject: setProject,
        handleGenerate,
    } = useProjects();
    
    const [currentStep, setCurrentStep] = useState<UGCStep>('Image');

    if (!project || !user) {
        return <div className="text-center p-8">Error: No active project.</div>;
    }

    const updateProject = (updates: Partial<Project>) => {
        if (project) {
            setProject({ ...project, ...updates });
        }
    };

    const handleSelectTemplateCharacter = async (character: { name: string, url: string }) => {
        const response = await fetch(character.url);
        const blob = await response.blob();
        const file = await fileToUploadedFile(blob, `${character.name}.jpg`);
        updateProject({ ugcAvatarFile: file });
    };
    
    const cost = CREDIT_COSTS.ugcVideo;

    const steps: { name: UGCStep, icon: React.ReactNode }[] = [
        { name: 'Image', icon: <UGCImage className="w-5 h-5" /> },
        { name: 'Action', icon: <UGCAction className="w-5 h-5" /> },
        { name: 'Dialogue', icon: <UGCAudioText className="w-5 h-5" /> },
        { name: 'Scene', icon: <UGCBackground className="w-5 h-5" /> },
    ];
    
    const stepOrder: UGCStep[] = ['Image', 'Action', 'Dialogue', 'Scene'];
    const isLastStep = currentStep === stepOrder[stepOrder.length - 1];

    const handleNext = () => {
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex < stepOrder.length - 1) {
            setCurrentStep(stepOrder[currentIndex + 1]);
        }
    };
    
    const handleBack = () => {
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(stepOrder[currentIndex - 1]);
        }
    };

    const renderCurrentStep = () => {
        switch(currentStep) {
            case 'Image': return <ImageStep project={project} updateProject={updateProject} onSelectTemplate={handleSelectTemplateCharacter} />;
            case 'Action': return <ActionStep project={project} updateProject={updateProject} />;
            case 'Dialogue': return <DialogueStep project={project} updateProject={updateProject} />;
            case 'Scene': return <SceneStep project={project} updateProject={updateProject} />;
            default: return null;
        }
    };
    
    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-4 md:hidden">Create UGC Video</h2>
                {/* Mobile Nav */}
                <div className="md:hidden mb-6 border-b dark:border-gray-700">
                    <div className="flex overflow-x-auto gap-1 p-1.5">
                        {steps.map(step => (
                             <button
                                key={step.name}
                                onClick={() => setCurrentStep(step.name)}
                                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-semibold transition-colors ${currentStep === step.name ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                {step.icon}
                                {step.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Desktop Nav */}
                    <div className="hidden md:block md:col-span-1">
                        <h2 className="text-2xl font-bold mb-4">Create UGC Video</h2>
                        <nav className="space-y-2">
                            {steps.map(step => (
                                <button
                                    key={step.name}
                                    onClick={() => setCurrentStep(step.name)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-semibold transition-colors ${currentStep === step.name ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {step.icon}
                                    {step.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Right Content */}
                    <div className="md:col-span-3">
                        <div className="min-h-[60vh]">
                          {renderCurrentStep()}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Settings & Actions Below Box */}
            <div className="mt-8">
                {isLastStep && (
                    <div className="mb-6">
                        <VideoSettings project={project} updateProject={updateProject} />
                    </div>
                )}
                <div className="flex w-full items-center justify-end gap-4">
                    <button
                        onClick={handleBack}
                        disabled={isLoading || currentStep === stepOrder[0]}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       Back
                    </button>
                    <button
                        onClick={isLastStep ? handleGenerate : handleNext}
                        disabled={isLoading}
                        className="flex-1 sm:flex-initial sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isLastStep && isLoading ? (
                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : isLastStep ? (
                            <SparklesIcon className="w-6 h-6" />
                        ) : null}
                        {isLastStep && isLoading
                            ? 'Generating...'
                            : isLastStep
                            ? `Generate (${cost} Credits)`
                            : 'Next'}
                    </button>
                </div>
                 {error && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}
            </div>
        </div>
    );
};

// --- Step Components ---

const ImageStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; onSelectTemplate: (c: any) => void; }> = ({ project, updateProject, onSelectTemplate }) => (
    <div>
        <h3 className="text-xl font-bold mb-1">Product Placement</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Upload your avatar, plus an optional product for placement in the video.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold mb-2 text-center">Upload Avatar</h4>
                 {project.ugcAvatarFile ? (
                    <div className="relative w-full h-auto aspect-square">
                        <AssetPreview asset={project.ugcAvatarFile} objectFit="cover" />
                        <button onClick={() => updateProject({ ugcAvatarFile: null })} className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 rounded-full p-1 shadow-md">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <Uploader onUpload={(file) => updateProject({ ugcAvatarFile: file })} />
                )}
            </div>
             <div>
                <h4 className="font-semibold mb-2 text-center">Upload Product (Optional)</h4>
                 {project.ugcProductFile ? (
                    <div className="relative w-full h-auto aspect-square">
                        <AssetPreview asset={project.ugcProductFile} objectFit="cover" />
                        <button onClick={() => updateProject({ ugcProductFile: null })} className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 rounded-full p-1 shadow-md">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <Uploader onUpload={(file) => updateProject({ ugcProductFile: file })} />
                )}
            </div>
        </div>
        <div className="mt-6">
            <h4 className="font-semibold mb-2">Or Choose a Template Character</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {TEMPLATE_CHARACTERS.map(char => (
                    <button key={char.name} onClick={() => onSelectTemplate(char)} className="relative rounded-lg overflow-hidden group border-2 border-transparent hover:border-blue-500 focus:border-blue-500 focus:outline-none">
                        <img src={char.url} alt={char.name} className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/40" />
                        <p className="absolute bottom-2 left-2 text-white font-bold text-sm">{char.name}</p>
                    </button>
                ))}
            </div>
        </div>
    </div>
);

const ActionStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; }> = ({ project, updateProject }) => (
    <div>
        <h3 className="text-xl font-bold mb-1">Describe the Action</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Add extra details to guide your character's behavior.</p>
        <textarea
            value={project.ugcAction || ''}
            onChange={(e) => updateProject({ ugcAction: e.target.value })}
            placeholder="e.g., 'Smiling', 'Pointing at screen', 'Looking excited'"
            className="w-full p-4 border rounded-lg h-48"
        />
    </div>
);

const DialogueStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; }> = ({ project, updateProject }) => {
    const voices = [{value: 'Auto', label: 'Auto'}, {value: 'Whisper', label: 'Whisper'}, {value: 'Soft', label: 'Soft'}, {value: 'Clear', label: 'Clear'}, {value: 'Friendly', label: 'Friendly'}, {value: 'Radio Voice', label: 'Radio Voice'}, {value: 'Deep', label: 'Deep'}, {value: 'High Pitch', label: 'High Pitch'}, {value: 'Raspy', label: 'Raspy'}];
    const emotions = [{value: 'Auto', label: 'Auto'}, {value: 'Happy', label: 'Happy'}, {value: 'Excited', label: 'Excited'}, {value: 'Professional', label: 'Professional'}, {value: 'Calm', label: 'Calm'}, {value: 'Playful', label: 'Playful'}, {value: 'Angry', label: 'Angry'}, {value: 'Serious', label: 'Serious'}, {value: 'Authoritative', label: 'Authoritative'}, {value: 'Surprised', label: 'Surprised'}];
    const languages = [{value: 'English', label: 'English'}, {value: 'Spanish', label: 'Spanish'}, {value: 'French', label: 'French'}, {value: 'German', label: 'German'}];
    const accents = [{value: 'American', label: 'American'}, {value: 'British', label: 'British'}];
    
    return (
        <div>
            <h3 className="text-xl font-bold mb-1">Dialogue</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Add the words your character will say.</p>
            <textarea
                value={project.ugcScript || ''}
                onChange={(e) => updateProject({ ugcScript: e.target.value })}
                placeholder="Type your character's speech here... (e.g., 'Hey there!')"
                className="w-full p-4 border rounded-lg h-48"
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
                <GenericSelect label="Voice" options={voices} selectedValue={project.ugcVoice || 'Auto'} onSelect={(v) => updateProject({ ugcVoice: v as string })} />
                <GenericSelect label="Emotion" options={emotions} selectedValue={project.ugcEmotion || 'Auto'} onSelect={(v) => updateProject({ ugcEmotion: v as string })} />
                <GenericSelect label="Language" options={languages} selectedValue={project.ugcLanguage || 'English'} onSelect={(v) => updateProject({ ugcLanguage: v as string })} />
                <GenericSelect label="Accent" options={accents} selectedValue={project.ugcAccent || 'American'} onSelect={(v) => updateProject({ ugcAccent: v as string })} />
            </div>
        </div>
    );
};

const SceneStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; }> = ({ project, updateProject }) => {
    return (
        <div>
            <h3 className="text-xl font-bold mb-1">Scene</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Describe the background scene for your video.</p>
             <textarea
                value={project.ugcSceneDescription || ''}
                onChange={(e) => updateProject({ ugcSceneDescription: e.target.value })}
                placeholder="e.g., A bright, modern kitchen with marble countertops."
                className="w-full p-4 border rounded-lg h-32"
            />
            <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Or get started with a template</h4>
                <div className="flex flex-wrap gap-2">
                    {Object.keys(SCENE_TEMPLATES).map(s => <button key={s} onClick={() => updateProject({ugcSceneDescription: SCENE_TEMPLATES[s]})} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">{s}</button>)}
                </div>
            </div>
        </div>
    );
};

const VideoSettings: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; }> = ({ project, updateProject }) => {
     const aspectRatios: { value: Project['aspectRatio']; label: string; icon: React.ReactNode; }[] = [
        { value: '9:16', label: '9:16 (Vertical)', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
        { value: '16:9', label: '16:9 (Horizontal)', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
        { value: '1:1', label: '1:1 (Square)', icon: <AspectRatioSquareIcon className="w-5 h-5" /> },
    ];
    return (
        <div className="grid grid-cols-2 gap-4">
            <GenericSelect
                label="Aspect Ratio"
                options={aspectRatios}
                selectedValue={project.aspectRatio}
                onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })}
            />
             <div className="flex flex-col">
                <label className="font-semibold block mb-2">Cinematic Quality</label>
                <div className="flex-grow flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Slow generation</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="cinematicQuality" checked={project.useCinematicQuality} onChange={e => updateProject({ useCinematicQuality: e.target.checked })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
             </div>
        </div>
    );
};