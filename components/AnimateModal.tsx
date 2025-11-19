import React, { useState, useEffect } from 'react';
import { VideoIcon } from './icons';
import { CREDIT_COSTS } from '../constants';
import { ModalWrapper } from './ModalWrapper';

interface AnimateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (prompt: string) => void;
    defaultPrompt?: string;
}

export const AnimateModal: React.FC<AnimateModalProps> = ({ isOpen, onClose, onConfirm, defaultPrompt }) => {
    const [prompt, setPrompt] = useState(defaultPrompt || '');

    useEffect(() => {
        if (isOpen) {
            setPrompt(defaultPrompt || "Slow cinematic pan, bringing the scene to life."); 
        }
    }, [isOpen, defaultPrompt]);

    const handleSubmit = () => {
        if(prompt) onConfirm(prompt);
    }

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-lg p-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Animate Image</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Describe the motion you want to see.</p>
                </div>
                <div className="mt-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Pan slowly to the right, adding a subtle zoom."
                        className="w-full p-3 border rounded-lg min-h-[6rem] input-focus-brand"
                        autoFocus
                    />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button onClick={handleSubmit} disabled={!prompt} className="w-full sm:w-auto px-6 py-2.5 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2">
                        <span>Animate</span>
                        <VideoIcon className="w-5 h-5" />
                        <span>{CREDIT_COSTS.base.animate}</span>
                    </button>
                    <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                        Cancel
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};