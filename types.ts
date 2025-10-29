import type { Modality } from "@google/genai";

export interface UploadedFile {
    id: string;
    base64?: string;
    mimeType: string;
    name: string;
    blob: Blob;
}

export type CreativeMode = 'Product Ad' | 'Art Maker' | 'Video Maker' | 'Create a UGC Video' | 'AI Agent';
export type PlanName = 'Free' | 'Basic' | 'Pro';

export interface Project {
    id: string;
    userId: string;
    createdAt: number;
    mode: CreativeMode;
    prompt: string;
    productFile: UploadedFile | null;
    productName: string;
    productDescription: string;
    campaignBrief: CampaignBrief | null;
    generatedImages: UploadedFile[];
    generatedVideos: UploadedFile[];
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    batchSize: number;
    stylePreset: string | null;
    useCinematicQuality: boolean;
    startFrame?: UploadedFile | null;
    endFrame?: UploadedFile | null;
    negativePrompt: string;
    referenceFiles: UploadedFile[];
    videoToExtend?: UploadedFile;
    highLevelGoal?: string;
    publishingPackage?: PublishingPackage | null;
    campaignInspiration?: CampaignInspiration | null;
    campaignStrategy?: string | null;
    // For UGC Factory
    ugcScript?: string;
    ugcAvatarFile?: UploadedFile | null;
    ugcProductFile?: UploadedFile | null;
    ugcAction?: string;
    ugcVoice?: string;
    ugcEmotion?: string;
    ugcLanguage?: string;
    ugcAccent?: string;
    ugcSceneDescription?: string;
}

export interface User {
    email: string;
    subscription: Subscription | null;
    credits: Credits | null;
    paymentMethod: PaymentMethod | null;
}

export interface Subscription {
    plan: PlanName;
    billingCycle: 'monthly' | 'annually';
    renewsOn: number;
    cancelAtPeriodEnd?: boolean;
}

export interface Credits {
    current: number;
    total: number;
}

export interface PaymentMethod {
    brand: string;
    last4: string;
    expiry: string;
}

export type TemplateCategory = 'All' | 'Holidays & Events' | 'Seasonal' | 'Studio' | 'Lifestyle' | 'Surreal';

export interface Template {
    id: string;
    title: string;
    description: string;
    category: TemplateCategory;
    previewImageUrl: string;
    promptTemplate: string;
    imageGenerationPrompt: string;
    activeMonths?: number[];
}

export interface CampaignBrief {
    productName: string;
    productDescription: string;
    targetAudience: string;
    keySellingPoints: string[];
    brandVibe: string;
}

export interface AdCopy {
    headline: string;
    body: string;
    cta: string;
}

export interface CampaignInspiration {
    hook: string;
    strategy: string;
    concept: string;
    artDirection: string;
}

export interface ScrapedProductDetails {
    productName: string;
    productDescription: string;
}

export interface CampaignPackage {
    brief: CampaignBrief;
    inspiration: CampaignInspiration;
    finalImage: UploadedFile;
    publishingPackage: PublishingPackage;
    strategy: string;
}

export interface PlatformPublishingContent {
    caption: string;
    hashtags?: string[];
    title?: string;
    audioSuggestion?: string;
}

export interface PublishingPackage {
    instagram: PlatformPublishingContent;
    tiktok: PlatformPublishingContent;
    youtube: PlatformPublishingContent;
    x?: PlatformPublishingContent;
}

export interface PlatformPublishingContentWithVariations {
    caption: string[];
    hashtags?: string[][];
    title?: string[];
    audioSuggestion?: string[];
}

export interface PublishingPackageWithVariations {
    instagram: PlatformPublishingContentWithVariations;
    tiktok: PlatformPublishingContentWithVariations;
    youtube: PlatformPublishingContentWithVariations;
    x?: PlatformPublishingContentWithVariations;
}