import React, { useState } from 'react';
import type { Project, UploadedFile } from '../types';
import { AssetPreview } from '../components/AssetPreview';
import { ImageIcon, VideoIcon, MagnifyingGlassIcon, SparklesIcon, TrashIcon, LeftArrowIcon } from '../components/icons';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { VideoLightbox } from '../components/VideoLightbox';

export const AllProjectsScreen: React.FC = () => {
    const { projects, setCurrentProject, setProjectToDelete } = useProjects();
    const { navigateTo, goBack } = useUI();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | 'Images' | 'Videos'>('All');
    const [lightboxAsset, setLightboxAsset] = useState<UploadedFile | null>(null);
    
    const filteredProjects = projects.filter(p => {
        if (activeFilter === 'Images') return p.generatedImages.length > 0;
        if (activeFilter === 'Videos') return p.generatedVideos.length > 0;
        return true;
    }).filter(p => 
        (p.prompt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onViewProject = (project: Project) => {
        setCurrentProject(project);
        if (project.mode === 'AI Agent') {
            navigateTo('AGENT_RESULT');
        } else {
            navigateTo('PREVIEW');
        }
    };
    
    const handlePreviewClick = (asset: UploadedFile) => {
        if (asset.mimeType.startsWith('video/')) {
            setLightboxAsset(asset);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold mb-6 hover:text-blue-600">
                <LeftArrowIcon className="w-4 h-4"/> Back to Dashboard
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-center sm:text-left">Your Projects</h2>
                 <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button
                            onClick={() => setActiveFilter('All')}
                            className={`px-4 sm:px-6 py-2 text-sm font-semibold rounded-md transition-colors ${
                                activeFilter === 'All'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveFilter('Images')}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 text-sm font-semibold rounded-md transition-colors ${
                                activeFilter === 'Images'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60'
                            }`}
                        >
                            <ImageIcon className="w-5 h-5" /> Images
                        </button>
                        <button
                            onClick={() => setActiveFilter('Videos')}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 text-sm font-semibold rounded-md transition-colors ${
                                activeFilter === 'Videos'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60'
                            }`}
                        >
                            <VideoIcon className="w-5 h-5" /> Videos
                        </button>
                    </div>
                    <div className="relative flex-grow sm:flex-grow-0">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                        <input 
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
            {projects.length === 0 ? (
                 <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400">No projects have been created yet</h3>
                    <p className="mt-2 text-gray-500">Go back to the dashboard to start creating!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProjects.map(p => {
                        const previewAsset = p.generatedVideos[0] || p.generatedImages[0] || p.productFile;
                        return (
                            <div key={p.id} onClick={() => onViewProject(p)} className="cursor-pointer group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                                <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden">
                                    {previewAsset ? <AssetPreview asset={previewAsset} objectFit="cover" hoverEffect={true} onClick={handlePreviewClick} /> : <SparklesIcon className="w-12 h-12 text-gray-400" />}
                                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                        {p.generatedImages.length > 0 && <div className="flex items-center gap-1.5 text-sm text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm"><ImageIcon className="w-5 h-5"/>{p.generatedImages.length}</div>}
                                        {p.generatedVideos.length > 0 && <div className="flex items-center gap-1.5 text-sm text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm"><VideoIcon className="w-5 h-5"/>{p.generatedVideos.length}</div>}
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
            <VideoLightbox
                isOpen={!!lightboxAsset}
                onClose={() => setLightboxAsset(null)}
                asset={lightboxAsset}
            />
        </div>
    );
};