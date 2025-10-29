import React, { useState, useEffect, useCallback } from 'react';
import { generateCampaignInspiration, elaborateArtDirection } from '../services/geminiService';
import type { Project, CampaignInspiration, CampaignBrief } from '../types';
import { ArrowPathIcon, LightbulbIcon } from './icons';

interface CampaignInspirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  project: Project;
}

export const CampaignInspirationModal: React.FC<CampaignInspirationModalProps> = ({ isOpen, onClose, onSelect, project }) => {
  const [campaigns, setCampaigns] = useState<CampaignInspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isElaborating, setIsElaborating] = useState<number | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!project.campaignBrief) {
        setError("Please upload a product image first to generate a campaign brief.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const suggestions = await generateCampaignInspiration(project.campaignBrief);
      setCampaigns(suggestions);
    } catch (e) {
      setError('Could not fetch campaign ideas. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [project.campaignBrief]);


  useEffect(() => {
    if (isOpen) {
      fetchCampaigns();
    }
  }, [isOpen, fetchCampaigns]);
  
  const handleUseDirection = async (campaign: CampaignInspiration, index: number) => {
      if (!project.campaignBrief) return;
      setIsElaborating(index);
      try {
          const detailedPrompt = await elaborateArtDirection(campaign.artDirection, project.campaignBrief);
          onSelect(detailedPrompt);
          onClose();
      } catch (e: any) {
          setError(e.message || "Could not elaborate on the art direction. Please try again.");
          console.error("Failed to elaborate art direction", e);
      } finally {
          setIsElaborating(null);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                <LightbulbIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Campaign Inspiration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">AI-generated campaign concepts to kickstart your marketing.</p>
            </div>
        </div>
        
        <div className="mt-4 max-h-[60vh] min-h-[24rem] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400">"{campaign.hook}"</h4>
                    <div className="mt-3 space-y-3 text-sm">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Strategy:</p>
                            <p className="text-gray-600 dark:text-gray-300">{campaign.strategy}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Concept:</p>
                            <p className="text-gray-600 dark:text-gray-300">{campaign.concept}</p>
                        </div>
                         <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Art Direction:</p>
                            <p className="text-gray-600 dark:text-gray-300">{campaign.artDirection}</p>
                        </div>
                    </div>
                    <div className="mt-4 text-right">
                         <button
                            onClick={() => handleUseDirection(campaign, index)}
                            disabled={isElaborating !== null}
                            className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 text-xs w-40 h-7 flex items-center justify-center disabled:bg-blue-400"
                         >
                            {isElaborating === index ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Use this art direction'
                            )}
                         </button>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
            <button
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
                Close
            </button>
            <button
                onClick={fetchCampaigns}
                disabled={isLoading}
                className="w-full sm:flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
            </button>
        </div>
      </div>
    </div>
  );
};