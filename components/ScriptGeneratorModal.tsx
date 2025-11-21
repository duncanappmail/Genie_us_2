

import React, { useState, useEffect, useCallback } from 'react';
import { generateUGCScriptIdeas } from '../services/geminiService';
import type { Project, BrandProfile, UGCScriptIdea } from '../types';
import { ModalWrapper } from './ModalWrapper';

interface ScriptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (script: string, scene: string, action: string) => void;
  project: Project;
  brandProfile?: BrandProfile | null;
}

export const ScriptGeneratorModal: React.FC<ScriptGeneratorModalProps> = ({ isOpen, onClose, onSelect, project, brandProfile }) => {
  const [ideas, setIdeas] = useState<UGCScriptIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const suggestions = await generateUGCScriptIdeas({
        topic: project.ugcTopic,
        productName: project.productName,
        productDescription: project.productDescription,
        brandProfile: brandProfile,
        ugcType: project.ugcType,
        sceneDescription: project.ugcSceneDescription // Pass existing scene description for context
      });
      setIdeas(suggestions);
    } catch (e) {
      setError('Could not generate script ideas. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [project.ugcTopic, project.productName, project.productDescription, project.ugcType, project.ugcSceneDescription, brandProfile]);

  useEffect(() => {
    if (isOpen) {
      fetchIdeas();
    }
  }, [isOpen, fetchIdeas]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="p-6 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Script, Scene & Action Ideas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                 {project.ugcTopic ? `Ideas about "${project.ugcTopic}"` : 'Ideas for your video'}
              </p>
          </div>
          
          <div className="px-6 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div></div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
            ) : (
              <div className="space-y-4 pb-6">
                  {ideas.map((idea, index) => (
                    <div key={index} className="p-5 border border-gray-200 rounded-xl modal-content-bg dark:border-gray-600 flex flex-col gap-3">
                        <h4 className="font-bold text-lg text-brand-accent">{idea.hook}</h4>
                        
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Script</p>
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{idea.script}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Scene</p>
                                <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-3">{idea.scene}</p>
                            </div>
                             <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Action</p>
                                <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-3">{idea.action}</p>
                            </div>
                        </div>

                        <div className="mt-2 text-right">
                            <button 
                                onClick={() => { onSelect(idea.script, idea.scene, idea.action); onClose(); }} 
                                className="w-full sm:w-auto px-6 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors text-sm"
                            >
                                Use this concept
                            </button>
                        </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="p-6 mt-auto flex flex-col sm:flex-row-reverse gap-3 flex-shrink-0 border-t border-gray-100 dark:border-gray-800">
              <button onClick={onClose} className="w-full sm:flex-1 p-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover flex items-center justify-center">Close</button>
              <button onClick={fetchIdeas} disabled={isLoading} className="action-btn w-full sm:flex-1">Try Again</button>
          </div>
        </div>
    </ModalWrapper>
  );
};