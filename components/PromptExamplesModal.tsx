import React, { useState, useEffect, useCallback } from 'react';
import { generatePromptSuggestions } from '../services/geminiService';
import type { Project } from '../types';
import { ArrowPathIcon, LightbulbIcon } from './icons';

interface PromptExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  project: Project;
}

export const PromptExamplesModal: React.FC<PromptExamplesModalProps> = ({ isOpen, onClose, onSelect, project }) => {
  const [examples, setExamples] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExamples = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const suggestions = await generatePromptSuggestions(project.mode, { productName: project.productName, productDescription: project.productDescription });
      setExamples(suggestions);
    } catch (e) {
      setError('Could not fetch suggestions. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [project.mode, project.productName, project.productDescription]);


  useEffect(() => {
    if (isOpen) {
      fetchExamples();
    }
  }, [isOpen, fetchExamples]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                <LightbulbIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Prompt Suggestions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">AI-generated ideas to get you started.</p>
            </div>
        </div>
        
        <div className="mt-4 h-64 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              {error}
            </div>
          ) : (
            <ul className="space-y-2">
              {examples.map((example, index) => (
                <li key={index}>
                  <button
                    onClick={() => { onSelect(example); onClose(); }}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="text-gray-800 dark:text-gray-200">{example}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
            <button
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
                Close
            </button>
            <button
                onClick={fetchExamples}
                disabled={isLoading}
                className="w-full sm:flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
            </button>
        </div>
      </div>
    </div>
  );
};