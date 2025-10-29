import React, { useCallback, useRef, useState } from 'react';
import type { UploadedFile } from '../types';
import { SparklesIcon } from './icons'; // Using a relevant icon

interface UploaderProps {
  onUpload: (file: UploadedFile) => void;
  compact?: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const Uploader: React.FC<UploaderProps> = ({ onUpload, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      onUpload({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        base64,
        mimeType: file.type,
        name: file.name,
        blob: file,
      });
    } else {
      // You might want to show an error message to the user here
      console.error("Invalid file type. Please upload an image.");
    }
  }, [onUpload]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const uploaderClasses = `
    w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center
    cursor-pointer transition-all duration-300
    ${compact ? 'h-32' : 'h-48'}
    ${isDragging 
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
  `;

  return (
    <div
      className={uploaderClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <SparklesIcon className={`transition-transform duration-300 ${compact ? 'w-8 h-8' : 'w-10 h-10'} ${isDragging ? 'scale-110' : ''} text-gray-400 dark:text-gray-500`} />
      <p className={`font-semibold mt-3 ${compact ? 'text-sm' : 'text-base'} text-gray-600 dark:text-gray-400`}>
        {isDragging ? "Drop your image here" : "Drag & drop an image"}
      </p>
      <p className={`text-xs text-gray-500 dark:text-gray-500 ${compact ? 'mt-1' : 'mt-2'}`}>or click to browse</p>
    </div>
  );
};

export default Uploader;