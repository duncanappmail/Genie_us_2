import React from 'react';
import { ModalWrapper } from './ModalWrapper';

interface PromptDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  title?: string;
}

export const PromptDisplayModal: React.FC<PromptDisplayModalProps> = ({ isOpen, onClose, prompt, title = "Original Prompt" }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          
          <div className="mt-4 modal-content-bg p-4 rounded-lg flex-1">
            <p className="text-black dark:text-gray-200 whitespace-pre-wrap">{prompt}</p>
          </div>

          <div className="mt-6 flex">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-[#91EB23] text-[#050C26] font-bold rounded-lg hover:bg-[#75CB0C]"
            >
              Close
            </button>
          </div>
        </div>
    </ModalWrapper>
  );
};