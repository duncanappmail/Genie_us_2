import React, { useState, useEffect } from 'react';
import type { CreativeMode, Project, Template } from '../types';
import { AssetPreview } from '../components/AssetPreview';
import { CameraIcon, FilmIcon, SparklesIcon, TrashIcon, DocumentTextIcon, UserCircleIcon, TshirtIcon, ImageIcon, VideoIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import { PromptDisplayModal } from '../components/PromptDisplayModal';

const GREETINGS = [
    'Ready to make some magic?',
    'What do you wish to create today?',
    'Your next creation is just a wish away.',
    'What would you like to create today?',
];

export const HomeScreen: React.FC = () => {
    const { user } = useAuth();
    const { navigateTo } = useUI();
    const { 
        projects, 
        startNewProject, 
        setCurrentProject, 
        setProjectToDelete, 
        selectTemplate,
    } = useProjects();
    
    const [promptToShow, setPromptToShow] = useState<string | null>(null);
    const [greeting, setGreeting] = useState(GREETINGS[0]);
    const recentProjects = projects.slice(0, 5);

    useEffect(() => {
        // Select a random greeting when the component mounts
        const randomIndex = Math.floor(Math.random() * GREETINGS.length);
        setGreeting(GREETINGS[randomIndex]);
    }, []);

    const plan = user?.subscription?.plan || 'Free';
    const modes = [
        { name: 'Product Ad', title: 'Create a Product Ad', description: 'Drop your product into any scene. Instant ad-ready!', enabled: true, icon: <TshirtIcon className="w-8 h-8 text-blue-500" /> },
        { name: 'Art Maker', title: 'Turn Ideas to Visuals', description: 'Create a scene, a moment, a piece of art.', enabled: true, icon: <ImageIcon className="w-8 h-8 text-blue-500" /> },
        { name: 'Create a UGC Video', title: 'Create a UGC Video', description: 'Generate a realistic presenter to deliver your message.', enabled: plan === 'Pro', icon: <UserCircleIcon className="w-8 h-8 text-blue-500" /> },
        { name: 'Video Maker', title: 'Make a Video', description: 'Create a video from an idea, or animate an image', enabled: plan === 'Pro', icon: <VideoIcon className="w-8 h-8 text-blue-500" /> },
        { name: 'AI Agent', title: 'Unleash Your Marketing Genie', description: "Hand me your product, and I'll grant you a complete marketing campaign", enabled: plan === 'Pro' },
    ];
    
    const nonAgentModes = modes.slice(0, 4);
    const agentMode = modes[4];

    // --- Dynamic Template Logic ---
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11
    const nextMonth = (currentMonth + 1) % 12;
    const isSecondHalfOfMonth = currentDate.getDate() > 15;

    const isHolidayOrEventActive = (template: Template): boolean => {
        if (!template.activeMonths) return false;
        return template.activeMonths.some(m => {
            if (m === currentMonth) return true;
            if (m === nextMonth && isSecondHalfOfMonth) return true;
            return false;
        });
    };

    const getSortValue = (month: number, currentMonth: number) => (month - currentMonth + 12) % 12;
    
    const activeHolidayTemplates = TEMPLATE_LIBRARY.filter(t =>
        t.category === 'Holidays & Events' && isHolidayOrEventActive(t)
    ).sort((a, b) => {
        const firstMonthA = a.activeMonths![0];
        const firstMonthB = b.activeMonths![0];
        return getSortValue(firstMonthA, currentMonth) - getSortValue(firstMonthB, currentMonth);
    });

    const activeSeasonalTemplates = TEMPLATE_LIBRARY.filter(t =>
        t.category === 'Seasonal' && t.activeMonths?.includes(currentMonth)
    );
    const studioTemplates = TEMPLATE_LIBRARY.filter(t => t.category === 'Studio');
    const lifestyleTemplates = TEMPLATE_LIBRARY.filter(t => t.category === 'Lifestyle');
    const surrealTemplates = TEMPLATE_LIBRARY.filter(t => t.category === 'Surreal');

    const prioritizedTemplates = [
        ...activeHolidayTemplates,
        ...activeSeasonalTemplates,
        ...studioTemplates,
        ...lifestyleTemplates,
        ...surrealTemplates
    ];

    const featuredTemplates = prioritizedTemplates
      .filter((template, index, self) => self.findIndex(t => t.id === template.id) === index)
      .slice(0, 4);
    // --- End Dynamic Template Logic ---
    
    const onViewProject = (project: Project) => {
        setCurrentProject(project);
        if (project.mode === 'AI Agent') {
            navigateTo('AGENT_RESULT');
        } else {
            navigateTo('PREVIEW');
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Mode Selection */}
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold">{greeting}</h2>
                <div className="mt-8 max-w-5xl mx-auto space-y-4">
                    {agentMode && (
                        <button
                            key={agentMode.name}
                            onClick={() => agentMode.enabled ? startNewProject(agentMode.name as CreativeMode) : navigateTo('PLAN_SELECT')}
                            className="w-full p-6 text-left rounded-xl hover:shadow-md transition-all border border-blue-200 dark:border-blue-800 relative hover:-translate-y-1 flex flex-col md:flex-row md:items-center justify-between bg-blue-50 dark:bg-blue-900/30"
                        >
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{agentMode.title}</h3>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">{agentMode.description}</p>
                            </div>
                            {!agentMode.enabled && (
                                <div className="mt-4 md:mt-0">
                                    <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full dark:bg-blue-800 dark:text-blue-200">
                                        Upgrade to unlock
                                    </span>
                                </div>
                            )}
                        </button>
                    )}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {nonAgentModes.map(mode => (
                            <button 
                                key={mode.name}
                                onClick={() => mode.enabled ? startNewProject(mode.name as CreativeMode) : navigateTo('PLAN_SELECT')}
                                className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 text-left relative hover:-translate-y-1 flex flex-col h-full"
                            >
                                {mode.icon}
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-4">{mode.title}</h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex-grow">{mode.description}</p>
                                {!mode.enabled && (
                                    <div className="mt-4">
                                        <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
                                            Upgrade to unlock
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Templates */}
            <div className="mb-16">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-left">Use Template</h2>
                    <button 
                        onClick={() => navigateTo('EXPLORE')}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm shrink-0"
                    >
                        Explore all templates
                    </button>
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {featuredTemplates.map((template: Template) => (
                        <div 
                            key={template.id} 
                            onClick={() => selectTemplate(template)}
                            className="cursor-pointer group relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-56"
                        >
                            <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                                {template.category}
                            </div>
                            <img src={template.previewImageUrl} alt={template.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-4 w-full">
                                <h3 className="text-white font-bold text-base">{template.title}</h3>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPromptToShow(template.imageGenerationPrompt);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                                aria-label="Show image generation prompt"
                            >
                                <DocumentTextIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Projects */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-center sm:text-left">Your Recent Projects</h2>
                {projects.length > 5 && (
                    <button 
                        onClick={() => navigateTo('ALL_PROJECTS')}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm shrink-0"
                    >
                        See all
                    </button>
                )}
            </div>
            {projects.length === 0 ? (
                 <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <h3 className="text-base font-normal text-gray-500 dark:text-gray-400">No projects have been created yet</h3>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recentProjects.map(p => {
                        const previewAsset = p.generatedVideos[0] || p.generatedImages[0] || p.productFile;
                        return (
                            <div key={p.id} onClick={() => onViewProject(p)} className="cursor-pointer group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                                <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden">
                                    {previewAsset ? <AssetPreview asset={previewAsset} objectFit="cover" hoverEffect={true} /> : <SparklesIcon className="w-12 h-12 text-gray-400" />}
                                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                        {p.generatedImages.length > 0 && <div className="flex items-center gap-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded-full"><CameraIcon className="w-3 h-3"/>{p.generatedImages.length}</div>}
                                        {p.generatedVideos.length > 0 && <div className="flex items-center gap-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded-full"><FilmIcon className="w-3 h-3"/>{p.generatedVideos.length}</div>}
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col flex-grow">
                                    <h3 className="font-bold truncate text-sm mb-1 flex-grow">{p.prompt || p.productName || p.mode}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.mode}</p>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setProjectToDelete(p);
                                            }}
                                            className="z-10 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                            aria-label="Delete project"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <PromptDisplayModal 
                isOpen={!!promptToShow}
                onClose={() => setPromptToShow(null)}
                prompt={promptToShow || ''}
                title="Image Generation Prompt"
            />
        </div>
    );
};