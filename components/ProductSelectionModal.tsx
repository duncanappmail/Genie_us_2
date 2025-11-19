import React from 'react';
import type { ScrapedProductDetails } from '../types';
import { ModalWrapper } from './ModalWrapper';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: ScrapedProductDetails) => void;
  products: ScrapedProductDetails[];
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, onSelect, products }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl p-6 flex flex-col">
          <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Multiple Products Found</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please select the product you'd like to use.</p>
          </div>
          
          <div className="mt-4 flex-1 space-y-3">
            {products.map((product, index) => (
              <button 
                key={index}
                onClick={() => onSelect(product)}
                className="w-full text-left p-4 border rounded-lg modal-content-bg dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
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
    </ModalWrapper>
  );
};