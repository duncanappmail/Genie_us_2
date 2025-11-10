import React, { useState, useEffect, useRef } from 'react';
import type { Project, UploadedFile } from '../types';
import { PromptDisplayModal } from '../components/PromptDisplayModal';
import { PublishingAssistantModal } from '../components/PublishingAssistantModal';
import { AssetPreview } from '../components/AssetPreview';
import { SocialCopyEditor } from '../components/SocialCopyEditor';
import { CREDIT_COSTS } from '../App';
import { 
    ArrowDownTrayIcon, LeftArrowIcon, 
    PencilIcon, RightArrowIcon,
} from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { VideoLightbox } from '../components/VideoLightbox';

export const PreviewScreen: React.FC = () => {
    const { user } = useAuth();
    const {
        navigateTo, error, setError, setIsExtendModalOpen
    } = useUI();
    const {
        currentProject: project,
        handleRegenerate,
        handleAnimate,
        handleRefine,
        isRegenerating,
        isAnimating,
        isRefining,
    } = useProjects();

    const [imageIndex, setImageIndex] = useState(0);
    const [videoIndex, setVideoIndex] = useState(0);
    const [refinePrompt, setRefinePrompt] = useState('');
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [lightboxAsset, setLightboxAsset] = useState<UploadedFile | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    if (!project || !user) {
        return <div className="text-center p-8">Error: No active project or user.</div>;
    }

    const plan = user.subscription!.plan;

    useEffect(() => {
        if(project.generatedImages.length > 0) setImageIndex(project.generatedImages.length -1);
    }, [project.generatedImages.length]);
     useEffect(() => {
        if(project.generatedVideos.length > 0) setVideoIndex(project.generatedVideos.length -1);
    }, [project.generatedVideos.length]);
     useEffect(() => {
        if(error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
     }, [error, setError]);

    const downloadAsset = (asset: any) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(asset.blob);
        link.download = asset.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    const handleRefineSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleRefine(imageIndex, refinePrompt);
        setRefinePrompt('');
    };

    const handleRefineInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRefinePrompt(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handlePreviewClick = (asset: UploadedFile) => {
        if (asset.mimeType.startsWith('video/')) {
            setLightboxAsset(asset);
        }
    };
    
    const renderNav = (index: number, setIndex: React.Dispatch<React.SetStateAction<number>>, total: number) => (
        <div className="flex items-center justify-center gap-4 mt-4">
            <button onClick={() => setIndex(prev => Math.max(0, prev - 1))} disabled={index === 0} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">
                <LeftArrowIcon className="w-6 h-6" />
            </button>
            <span className="font-mono text-sm">{index + 1} / {total}</span>
            <button onClick={() => setIndex(prev => Math.min(total - 1, prev + 1))} disabled={index === total - 1} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">
                <RightArrowIcon className="w-6 h-6" />
            </button>
        </div>
    );

    const currentImage = project.generatedImages[imageIndex];
    const currentVideo = project.generatedVideos[videoIndex];
    const assetToPublish = currentVideo || currentImage;
    const credits = user.credits?.current ?? 0;

    const renderVisualSection = (asset: any, isImage: boolean) => (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col border">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => navigateTo(project.mode === 'Create a UGC Video' ? 'UGC_GENERATE' : 'GENERATE')} className="flex items-center gap-1 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    <LeftArrowIcon className="w-4 h-4" />
                    Back
                </button>
                <button onClick={() => setIsPromptModalOpen(true)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Show Prompt
                </button>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center aspect-square group">
                <AssetPreview asset={asset} onClick={handlePreviewClick} />
            </div>
            {isImage ? (
                project.generatedImages.length > 1 && renderNav(imageIndex, setImageIndex, project.generatedImages.length)
            ) : (
                project.generatedVideos.length > 1 && renderNav(videoIndex, setVideoIndex, project.generatedVideos.length)
            )}
            
            {isImage && (
                <div className="mt-4 flex-grow">
                     <form onSubmit={handleRefineSubmit} className="relative">
                        <textarea
                            ref={textareaRef}
                            rows={2}
                            value={refinePrompt}
                            onChange={handleRefineInputChange}
                            placeholder="Want changes? Please describe"
                            className="w-full p-3 pr-44 border rounded-lg resize-none overflow-hidden transition-all focus:ring-2 focus:ring-blue-500 dark:border-gray-600 min-h-[4.5rem] hover:border-blue-400 dark:hover:border-blue-500"
                            disabled={credits < CREDIT_COSTS.refine}
                        />
                        <button
                            type="submit"
                            disabled={isRefining || !refinePrompt || credits < CREDIT_COSTS.refine}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 transition-colors text-sm"
                            aria-label="Generate changes"
                        >
                            {isRefining ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                `Generate (${CREDIT_COSTS.refine} credit)`
                            )}
                        </button>
                    </form>
                </div>
            )}
            
             <div className="mt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleRegenerate(isImage ? 'image' : 'video')} disabled={isRegenerating === (isImage ? 'image' : 'video')} className="action-btn">
                        {(isRegenerating === 'image' && isImage) || (isRegenerating === 'video' && !isImage)
                            ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            : 'Regenerate'
                        }
                    </button>
                    {isImage ? (
                        <button onClick={() => handleAnimate(imageIndex)} disabled={isAnimating === imageIndex || plan !== 'Pro' || credits < CREDIT_COSTS.animate} className="action-btn">
                            {isAnimating === imageIndex
                                ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                : `Animate${plan !== 'Pro' ? ' (Pro)' : ''}`
                            }
                        </button>
                    ) : (
                         <button onClick={() => setIsExtendModalOpen(true)} disabled={plan !== 'Pro' || credits < CREDIT_COSTS.videoExtend} className="action-btn">
                             Extend {plan !== 'Pro' ? '(Pro)' : `(${CREDIT_COSTS.videoExtend} Cr)`}
                        </button>
                    )}
                </div>
                 <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => downloadAsset(asset)} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Download
                    </button>
                    {!project.publishingPackage && (
                         <button onClick={() => setIsPublishModalOpen(true)} className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <PencilIcon className="w-5 h-5" />
                            Generate Copy For Your Socials
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 relative">
                <h2 className="text-3xl font-bold">Ta-da! As You Wished.</h2>
            </div>
            
            {error && <div className="mb-4 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">{error}</div>}

            {project.publishingPackage ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3">
                        {currentImage ? renderVisualSection(currentImage, true) : renderVisualSection(currentVideo, false)}
                    </div>
                    <div className="lg:col-span-2">
                        <SocialCopyEditor project={project} />
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    {currentImage ? renderVisualSection(currentImage, true) : renderVisualSection(currentVideo, false)}
                </div>
            )}
            
            <PromptDisplayModal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} prompt={project.prompt} />
            <PublishingAssistantModal 
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                asset={assetToPublish}
                project={project}
            />
            <VideoLightbox
                isOpen={!!lightboxAsset}
                onClose={() => setLightboxAsset(null)}
                asset={lightboxAsset}
            />
        </div>
    );
};