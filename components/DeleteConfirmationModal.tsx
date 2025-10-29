import React from 'react';
import { TrashIcon } from './icons';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full">
            <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Project</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Are you sure you want to delete this project? This action cannot be undone.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={onConfirm}
            className="w-full sm:flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center justify-center"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};