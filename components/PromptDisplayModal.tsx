import React from 'react';
import { DocumentTextIcon } from './icons';

interface PromptDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  title?: string;
}

export const PromptDisplayModal: React.FC<PromptDisplayModalProps> = ({ isOpen, onClose, prompt, title = "Original Prompt" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
            <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        
        <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg max-h-64 overflow-y-auto">
          <p className="text-black dark:text-gray-200 whitespace-pre-wrap">{prompt}</p>
        </div>

        <div className="mt-6 flex">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};