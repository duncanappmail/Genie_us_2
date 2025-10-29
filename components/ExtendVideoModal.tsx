

import React, { useState, useEffect } from 'react';
import { FilmIcon } from './icons';
import { CREDIT_COSTS } from '../App';

interface ExtendVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (prompt: string) => void;
}

export const ExtendVideoModal: React.FC<ExtendVideoModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [prompt, setPrompt] = useState('');

    useEffect(() => {
        if (isOpen) setPrompt(''); // Reset prompt when modal opens
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if(prompt) onConfirm(prompt);
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                        <FilmIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Extend Video ({CREDIT_COSTS.videoExtend} Credits)</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Describe what should happen next in the scene.</p>
                    </div>
                </div>
                <div className="mt-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., ...and then the camera zooms out to reveal a beautiful mountain range."
                        className="w-full p-3 border rounded-lg min-h-[6rem] focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button onClick={handleSubmit} disabled={!prompt} className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-500">
                        Generate Extension
                    </button>
                    <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};