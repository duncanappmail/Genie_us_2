import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppStep } from '../App';

type UIContextType = {
    appStep: AppStep;
    navigateTo: (step: AppStep) => void;
    goBack: () => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    isExtendModalOpen: boolean;
    setIsExtendModalOpen: (isOpen: boolean) => void;
    isCancelModalOpen: boolean;
    setIsCancelModalOpen: (isOpen: boolean) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    agentStatusMessages: string[];
    setAgentStatusMessages: React.Dispatch<React.SetStateAction<string[]>>;
    generationStatusMessages: string[];
    setGenerationStatusMessages: React.Dispatch<React.SetStateAction<string[]>>;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appStep, setAppStep] = useState<AppStep>('AUTH');
    const [history, setHistory] = useState<AppStep[]>(['AUTH']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [theme, rawSetTheme] = useState<'light' | 'dark'>('light');
    const [agentStatusMessages, setAgentStatusMessages] = useState<string[]>([]);
    const [generationStatusMessages, setGenerationStatusMessages] = useState<string[]>([]);

    const setTheme = useCallback((newTheme: 'light' | 'dark') => {
        rawSetTheme(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }, [setTheme]);

    const navigateTo = useCallback((step: AppStep) => {
        setHistory(prev => [...prev, step]);
        setAppStep(step);
    }, []);

    const goBack = useCallback(() => {
        setHistory(prev => {
            if (prev.length <= 1) return prev;
            const newHistory = [...prev];
            newHistory.pop();
            const prevStep = newHistory[newHistory.length - 1] || 'HOME';
            setAppStep(prevStep);
            return newHistory;
        });
    }, []);

    const value: UIContextType = {
        appStep, navigateTo, goBack,
        isLoading, setIsLoading,
        error, setError,
        isExtendModalOpen, setIsExtendModalOpen,
        isCancelModalOpen, setIsCancelModalOpen,
        theme, setTheme,
        agentStatusMessages, setAgentStatusMessages,
        generationStatusMessages, setGenerationStatusMessages
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};