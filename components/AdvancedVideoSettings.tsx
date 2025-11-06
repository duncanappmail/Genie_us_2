

import React, { useState } from 'react';
import type { Project, UploadedFile } from '../types';
import { Uploader } from './Uploader';
import { AssetPreview } from './AssetPreview';
import { CameraIcon, ChevronDownIcon, ArrowLongDownIcon, ArrowLongLeftIcon, ArrowLongRightIcon, ArrowLongUpIcon, PlusIcon, XMarkIcon } from './icons';

interface AdvancedVideoSettingsProps {
    project: Project;
    updateProject: (updates: Partial<Project>) => void;
}

export const AdvancedVideoSettings: React.FC<AdvancedVideoSettingsProps> = ({ project, updateProject }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleFrameUpload = (uploadedFile: UploadedFile, type: 'start' | 'end') => {
        if (type === 'start') updateProject({ startFrame: uploadedFile });
        else updateProject({ endFrame: uploadedFile });
    };

    return (
        <div className="mt-8 border-t pt-8">
            <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full text-left">
                <h3 className="text-xl font-bold">Advanced Settings</h3>
                <ChevronDownIcon className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Cinematic Quality */}
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div>
                            <label htmlFor="cinematicQuality" className="font-semibold">Cinematic Quality</label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Higher quality, slower generation.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="cinematicQuality" checked={project.useCinematicQuality} onChange={e => updateProject({ useCinematicQuality: e.target.checked })} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {/* Camera Controls */}
                    <div>
                         <label className="font-semibold block mb-3">Camera Controls</label>
                         <div className="flex flex-wrap gap-2">
                            {[
                                { name: 'Pan Left', icon: <ArrowLongLeftIcon className="w-4 h-4" /> },
                                { name: 'Pan Right', icon: <ArrowLongRightIcon className="w-4 h-4" /> },
                                { name: 'Tilt Up', icon: <ArrowLongUpIcon className="w-4 h-4" /> },
                                { name: 'Tilt Down', icon: <ArrowLongDownIcon className="w-4 h-4" /> },
                                { name: 'Zoom In', icon: <PlusIcon className="w-4 h-4" /> },
                                { name: 'Dolly Zoom', icon: <CameraIcon className="w-4 h-4"/> }
                            ].map(control => (
                                <button key={control.name} onClick={() => updateProject({ prompt: `${project.prompt} ${control.name}`.trim() })} className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2">
                                    {control.icon} {control.name}
                                </button>
                            ))}
                         </div>
                    </div>
                    {/* Storyboarding */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="font-semibold block mb-2">Starting Image</label>
                            {project.startFrame ? (
                                <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    <AssetPreview asset={project.startFrame} />
                                    <button onClick={() => updateProject({ startFrame: undefined })} className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 rounded-full p-1 shadow-md">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : <Uploader onUpload={(file) => handleFrameUpload(file, 'start')} compact />}
                        </div>
                         <div>
                            <label className="font-semibold block mb-2">Ending Image</label>
                             {project.endFrame ? (
                                <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    <AssetPreview asset={project.endFrame} />
                                    <button onClick={() => updateProject({ endFrame: undefined })} className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 rounded-full p-1 shadow-md">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : <Uploader onUpload={(file) => handleFrameUpload(file, 'end')} compact />}
                        </div>
                    </div>
                    {/* Negative Prompt */}
                    <div className="md:col-span-2">
                        <label htmlFor="negativePrompt" className="font-semibold block mb-2">Negative Prompt</label>
                        <input type="text" id="negativePrompt" value={project.negativePrompt} onChange={e => updateProject({ negativePrompt: e.target.value })} placeholder="e.g., text, watermark, blurry" 
                            className="w-full p-4 border rounded-lg" />
                    </div>
                </div>
            )}
        </div>
    )
};