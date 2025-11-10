import React, { useEffect, useState } from 'react';
import type { UploadedFile } from '../types';

interface VideoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  asset: UploadedFile | null;
}

export const VideoLightbox: React.FC<VideoLightboxProps> = ({ isOpen, onClose, asset }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (asset?.blob) {
      const url = URL.createObjectURL(asset.blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [asset]);

  if (!isOpen || !asset || !objectUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Video player"
    >
      <div 
        className="relative w-full max-w-4xl max-h-full" 
        onClick={(e) => e.stopPropagation()}
      >
        <video 
          src={objectUrl} 
          className="w-full h-auto max-h-[90vh] rounded-lg" 
          controls 
          autoPlay 
          aria-label={asset.name}
        />
        <button 
          onClick={onClose} 
          className="absolute -top-2 -right-2 bg-white text-gray-800 rounded-full p-1.5 shadow-lg hover:bg-gray-200"
          aria-label="Close video player"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
