import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { Uploader } from '../components/Uploader';
import { AssetPreview } from '../components/AssetPreview';
import { XMarkIcon } from '../components/icons';
import type { UploadedFile, Project } from '../types';
import { CREDIT_COSTS } from '../App';

export const AgentScreen: React.FC = () => {
    const { user } = useAuth();
    const { isLoading, error } = useUI();
    const { 
        currentProject: project, 
        setCurrentProject: setProject,
        runAgent,
    } = useProjects();
    
    if (!project || !user) {
        return <div className="text-center p-8">Error: No active project or user.</div>;
    }
    
    const updateProject = (updates: Partial<Project>) => {
        setProject({ ...project, ...updates });
    };

    const handleFileUpload = (uploadedFile: UploadedFile) => {
        updateProject({ productFile: uploadedFile });
    };

    const cost = CREDIT_COSTS.agent;
    const hasEnoughCredits = (user.credits?.current ?? 0) >= cost;
    const isLaunchDisabled = isLoading || !project.productFile || !hasEnoughCredits;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">Your AI-Powered Marketing Strategist</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Provide your product and an optional goal. If you don't have a goal, our AI strategist will analyze your product, consider current trends, and autonomously craft a complete, ready-to-launch campaign from scratch.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div>
                        <label className="font-semibold block mb-2">1. Upload Product Image</label>
                        {project.productFile ? (
                            <div className="relative w-full h-auto aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <AssetPreview asset={project.productFile} />
                                <button onClick={() => updateProject({ productFile: null })} className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 rounded-full p-1 shadow-md">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Uploader onUpload={handleFileUpload} />
                        )}
                    </div>
                     <div>
                        <label htmlFor="highLevelGoal" className="font-semibold block mb-2">2. High-Level Goal (Optional)</label>
                        <textarea
                            id="highLevelGoal"
                            value={project.highLevelGoal || ''}
                            onChange={(e) => updateProject({ highLevelGoal: e.target.value })}
                            placeholder="e.g., Target a younger audience, make it feel luxurious, focus on a holiday theme."
                            className="w-full p-4 border rounded-lg h-36"
                        />
                    </div>
                </div>

                {error && <div className="mt-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">{error}</div>}
                
                {!hasEnoughCredits && !isLoading && (
                    <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-500/30 text-center">
                        Not enough credits. The AI Agent costs {cost} credits to run.
                    </div>
                )}
                
                <div className="mt-8 text-center">
                    <button onClick={runAgent} disabled={isLaunchDisabled} className="w-full sm:w-auto px-12 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center sm:mx-auto">
                        Generate ({cost} Credits)
                    </button>
                </div>
            </div>
        </div>
    );
};