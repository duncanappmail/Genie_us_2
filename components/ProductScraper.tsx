import React, { useState } from 'react';
import { scrapeProductDetailsFromUrl, fetchScrapedProductImage } from '../services/geminiService';
import type { UploadedFile, ScrapedProductDetails } from '../types';
import { ProductSelectionModal } from './ProductSelectionModal';
import { MagnifyingGlassIcon } from './icons';

interface ProductScraperProps {
  onProductScraped: (data: { name: string, description: string, file: UploadedFile }) => void;
  setIsLoading: (isLoading: boolean) => void;
  setStatusMessages: (messages: string[]) => void;
  setError: (error: string | null) => void;
}

export const ProductScraper: React.FC<ProductScraperProps> = ({ onProductScraped, setIsLoading, setStatusMessages, setError }) => {
    const [url, setUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [scrapedProducts, setScrapedProducts] = useState<ScrapedProductDetails[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleScrape = async () => {
        if (!url) return;
        setIsScraping(true);
        setError(null);
        setStatusMessages(['Scraping product info...']);
        setIsLoading(true);

        try {
            const products = await scrapeProductDetailsFromUrl(url);
            if (products.length === 0) {
                throw new Error("No products found at that URL.");
            } else if (products.length === 1) {
                await handleProductSelection(products[0]);
            } else {
                setScrapedProducts(products);
                setIsModalOpen(true);
                setIsLoading(false); 
                // isScraping remains true until modal is handled
            }
        } catch (e: any) {
            setError(e.message || "Failed to retrieve product information.");
            setIsLoading(false);
            setStatusMessages([]);
            setIsScraping(false); // End on error
        }
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setStatusMessages([]); // Clear messages if user cancels
        setIsScraping(false); // End the flow on cancel
    };

    const handleProductSelection = async (product: ScrapedProductDetails) => {
        setIsModalOpen(false);
        // isScraping should already be true
        setError(null);
        setStatusMessages(['Fetching product image...']);
        setIsLoading(true);

        try {
            const file = await fetchScrapedProductImage(product.imageUrl, url, product.productName);
            onProductScraped({
                name: product.productName,
                description: product.productDescription,
                file,
            });
        } catch (e: any) {
            setError(e.message || "Failed to retrieve the product image.");
        } finally {
            setIsLoading(false);
            setIsScraping(false); // End on completion/error of this step
            setStatusMessages([]);
        }
    };

    return (
        <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-800/50">
            <label htmlFor="productUrl" className="font-semibold block mb-2">1. Import from URL</label>
            <div className="flex gap-2">
                <input
                    id="productUrl"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter your product page URL..."
                    className="w-full p-3 border rounded-lg"
                />
                <button
                    onClick={handleScrape}
                    disabled={isScraping || !url}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2 shrink-0"
                >
                    {isScraping ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <MagnifyingGlassIcon className="w-5 h-5" />
                    )}
                    Retrieve
                </button>
            </div>
            <ProductSelectionModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                products={scrapedProducts}
                onSelect={handleProductSelection}
            />
        </div>
    );
};