import React from 'react';
import type { ScrapedProductDetails } from '../types';
import { SparklesIcon } from './icons';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: ScrapedProductDetails) => void;
  products: ScrapedProductDetails[];
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, onSelect, products }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Multiple Products Found</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please select the product you'd like to use.</p>
            </div>
        </div>
        
        <div className="mt-4 max-h-[60vh] min-h-[16rem] overflow-y-auto pr-2 space-y-3">
          {products.map((product, index) => (
            <button 
              key={index}
              onClick={() => onSelect(product)}
              className="w-full text-left p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
            >
              <h4 className="font-bold text-gray-900 dark:text-white">{product.productName}</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{product.productDescription}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};