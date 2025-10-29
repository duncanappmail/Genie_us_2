import React, { useState, useEffect } from 'react';
import type { UploadedFile } from '../types';
import { SparklesIcon } from './icons';

interface AssetPreviewProps {
    asset: UploadedFile;
    objectFit?: 'contain' | 'cover';
    hoverEffect?: boolean;
}

export const AssetPreview: React.FC<AssetPreviewProps> = React.memo(({ asset, objectFit = 'contain', hoverEffect = false }) => {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        if (asset.blob) {
            const url = URL.createObjectURL(asset.blob);
            setObjectUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [asset.blob]);

    if (!objectUrl) {
        return <SparklesIcon className="w-12 h-12 text-gray-400" />;
    }
    
    const classes = `w-full h-full object-${objectFit} ${hoverEffect ? 'transition-transform duration-300 ease-in-out group-hover:scale-110' : ''}`;

    return (
        <div className="w-full h-full relative">
            {asset.mimeType.startsWith('video/') ? (
                <video src={objectUrl} className={classes} muted autoPlay loop playsInline />
            ) : (
                <img src={objectUrl} alt="Project preview" className={classes} />
            )}
        </div>
    );
});