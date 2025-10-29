import React, { useState, useEffect, useRef } from 'react';
import type { UploadedFile, PublishingPackage, Project } from '../types';
import { ShareIcon } from './icons';
import { SocialCopyEditor } from './SocialCopyEditor';
import { useAuth } from '../context/AuthContext';
import { generatePublishingPackage } from '../services/geminiService';

interface PublishingAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: UploadedFile | null;
    project: Project | null;
}

export const PublishingAssistantModal: React.FC<PublishingAssistantModalProps> = ({ isOpen, onClose, project: initialProject }) => {
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(initialProject);
    const progressIntervalRef = useRef<number | null>(null);
    
    useEffect(() => {
        // This effect runs when the modal is opened.
        const generatePackage = async () => {
            if (isOpen && initialProject && !initialProject.publishingPackage) {
                if (!initialProject.campaignBrief) {
                    setError("A campaign brief is required. This feature works best with 'Product Ad' projects.");
                    return;
                }

                setIsLoading(true);
                setError(null);
                setProgress(0);
                
                progressIntervalRef.current = window.setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 95) {
                            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                            return 95;
                        }
                        return prev + 5;
                    });
                }, 200);

                try {
                    const pkg = await generatePublishingPackage(initialProject.campaignBrief, initialProject.prompt, initialProject.highLevelGoal);
                    setProject({ ...initialProject, publishingPackage: pkg });
                } catch (e: any) {
                    setError(e.message || "Could not generate publishing content.");
                } finally {
                    setIsLoading(false);
                }
            } else if (initialProject) {
                setProject(initialProject);
            }
        };
        
        generatePackage();

        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [isOpen, initialProject]);

    useEffect(() => {
        if (!isLoading) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setProgress(100);
        }
    }, [isLoading]);

    if (!isOpen) return null;

    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="flex flex-col items-center justify-center h-full pt-8 pb-4">
                    <p className="mb-4 text-gray-600 dark:text-gray-400">Your social media agent is preparing content...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.2s ease-in-out' }}></div>
                    </div>
                </div>
            );
        }
        if (error) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center text-red-500">
                    <p className="font-semibold">Generation Failed</p>
                    <p className="text-sm mt-1 text-red-400">{error}</p>
                </div>
            );
        }
        if (project?.publishingPackage) {
            return <SocialCopyEditor project={project} />;
        }
        return <p className="text-center text-gray-500">No content to display.</p>;
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                            <ShareIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Copy For Your Socials</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">I've crafted these words to enchant your audience.</p>
                        </div>
                    </div>

                    <div className="mt-4 max-h-[60vh] min-h-[16rem] overflow-y-auto pr-2">
                        {renderContent()}
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 rounded-b-2xl">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center text-sm text-blue-800 dark:text-blue-200">
                        <strong>How to post:</strong> 1. Copy text fields. 2. Open Socials app. 3. Paste text in the social app.
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row-reverse gap-3">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};