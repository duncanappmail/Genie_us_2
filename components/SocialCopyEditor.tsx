import React, { useState, useEffect } from 'react';
import type { Project, PublishingPackage, PublishingPackageWithVariations, PlatformPublishingContentWithVariations } from '../types';
import { regenerateFieldCopy } from '../services/geminiService';
import {
    SparklesIcon, InstagramIcon, TiktokIcon, YoutubeIcon, XIcon,
    LeftArrowIcon, RightArrowIcon
} from './icons';

type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'x';

interface SocialCopyEditorProps {
    project: Project;
}

export const SocialCopyEditor: React.FC<SocialCopyEditorProps> = ({ project }) => {
    const [activeTab, setActiveTab] = useState<SocialPlatform>('instagram');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [editablePackage, setEditablePackage] = useState<PublishingPackageWithVariations | null>(null);
    const [copyIndexes, setCopyIndexes] = useState({
        instagram: { caption: 0, hashtags: 0, title: 0, audioSuggestion: 0 },
        tiktok: { caption: 0, hashtags: 0, title: 0, audioSuggestion: 0 },
        youtube: { caption: 0, hashtags: 0, title: 0, audioSuggestion: 0 },
        x: { caption: 0, hashtags: 0, title: 0, audioSuggestion: 0 },
    });
    const [regeneratingField, setRegeneratingField] = useState<string | null>(null);

    useEffect(() => {
        if (project.publishingPackage) {
            const { publishingPackage } = project;
            const variationalPackage: PublishingPackageWithVariations = {
                instagram: {
                    caption: [publishingPackage.instagram.caption],
                    hashtags: [publishingPackage.instagram.hashtags || []],
                },
                tiktok: {
                    caption: [publishingPackage.tiktok.caption],
                    hashtags: [publishingPackage.tiktok.hashtags || []],
                    audioSuggestion: [publishingPackage.tiktok.audioSuggestion || ''],
                },
                youtube: {
                    title: [publishingPackage.youtube.title || ''],
                    caption: [publishingPackage.youtube.caption],
                    hashtags: [publishingPackage.youtube.hashtags || []],
                },
                x: publishingPackage.x ? {
                    caption: [publishingPackage.x.caption],
                    hashtags: [publishingPackage.x.hashtags || []],
                } : undefined,
            };
            setEditablePackage(variationalPackage);
        }
    }, [project.publishingPackage]);


    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleRegenerateCopy = async (
        platform: SocialPlatform,
        field: keyof PlatformPublishingContentWithVariations
    ) => {
        if (!project.campaignBrief || !editablePackage) return;
        const fieldKey = `${platform}-${field}`;
        setRegeneratingField(fieldKey);

        try {
            const currentValuesRaw = editablePackage[platform][field] || [];
            const currentValues: string[] = field === 'hashtags'
                ? (currentValuesRaw as string[][]).map(h => h.join(' '))
                : currentValuesRaw as string[];

            const newValue = await regenerateFieldCopy(
                project.campaignBrief,
                project.prompt,
                platform,
                field as any,
                currentValues,
                project.highLevelGoal
            );

            setEditablePackage(prev => {
                if (!prev) return null;
                const newPackage = JSON.parse(JSON.stringify(prev));
                newPackage[platform][field].push(newValue);
                return newPackage;
            });

            setCopyIndexes(prev => ({
                ...prev,
                [platform]: { ...prev[platform], [field]: (editablePackage[platform][field] || []).length }
            }));

        } catch (e) {
            console.error("Regeneration failed", e);
        } finally {
            setRegeneratingField(null);
        }
    };

    const handleNavigateCopy = (
        platform: SocialPlatform,
        field: keyof PlatformPublishingContentWithVariations,
        direction: 'next' | 'prev'
    ) => {
        const total = (editablePackage?.[platform]?.[field] || []).length;
        if (total <= 1) return;

        setCopyIndexes(prev => {
            const currentIndex = prev[platform][field as keyof typeof prev.instagram];
            let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (newIndex >= total) newIndex = 0;
            if (newIndex < 0) newIndex = total - 1;

            return { ...prev, [platform]: { ...prev[platform], [field]: newIndex } };
        });
    };

    const renderEditableField = (
        platform: SocialPlatform,
        field: keyof PlatformPublishingContentWithVariations,
        label: string
    ) => {
        if (!editablePackage || !editablePackage[platform] || editablePackage[platform][field] === undefined) return null;

        const variations = editablePackage[platform][field] || [];
        const currentIndex = copyIndexes[platform][field as keyof typeof copyIndexes.instagram] || 0;
        const currentValue = variations[currentIndex];
        const fieldKey = `${platform}-${field}`;
        const isRegenerating = regeneratingField === fieldKey;
        const isHashtags = field === 'hashtags';

        const textToCopy = (Array.isArray(currentValue) ? currentValue.join(' ') : currentValue) || '';

        const displayValue = (
            isHashtags && Array.isArray(currentValue) && currentValue.length > 0 ?
                currentValue.map(h => `#${h.replace(/#/g, '')}`).join(' ') :
                Array.isArray(currentValue) ? '' : currentValue
        ) || '';

        return (
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-sm block">{label}</label>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleRegenerateCopy(platform, field)}
                            disabled={isRegenerating}
                            className="text-sm font-regular text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 transition-colors"
                        >
                            {isRegenerating ? '...' : 'Regenerate copy'}
                        </button>
                        <button
                            onClick={() => handleCopy(textToCopy, fieldKey)}
                            className="text-sm font-regular text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        >
                            {copiedField === fieldKey ? 'Copied!' : 'Copy text'}
                        </button>
                    </div>
                </div>
                <div className="w-full p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md text-sm whitespace-pre-wrap">{displayValue}</div>
                {variations.length > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-1">
                        <button onClick={() => handleNavigateCopy(platform, field, 'prev')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><LeftArrowIcon className="w-4 h-4" /></button>
                        <span className="text-xs font-mono">{currentIndex + 1} / {variations.length}</span>
                        <button onClick={() => handleNavigateCopy(platform, field, 'next')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><RightArrowIcon className="w-4 h-4" /></button>
                    </div>
                )}
            </div>
        );
    };

    const tabs: { id: SocialPlatform, name: string, icon: React.ReactNode }[] = [
        { id: 'instagram', name: 'Instagram', icon: <InstagramIcon className="w-5 h-5" /> },
        { id: 'tiktok', name: 'TikTok', icon: <TiktokIcon className="w-5 h-5" /> },
        { id: 'x', name: 'X', icon: <XIcon className="w-4 h-4" /> },
        { id: 'youtube', name: 'YouTube Shorts', icon: <YoutubeIcon className="w-5 h-5" /> },
    ];

    if (!editablePackage) {
        return <div className="text-center p-8 text-sm text-gray-500">No social media copy available for this project.</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border h-full">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                    <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">Social Media Copy</h3>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex whitespace-nowrap overflow-x-auto hide-scrollbar" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-300' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'} flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.icon} {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-4 space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                {renderEditableField(activeTab, 'title', 'Title')}
                {renderEditableField(activeTab, 'caption', 'Caption')}
                {renderEditableField(activeTab, 'hashtags', 'Hashtags')}
                {renderEditableField(activeTab, 'audioSuggestion', 'Audio Suggestion')}
            </div>
        </div>
    );
};