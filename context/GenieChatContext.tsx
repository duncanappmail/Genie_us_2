import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { Chat } from "@google/genai";
import type { ChatMessage, UploadedFile } from '../types';
import { createGenieSession, generateGenieResponse } from '../services/genieService';
import { useUI } from './UIContext';
import { useProjects } from './ProjectContext';
import { useAuth } from './AuthContext';

type GenieChatContextType = {
    isOpen: boolean;
    toggleChat: () => void;
    messages: ChatMessage[];
    sendMessage: (text: string, attachments?: UploadedFile[]) => Promise<void>;
    isTyping: boolean;
    clearHistory: () => void;
};

const GenieChatContext = createContext<GenieChatContextType | undefined>(undefined);

export const GenieChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'model',
            text: "I can help you brainstorm ideas, write scripts, create a campaign, or suggest marketing strategies. Just ask!",
            timestamp: Date.now(),
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    
    // Keep the chat session instance persistent across renders
    const chatSessionRef = useRef<Chat | null>(null);

    // Access other contexts to provide "Over-the-shoulder" awareness
    const { appStep } = useUI();
    const { currentProject } = useProjects();
    const { user } = useAuth();

    const toggleChat = () => setIsOpen(prev => !prev);

    const clearHistory = () => {
        setMessages([{
            id: `welcome_${Date.now()}`,
            role: 'model',
            text: "History cleared. What shall we work on next?",
            timestamp: Date.now(),
        }]);
        // Reset the underlying model session
        chatSessionRef.current = createGenieSession();
    };

    const sendMessage = async (text: string, attachments: UploadedFile[] = []) => {
        if (!text.trim() && attachments.length === 0) return;

        // 1. Add User Message
        const userMsg: ChatMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            text: text,
            attachments: attachments,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // 2. Initialize Session if needed
        if (!chatSessionRef.current) {
            chatSessionRef.current = createGenieSession();
        }

        // 3. Get Response
        try {
            const rawResponseText = await generateGenieResponse(
                chatSessionRef.current, 
                text, 
                {
                    screen: appStep,
                    project: currentProject,
                    brandProfile: user?.brandProfile
                },
                attachments
            );

            // 4. Parse for Rich UI JSON
            let displayText = rawResponseText;
            let uiType: ChatMessage['uiType'] = undefined;
            let uiData: any = undefined;

            // Regex to find :::GENIE_UI_JSON { ... } :::
            const jsonMatch = rawResponseText.match(/:::GENIE_UI_JSON\s*([\s\S]*?)\s*:::/);
            
            if (jsonMatch && jsonMatch[1]) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    uiType = parsed.type;
                    uiData = parsed.data;
                    // Remove the JSON block from the visible text
                    displayText = rawResponseText.replace(jsonMatch[0], '').trim();
                } catch (e) {
                    console.error("Failed to parse Genie UI JSON:", e);
                }
            }

            const genieMsg: ChatMessage = {
                id: `genie_${Date.now()}`,
                role: 'model',
                text: displayText,
                timestamp: Date.now(),
                uiType,
                uiData
            };
            setMessages(prev => [...prev, genieMsg]);

        } catch (error) {
            console.error("Chat Error", error);
             const errorMsg: ChatMessage = {
                id: `error_${Date.now()}`,
                role: 'system',
                text: "Sorry, I encountered a magical interference. Please try again.",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <GenieChatContext.Provider value={{ isOpen, toggleChat, messages, sendMessage, isTyping, clearHistory }}>
            {children}
        </GenieChatContext.Provider>
    );
};

export const useGenieChat = () => {
    const context = useContext(GenieChatContext);
    if (context === undefined) {
        throw new Error('useGenieChat must be used within a GenieChatProvider');
    }
    return context;
};