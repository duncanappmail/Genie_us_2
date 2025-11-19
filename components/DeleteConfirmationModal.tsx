import React from 'react';
import { ModalWrapper } from './ModalWrapper';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-md p-6">
          <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Project</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Are you sure you want to delete this project? This action cannot be undone.</p>
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
    </ModalWrapper>
  );
};