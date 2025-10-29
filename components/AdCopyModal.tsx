import React, { useState } from 'react';
import type { AdCopy } from '../types';
import { SparklesIcon } from './icons';

interface AdCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  adCopy: AdCopy[] | null;
  isLoading: boolean;
  error: string | null;
}

export const AdCopyModal: React.FC<AdCopyModalProps> = ({ isOpen, onClose, adCopy, isLoading, error }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
            <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generated Ad Copy</h3>
        </div>
        
        <div className="mt-4 max-h-[60vh] min-h-[16rem] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Generating, please wait...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-red-500">
              <p className="font-semibold">Generation Failed</p>
              <p className="text-sm mt-1 text-red-400">{error}</p>
            </div>
          ) : adCopy && adCopy.length > 0 ? (
            <div className="space-y-6">
              {adCopy.map((copy, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                  <div className="group relative">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 pr-16">{copy.headline}</h4>
                    <button 
                      onClick={() => handleCopy(copy.headline, index * 3)} 
                      className="absolute top-0 right-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400 font-semibold bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded"
                    >
                      {copiedIndex === index * 3 ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="mt-2 group relative">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap pr-16">{copy.body}</p>
                    <button 
                      onClick={() => handleCopy(copy.body, index * 3 + 1)} 
                      className="absolute top-0 right-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400 font-semibold bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded"
                    >
                      {copiedIndex === index * 3 + 1 ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                   <div className="mt-3 group relative">
                    <div className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-sm font-semibold px-3 py-1 rounded-full">
                      {copy.cta}
                    </div>
                     <button 
                      onClick={() => handleCopy(copy.cta, index * 3 + 2)} 
                      className="absolute top-0 right-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400 font-semibold bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded"
                    >
                      {copiedIndex === index * 3 + 2 ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-600 dark:text-gray-400 text-center pt-8">No ad copy generated.</p>}
        </div>

        <div className="mt-6 flex">
            <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};